import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

import { describe, expect, test } from 'vitest';

const repositoryRoot = path.resolve(import.meta.dirname, '..');

const requiredWorkspaces = [
  'apps/api',
  'apps/runtime-orchestrator',
  'apps/web',
  'apps/worker',
  'libs/client/bridge',
  'libs/server/auth',
  'libs/server/db',
  'libs/shared/contracts',
  'libs/shared/types',
] as const;

const requiredScaffoldPaths = [
  'apps/runtime-orchestrator/poc/README.md',
  'charts/lobsterai/README.md',
  'charts/lobsterai/templates/sandbox-pod.yaml',
  'docker/api/README.md',
  'docker/openclaw-runtime/README.md',
  'docker/runtime-orchestrator/README.md',
  'docker/web/README.md',
  'docker/worker/README.md',
  'docs/poc/README.md',
  'docs/supply-chain/skills-and-plugins.manifest.json',
  'libs/shared/contracts/assets/supply-chain-inventory.schema.json',
  'prisma/README.md',
  'prisma/schema.prisma',
] as const;

const readJson = (relativePath: string): Record<string, unknown> =>
  JSON.parse(readFileSync(path.join(repositoryRoot, relativePath), 'utf8')) as Record<string, unknown>;

describe('P00 SaaS workspace scaffold', () => {
  test('freezes npm workspaces and a committed lockfile', () => {
    const rootPackage = readJson('package.json');

    expect(rootPackage.workspaces).toEqual(['apps/*', 'libs/*/*']);
    expect(existsSync(path.join(repositoryRoot, 'package-lock.json'))).toBe(true);
    expect(readJson('package-lock.json').lockfileVersion).toBe(3);
  });

  test.each(requiredWorkspaces)('%s has a real package and TypeScript boundary', (workspace) => {
    expect(existsSync(path.join(repositoryRoot, workspace, 'package.json'))).toBe(true);
    expect(existsSync(path.join(repositoryRoot, workspace, 'tsconfig.json'))).toBe(true);
    expect(existsSync(path.join(repositoryRoot, workspace, 'src/index.ts'))).toBe(true);

    const workspacePackage = readJson(path.join(workspace, 'package.json'));
    expect(workspacePackage.private).toBe(true);
    expect(workspacePackage.name).toMatch(/^@lobsterai\//);
    expect(workspacePackage.scripts).toMatchObject({
      build: workspace === 'apps/web' ? 'tsc -b && vite build' : 'tsc -b',
      typecheck: 'tsc -b --pretty false',
    });
  });

  test('uses a real scaffold gate and project-reference typecheck', () => {
    const rootPackage = readJson('package.json');
    const scripts = rootPackage.scripts as Record<string, string>;

    expect(scripts['scaffold:check']).toBe('node scripts/check-saas-scaffold.mjs');
    expect(scripts.typecheck).toBe('tsc -b tsconfig.workspace.json --pretty false');
    expect(scripts['test:scaffold']).toBe(
      'vitest run tests/scaffold.test.ts tests/scaffold-checker.test.ts tests/scaffold-apps.test.ts tests/scaffold-web-build.test.ts tests/scaffold-stage-gates.test.ts',
    );

    for (const command of ['scaffold:check', 'typecheck', 'test:scaffold']) {
      expect(scripts[command]).not.toMatch(/(^|&&|;)\s*(echo|true|exit\s+0)\b/);
    }

    expect(existsSync(path.join(repositoryRoot, 'scripts/check-saas-scaffold.mjs'))).toBe(true);
  });

  test.each(requiredScaffoldPaths)('%s exists as a PR-0 fixture', (relativePath) => {
    expect(existsSync(path.join(repositoryRoot, relativePath))).toBe(true);
  });

  test('freezes every deferred gate as a machine-readable command', () => {
    const rootPackage = readJson('package.json');
    const scripts = rootPackage.scripts as Record<string, string>;
    for (const command of [
      'test:e2e',
      'contracts:check',
      'prisma:validate',
      'supply-chain:check',
      'docker:build:check',
      'helm:lint',
      'poc:v1:check',
    ]) {
      expect(scripts[command]).toMatch(/^node scripts\/run-saas-stage-gate\.mjs /);
    }
  });

  test('keeps the legacy Electron build entry points intact', () => {
    const rootPackage = readJson('package.json');
    const scripts = rootPackage.scripts as Record<string, string>;

    expect(scripts.build).toContain('vite build');
    expect(scripts['compile:electron']).toBe('tsc --project electron-tsconfig.json');
    expect(scripts.test).toBe('vitest run');
  });
});
