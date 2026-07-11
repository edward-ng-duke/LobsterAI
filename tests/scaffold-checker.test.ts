import { cpSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
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
    'scripts/saas-stage-gates.json',
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
});
