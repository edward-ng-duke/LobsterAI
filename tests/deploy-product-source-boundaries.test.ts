import { spawnSync } from 'node:child_process';
import {
  copyFileSync,
  mkdirSync,
  mkdtempSync,
  renameSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { afterEach, describe, expect, test } from 'vitest';

import * as supplyChain from '../scripts/check-supply-chain.mjs';

const { resolveProductSourceSha } = supplyChain;

type ParseGitNameStatusZ = (output: Buffer) => string[] | undefined;
type GitFailureMode = 'nonzero' | 'enoent' | 'signal' | 'overflow' | 'malformed';
type GitRunnerOptions = {
  cwd: string;
  encoding?: BufferEncoding;
  maxBuffer?: number;
};
type GitRunnerResult = {
  error?: Error;
  status: number | null;
  signal: NodeJS.Signals | null;
  stdout: string | Buffer | null;
  stderr: string | Buffer | null;
};
type GitRunner = (args: string[], options: GitRunnerOptions) => GitRunnerResult;
type ProductSourceShaResolver = (root?: string) => string | undefined;
type CreateProductSourceShaResolver = (runGit?: GitRunner) => ProductSourceShaResolver;

const temporaryRoots: string[] = [];

const git = (root: string, ...args: string[]) => {
  const result = spawnSync('git', args, { cwd: root, encoding: 'utf8' });
  expect(result.status, `${result.stdout}\n${result.stderr}`).toBe(0);
  return result.stdout.trim();
};

const gitRaw = (root: string, ...args: string[]) => {
  const result = spawnSync('git', args, { cwd: root });
  expect(result.status, `${result.stdout.toString()}\n${result.stderr.toString()}`).toBe(0);
  expect(Buffer.isBuffer(result.stdout)).toBe(true);
  return result.stdout;
};

const parseGitNameStatusZ = (output: Buffer) => {
  const parser = (supplyChain as typeof supplyChain & {
    parseGitNameStatusZ?: ParseGitNameStatusZ;
  }).parseGitNameStatusZ;
  expect(parser, 'check-supply-chain.mjs must export parseGitNameStatusZ').toBeTypeOf('function');
  return parser?.(output);
};

const createProductSourceShaResolver = (runGit: GitRunner) => {
  const factory = (supplyChain as typeof supplyChain & {
    createProductSourceShaResolver?: CreateProductSourceShaResolver;
  }).createProductSourceShaResolver;
  expect(factory, 'check-supply-chain.mjs must export createProductSourceShaResolver')
    .toBeTypeOf('function');
  return (factory as CreateProductSourceShaResolver)(runGit);
};

const write = (root: string, relativePath: string, content: string) => {
  const target = path.join(root, relativePath);
  mkdirSync(path.dirname(target), { recursive: true });
  writeFileSync(target, content);
};

const commit = (root: string, message: string) => {
  git(root, 'add', '--all');
  git(root, 'commit', '--quiet', '-m', message);
  return git(root, 'rev-parse', 'HEAD');
};

const createRepository = () => {
  const root = mkdtempSync(path.join(tmpdir(), 'lobsterai-p03-product-source-'));
  temporaryRoots.push(root);
  git(root, 'init', '--quiet', '--initial-branch=main');
  git(root, 'config', 'user.name', 'P03 Tester');
  git(root, 'config', 'user.email', 'p03-tester@example.invalid');
  write(root, 'src/product.ts', 'export const version = 1;\n');
  const baseline = commit(root, 'feat: establish product baseline');
  return { root, baseline };
};

const createFailingGitRunner = (mode: GitFailureMode) => {
  let delegatedCalls = 0;
  let nameStatusCalls = 0;
  let nameStatusMaxBuffer: number | undefined;
  const runGit: GitRunner = (args, options) => {
    const isNameStatus = ['diff', 'diff-tree'].includes(args[0])
      && args.includes('--name-status');
    if (!isNameStatus) {
      delegatedCalls += 1;
      return spawnSync('git', args, options) as unknown as GitRunnerResult;
    }

    nameStatusCalls += 1;
    nameStatusMaxBuffer = options.maxBuffer;
    const result: GitRunnerResult = {
      status: 0,
      signal: null,
      stdout: Buffer.alloc(0),
      stderr: Buffer.alloc(0),
    };
    if (mode === 'nonzero') return { ...result, status: 42 };
    if (mode === 'enoent') {
      return {
        ...result,
        error: Object.assign(new Error('spawn git ENOENT'), { code: 'ENOENT' }),
        status: null,
      };
    }
    if (mode === 'signal') return { ...result, signal: 'SIGTERM', status: null };
    if (mode === 'overflow') {
      return {
        ...result,
        error: Object.assign(new Error('stdout maxBuffer length exceeded'), { code: 'ENOBUFS' }),
        status: null,
        stdout: Buffer.alloc(17 * 1024 * 1024, 0x61),
      };
    }
    return { ...result, stdout: Buffer.from('M\0docs/frozen.md') };
  };
  return {
    runGit,
    calls: () => ({ delegatedCalls, nameStatusCalls, nameStatusMaxBuffer }),
  };
};

afterEach(() => {
  temporaryRoots.splice(0).forEach(root => rmSync(root, { recursive: true, force: true }));
});

describe('parseGitNameStatusZ', () => {
  test('parses empty and legal single-path records without normalizing Unicode', () => {
    const records = [
      ['A', 'docs/caf\u00e9.md'],
      ['D', 'docs/deleted.md'],
      ['M', 'docs/cafe\u0301.md'],
      ['T', 'docs/type-changed.md'],
      ['U', 'docs/unmerged.md'],
      ['X', 'docs/unknown.md'],
      ['B', 'docs/broken-pairing.md'],
    ];
    const expectedPaths = records.map(([, relativePath]) => relativePath);

    expect(parseGitNameStatusZ(Buffer.alloc(0))).toEqual([]);
    expect(parseGitNameStatusZ(Buffer.from(
      records.map(([status, relativePath]) => `${status}\0${relativePath}\0`).join(''),
    ))).toEqual(expectedPaths);
  });

  test('parses R0/R100 and C0/C100 similarity boundaries with both paths', () => {
    const records = [
      ['R0', 'docs/r0-old.txt', 'scripts/r0-new.txt'],
      ['R100', 'docs/r100 old.txt', 'scripts/r100\tnew.txt'],
      ['C0', 'apps/c0-source.ts', 'tests/c0-copy.ts'],
      ['C100', 'apps/c100-source.ts', 'tests/c100-copy\nsource.ts'],
      ['C087', 'apps/c087-source.ts', 'tests/c087-copy.ts'],
    ];
    const expectedPaths = records.flatMap(([, oldPath, newPath]) => [oldPath, newPath]);

    expect(parseGitNameStatusZ(Buffer.from(
      records.map(([status, oldPath, newPath]) => `${status}\0${oldPath}\0${newPath}\0`).join(''),
    ))).toEqual(expectedPaths);
  });

  test('preserves a leading UTF-8 BOM as a path character without Unicode normalization', () => {
    const pathBytes = Buffer.concat([
      Buffer.from([0xef, 0xbb, 0xbf]),
      Buffer.from('docs/cafe\u0301.md'),
    ]);
    const output = Buffer.concat([Buffer.from('A\0'), pathBytes, Buffer.from([0])]);

    expect(parseGitNameStatusZ(output)).toEqual(['\uFEFFdocs/cafe\u0301.md']);
    expect(parseGitNameStatusZ(output)?.[0]).not.toBe('\uFEFFdocs/caf\u00e9.md');
  });

  test('parses 100,000 records within a constrained child-process heap', () => {
    const moduleUrl = new URL('../scripts/check-supply-chain.mjs', import.meta.url).href;
    const childScript = `
      import { parseGitNameStatusZ } from ${JSON.stringify(moduleUrl)};
      const recordCount = 100_000;
      const input = Buffer.allocUnsafe(888_890);
      let offset = 0;
      for (let index = 0; index < recordCount; index += 1) {
        offset += input.write('A', offset, 'ascii');
        input[offset++] = 0;
        offset += input.write(\`p\${index}\`, offset, 'utf8');
        input[offset++] = 0;
      }
      if (offset !== input.length) throw new Error(\`fixture size mismatch: \${offset}\`);
      const paths = parseGitNameStatusZ(input);
      if (paths?.length !== recordCount || paths[0] !== 'p0' || paths.at(-1) !== 'p99999') {
        throw new Error('parser did not preserve all paths');
      }
    `;
    const result = spawnSync(process.execPath, [
      '--max-old-space-size=24',
      '--input-type=module',
      '--eval',
      childScript,
    ], {
      cwd: path.dirname(fileURLToPath(import.meta.url)),
      encoding: 'utf8',
      timeout: 10_000,
    });

    expect(result.status, `${result.stdout}\n${result.stderr}`).toBe(0);
  });

  test.each([
    ['missing trailing NUL', Buffer.from('M\0docs/file.md')],
    ['truncated rename', Buffer.from('R100\0docs/old.md\0')],
    ['unknown status', Buffer.from('Z\0docs/file.md\0')],
    ['rename without similarity', Buffer.from('R\0docs/old.md\0docs/new.md\0')],
    ['out-of-range similarity', Buffer.from('C101\0docs/old.md\0docs/new.md\0')],
    ['empty path', Buffer.from('A\0\0')],
    ['extra path', Buffer.from('M\0docs/file.md\0docs/extra.md\0')],
    ['invalid UTF-8 path', Buffer.from([0x4d, 0x00, 0xc3, 0x28, 0x00])],
  ])('fails closed for malformed output: %s', (_label, output) => {
    expect(parseGitNameStatusZ(output)).toBeUndefined();
  });
});

describe('P03 product-source evidence boundaries', () => {
  test.each([
    ['name-status Git nonzero exit', 'nonzero'],
    ['name-status spawnSync.error / ENOENT', 'enoent'],
    ['name-status child signal', 'signal'],
    ['name-status stdout overflow above 16 MiB', 'overflow'],
    ['name-status malformed output producing parser undefined', 'malformed'],
  ] as const)('fails closed to the analyzed commit for %s', (_label, mode) => {
    const { root, baseline } = createRepository();
    write(root, 'docs/frozen.md', `frozen failure boundary: ${mode}\n`);
    const analyzedCommit = commit(root, `docs: add ${mode} failure boundary`);
    expect(resolveProductSourceSha(root)).toBe(baseline);

    const controlledGit = createFailingGitRunner(mode);
    const resolveWithFailure = createProductSourceShaResolver(controlledGit.runGit);
    expect(resolveWithFailure(root)).toBe(analyzedCommit);
    expect(controlledGit.calls()).toEqual({
      delegatedCalls: 2,
      nameStatusCalls: 1,
      nameStatusMaxBuffer: 16 * 1024 * 1024,
    });
  });

  test.each(['true', 'false'])(
    'keeps pathological UTF-8 frozen paths frozen with core.quotepath=%s',
    (quotePath) => {
      const { root, baseline } = createRepository();
      git(root, 'config', 'core.quotepath', quotePath);
      write(root, '改造计划/含 空格\t引号“与换行\n记录.md', '# frozen role record\n');
      write(root, '改造计划/Unicode-caf\u00e9-cafe\u0301.md', '# NFC and NFD\n');
      commit(root, 'docs: add pathological UTF-8 records');

      expect(resolveProductSourceSha(root)).toBe(baseline);
    },
  );

  test('ignores frozen documentation, plan, test, and role/evidence paths', () => {
    const { root, baseline } = createRepository();
    for (const [relativePath, content] of [
      ['docs/db/evidence.json', '{}\n'],
      ['改造计划/任务/P02/开发记录.md', '# P02 evidence\n'],
      ['tests/evidence/source.test.ts', 'export const evidence = true;\n'],
      ['.github/workflows/verification.yml', 'name: verification\n'],
      ['charts/lobsterai/values.yaml', 'replicas: 1\n'],
    ]) {
      write(root, relativePath, content);
      commit(root, `docs: add ${relativePath}`);
    }
    expect(resolveProductSourceSha(root)).toBe(baseline);
  });

  test.each([
    '.dockerignore',
    'docker/web/Dockerfile',
    'package.json',
    'package-lock.json',
    'tsconfig.base.json',
    'tsconfig.workspace.json',
    'vite.config.ts',
    'apps/web/src/image-input.ts',
    'libs/shared/types/src/image-input.ts',
    'scripts/image-input.mjs',
    'openclaw-extensions/example/package.json',
    'resources/image-input.txt',
    'SKILLs/example/SKILL.md',
  ])('advances source when frozen image input %s is added', (relativePath) => {
    const { root } = createRepository();
    write(root, relativePath, `image input: ${relativePath}\n`);
    const imageCommit = commit(root, `feat: add ${relativePath}`);
    expect(resolveProductSourceSha(root)).toBe(imageCommit);
  });

  test('advances source for image-input modify, delete, and cross-boundary rename', () => {
    const modified = createRepository();
    write(modified.root, 'apps/api/src/image-input.ts', 'export const version = 1;\n');
    commit(modified.root, 'feat: add API image input');
    write(modified.root, 'apps/api/src/image-input.ts', 'export const version = 2;\n');
    const modifyCommit = commit(modified.root, 'fix: modify API image input');
    expect(resolveProductSourceSha(modified.root)).toBe(modifyCommit);
    rmSync(path.join(modified.root, 'apps/api/src/image-input.ts'));
    const deleteCommit = commit(modified.root, 'fix: delete API image input');
    expect(resolveProductSourceSha(modified.root)).toBe(deleteCommit);

    const renamed = createRepository();
    write(renamed.root, 'docs/promoted.mjs', 'export const promoted = true;\n');
    commit(renamed.root, 'docs: stage future image input');
    mkdirSync(path.join(renamed.root, 'scripts'), { recursive: true });
    renameSync(
      path.join(renamed.root, 'docs/promoted.mjs'),
      path.join(renamed.root, 'scripts/promoted.mjs'),
    );
    const renameCommit = commit(renamed.root, 'feat: promote script into image input');
    expect(resolveProductSourceSha(renamed.root)).toBe(renameCommit);
  });

  test('fails closed by advancing source for an unknown path', () => {
    const { root } = createRepository();
    write(root, 'future-surface/input.bin', 'future image input\n');
    const unknownCommit = commit(root, 'feat: add unclassified source path');
    expect(resolveProductSourceSha(root)).toBe(unknownCommit);
  });

  test('advances source for an unknown UTF-8 path containing whitespace and newlines', () => {
    const { root } = createRepository();
    write(root, '未来产品/中文 空格\t引号“与换行\n输入.bin', 'future image input\n');
    const unknownCommit = commit(root, 'feat: add unclassified UTF-8 source path');

    expect(resolveProductSourceSha(root)).toBe(unknownCommit);
  });

  test('checks frozen and product paths on both sides of rename and copy records', () => {
    const frozenToProductRename = createRepository();
    write(frozenToProductRename.root, 'docs/重命名 源.txt', 'rename source\n');
    commit(frozenToProductRename.root, 'docs: add frozen rename source');
    mkdirSync(path.join(frozenToProductRename.root, 'scripts'), { recursive: true });
    renameSync(
      path.join(frozenToProductRename.root, 'docs/重命名 源.txt'),
      path.join(frozenToProductRename.root, 'scripts/重命名 目标.txt'),
    );
    const promotedRename = commit(frozenToProductRename.root, 'feat: promote frozen rename source');
    expect(resolveProductSourceSha(frozenToProductRename.root)).toBe(promotedRename);

    const productToFrozenRename = createRepository();
    write(productToFrozenRename.root, 'apps/api/降级 源.txt', 'rename source\n');
    commit(productToFrozenRename.root, 'feat: add product rename source');
    mkdirSync(path.join(productToFrozenRename.root, 'docs'), { recursive: true });
    renameSync(
      path.join(productToFrozenRename.root, 'apps/api/降级 源.txt'),
      path.join(productToFrozenRename.root, 'docs/降级 目标.txt'),
    );
    const demotedRename = commit(productToFrozenRename.root, 'docs: demote product rename source');
    expect(resolveProductSourceSha(productToFrozenRename.root)).toBe(demotedRename);

    const repeatedLines = Array.from({ length: 200 }, (_, index) => `copy line ${index}`).join('\n');
    const frozenToProductCopy = createRepository();
    write(frozenToProductCopy.root, 'docs/复制 源.txt', `${repeatedLines}\n`);
    commit(frozenToProductCopy.root, 'docs: add frozen copy source');
    mkdirSync(path.join(frozenToProductCopy.root, 'scripts'), { recursive: true });
    copyFileSync(
      path.join(frozenToProductCopy.root, 'docs/复制 源.txt'),
      path.join(frozenToProductCopy.root, 'scripts/复制 目标.txt'),
    );
    write(frozenToProductCopy.root, 'docs/复制 源.txt', `${repeatedLines}\nfrozen source changed\n`);
    const promotedCopy = commit(frozenToProductCopy.root, 'feat: copy frozen source into product');
    const promotedCopyOutput = gitRaw(
      frozenToProductCopy.root,
      'diff', '--name-status', '-z', '-M', '-C', `${promotedCopy}^`, promotedCopy,
    );
    expect(promotedCopyOutput.includes(Buffer.from('C100\0docs/复制 源.txt\0scripts/复制 目标.txt\0')))
      .toBe(true);
    expect(resolveProductSourceSha(frozenToProductCopy.root)).toBe(promotedCopy);

    const productToFrozenCopy = createRepository();
    write(productToFrozenCopy.root, 'apps/api/复制 源.txt', `${repeatedLines}\n`);
    commit(productToFrozenCopy.root, 'feat: add product copy source');
    mkdirSync(path.join(productToFrozenCopy.root, 'docs'), { recursive: true });
    copyFileSync(
      path.join(productToFrozenCopy.root, 'apps/api/复制 源.txt'),
      path.join(productToFrozenCopy.root, 'docs/复制 目标.txt'),
    );
    write(productToFrozenCopy.root, 'apps/api/复制 源.txt', `${repeatedLines}\nproduct source changed\n`);
    const demotedCopy = commit(productToFrozenCopy.root, 'docs: copy product source into frozen path');
    const demotedCopyOutput = gitRaw(
      productToFrozenCopy.root,
      'diff', '--name-status', '-z', '-M', '-C', `${demotedCopy}^`, demotedCopy,
    );
    expect(demotedCopyOutput.includes(Buffer.from('C100\0apps/api/复制 源.txt\0docs/复制 目标.txt\0')))
      .toBe(true);
    expect(resolveProductSourceSha(productToFrozenCopy.root)).toBe(demotedCopy);
  });

  test('allows test and role-record commits without invalidating product evidence', () => {
    const { root, baseline } = createRepository();
    write(root, 'tests/product.test.ts', 'export const fixture = true;\n');
    commit(root, 'test: add independent coverage');
    write(root, '改造计划/任务/P03/开发记录.md', '# development record\n');
    write(root, '改造计划/任务/P03/审核意见.md', '# review record\n');
    write(root, '改造计划/任务/P03/测试报告.md', '# test report\n');
    commit(root, 'docs: record role handoffs');

    expect(resolveProductSourceSha(root)).toBe(baseline);
  });

  test('invalidates stale evidence for product edits and test-to-product renames', () => {
    const edited = createRepository();
    write(edited.root, 'src/product.ts', 'export const version = 2;\n');
    const productEdit = commit(edited.root, 'fix: change product behavior');
    expect(resolveProductSourceSha(edited.root)).toBe(productEdit);

    const renamed = createRepository();
    write(renamed.root, 'tests/promoted.ts', 'export const promoted = true;\n');
    commit(renamed.root, 'test: stage promoted source');
    mkdirSync(path.join(renamed.root, 'src'), { recursive: true });
    renameSync(
      path.join(renamed.root, 'tests/promoted.ts'),
      path.join(renamed.root, 'src/promoted.ts'),
    );
    const renameCommit = commit(renamed.root, 'feat: promote test source into product');
    expect(resolveProductSourceSha(renamed.root)).toBe(renameCommit);
  });

  test('does not skip a merged product change behind a test-only mainline commit', () => {
    const { root, baseline } = createRepository();
    git(root, 'checkout', '--quiet', '-b', 'feature');
    write(root, 'apps/api/src/merged-image-input.ts', 'export const version = 2;\n');
    const productCommit = commit(root, 'feat: change product on feature branch');

    git(root, 'checkout', '--quiet', 'main');
    write(root, 'tests/mainline.test.ts', 'export const mainline = true;\n');
    commit(root, 'test: add mainline coverage');
    git(root, 'merge', '--quiet', '--no-ff', 'feature', '-m', 'merge: integrate product feature');

    const resolved = resolveProductSourceSha(root);
    expect(resolved).not.toBe(baseline);
    expect(git(root, 'merge-base', '--is-ancestor', productCommit, resolved)).toBe('');
  });
});
