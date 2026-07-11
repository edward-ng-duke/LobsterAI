import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { afterEach, describe, expect, test } from 'vitest';

import { collectScaffoldErrors } from '../scripts/check-saas-scaffold.mjs';

const repositoryRoot = path.resolve(import.meta.dirname, '..');
const temporaryRoots: string[] = [];

const createRepositoryCopy = (): string => {
  const target = mkdtempSync(path.join(tmpdir(), 'lobsterai-p00-checker-'));
  temporaryRoots.push(target);
  for (const relativePath of [
    '.github/workflows/saas-scaffold.yml',
    'apps',
    'charts',
    'docker',
    'docs/poc',
    'docs/supply-chain',
    'libs',
    'package-lock.json',
    'package.json',
    'prisma',
    'scripts/check-saas-build-artifacts.mjs',
    'scripts/check-saas-scaffold.mjs',
    'scripts/expect-saas-stage-gate.mjs',
    'scripts/run-saas-stage-gate.mjs',
    'scripts/saas-stage-gates.json',
    'scripts/saas-workspace-registry.json',
    'tsconfig.base.json',
    'tsconfig.workspace.json',
  ]) {
    const source = path.join(repositoryRoot, relativePath);
    const destination = path.join(target, relativePath);
    mkdirSync(path.dirname(destination), { recursive: true });
    cpSync(source, destination, {
      recursive: true,
      filter: (candidate) => !/(?:^|\/)(?:dist|dist-types)(?:\/|$)/.test(candidate),
    });
  }
  return target;
};

const readJson = (root: string, relativePath: string): Record<string, unknown> =>
  JSON.parse(readFileSync(path.join(root, relativePath), 'utf8')) as Record<string, unknown>;

const writeJson = (root: string, relativePath: string, value: unknown): void => {
  writeFileSync(path.join(root, relativePath), `${JSON.stringify(value, null, 2)}\n`);
};

afterEach(() => {
  temporaryRoots.splice(0).forEach((root) => rmSync(root, { recursive: true, force: true }));
});

describe('P00 scaffold checker mutation resistance', () => {
  test('accepts an isolated copy of the authoritative scaffold', () => {
    expect(collectScaffoldErrors(createRepositoryCopy())).toEqual([]);
  });

  test('rejects no-op wrappers plus shared manifest and TS reverse dependencies', () => {
    const root = createRepositoryCopy();
    const manifestPath = 'libs/shared/contracts/package.json';
    const manifest = readJson(root, manifestPath);
    manifest.scripts = {
      build: 'node -e "process.exit(0)"',
      typecheck: 'node -p "true"',
    };
    manifest.dependencies = { react: '^18.2.0' };
    writeJson(root, manifestPath, manifest);

    const tsconfigPath = 'libs/shared/contracts/tsconfig.json';
    const tsconfig = readJson(root, tsconfigPath);
    tsconfig.references = [{ path: '../../../apps/worker' }];
    writeJson(root, tsconfigPath, tsconfig);

    const errors = collectScaffoldErrors(root).join('\n');
    expect(errors).toContain('no-op');
    expect(errors).toContain('forbidden manifest dependency react');
    expect(errors).toContain('forbidden project reference apps/worker');
  });

  test('rejects a rogue workspace that has no quality gates', () => {
    const root = createRepositoryCopy();
    const gatewayRoot = path.join(root, 'apps/gateway');
    mkdirSync(path.join(gatewayRoot, 'src'), { recursive: true });
    writeJson(root, 'apps/gateway/package.json', {
      name: '@lobsterai/gateway',
      private: true,
      version: '0.0.0',
    });
    writeJson(root, 'apps/gateway/tsconfig.json', { files: [] });
    writeFileSync(path.join(gatewayRoot, 'README.md'), '# Rogue gateway\n');
    writeFileSync(path.join(gatewayRoot, 'src/index.ts'), 'export {};\n');

    const errors = collectScaffoldErrors(root).join('\n');
    expect(errors).toContain('apps/gateway');
    expect(errors).toContain('build');
    expect(errors).toContain('typecheck');
    expect(errors).toContain('solution reference');
  });

  test('rejects a fully disguised unapproved physical deployable', () => {
    const root = createRepositoryCopy();
    const gatewayRoot = path.join(root, 'apps/gateway');
    mkdirSync(path.join(gatewayRoot, 'src'), { recursive: true });
    writeJson(root, 'apps/gateway/package.json', {
      name: '@lobsterai/gateway',
      version: '0.0.0',
      private: true,
      type: 'module',
      scripts: {
        build: 'node -e "require(\'node:fs\').readFileSync(\'package.json\')"',
        typecheck: 'node -e "require(\'node:fs\').readFileSync(\'package.json\')"',
      },
    });
    writeJson(root, 'apps/gateway/tsconfig.json', {
      extends: '../../tsconfig.base.json',
      compilerOptions: { rootDir: 'src', outDir: 'dist' },
      include: ['src/**/*.ts'],
    });
    writeFileSync(
      path.join(gatewayRoot, 'README.md'),
      '# Disguised gateway\n\nThis deployable is intentionally complete enough to bypass keyword gates.\n',
    );
    writeFileSync(path.join(gatewayRoot, 'src/index.ts'), 'export const gateway = true;\n');

    const solution = readJson(root, 'tsconfig.workspace.json');
    const references = solution.references as Array<{ path: string }>;
    references.push({ path: './apps/gateway' });
    writeJson(root, 'tsconfig.workspace.json', solution);

    const lockfile = readJson(root, 'package-lock.json');
    const packages = lockfile.packages as Record<string, unknown>;
    packages['apps/gateway'] = { name: '@lobsterai/gateway', version: '0.0.0' };
    packages['node_modules/@lobsterai/gateway'] = { resolved: 'apps/gateway', link: true };
    writeJson(root, 'package-lock.json', lockfile);

    const errors = collectScaffoldErrors(root).join('\n');
    expect(errors).toContain('[SCAF-1]');
    expect(errors).toContain('unapproved physical deployable apps/gateway');
    expect(errors).toContain('[SCAF-2]');
    expect(errors).toContain('must use its registered build command');
  });

  test('rejects lockfile and workspace manifest drift', () => {
    const root = createRepositoryCopy();
    const lockfile = readJson(root, 'package-lock.json');
    const packages = lockfile.packages as Record<string, unknown>;
    delete packages['apps/api'];
    writeJson(root, 'package-lock.json', lockfile);

    expect(collectScaffoldErrors(root).join('\n')).toContain('lockfile is missing workspace apps/api');
  });

  test('maps missing authoritative fixtures to their SCAF gate', () => {
    const root = createRepositoryCopy();
    rmSync(path.join(root, 'prisma/schema.prisma'));
    rmSync(path.join(root, 'libs/shared/contracts/codegen-policy.json'));

    const errors = collectScaffoldErrors(root).join('\n');
    expect(errors).toContain('[SCAF-1]');
    expect(errors).toContain('prisma/schema.prisma');
    expect(errors).toContain('[SCAF-5]');
    expect(errors).toContain('codegen-policy.json');
  });

  test('maps legacy desktop command drift to SCAF-6', () => {
    const root = createRepositoryCopy();
    const manifest = readJson(root, 'package.json');
    const scripts = manifest.scripts as Record<string, string>;
    scripts.build = 'tsc';
    writeJson(root, 'package.json', manifest);

    const errors = collectScaffoldErrors(root).join('\n');
    expect(errors).toContain('[SCAF-6]');
    expect(errors).toContain('legacy renderer build command');
  });
});
