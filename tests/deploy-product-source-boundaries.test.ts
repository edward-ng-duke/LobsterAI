import { spawnSync } from 'node:child_process';
import {
  mkdirSync,
  mkdtempSync,
  renameSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { afterEach, describe, expect, test } from 'vitest';

import { resolveProductSourceSha } from '../scripts/check-supply-chain.mjs';

const temporaryRoots: string[] = [];

const git = (root: string, ...args: string[]) => {
  const result = spawnSync('git', args, { cwd: root, encoding: 'utf8' });
  expect(result.status, `${result.stdout}\n${result.stderr}`).toBe(0);
  return result.stdout.trim();
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

afterEach(() => {
  temporaryRoots.splice(0).forEach(root => rmSync(root, { recursive: true, force: true }));
});

describe('P03 product-source evidence boundaries', () => {
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
    write(root, 'src/product.ts', 'export const version = 2;\n');
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
