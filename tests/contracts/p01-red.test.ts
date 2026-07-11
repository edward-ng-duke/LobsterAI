import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

import { describe, expect, test } from 'vitest';

const repositoryRoot = path.resolve(__dirname, '../..');

function readJson(relativePath: string): unknown {
  return JSON.parse(readFileSync(path.join(repositoryRoot, relativePath), 'utf8'));
}

describe('P01 contract gate red baseline', () => {
  test('activates contracts:check as a real PASS gate', () => {
    const stageManifest = readJson('scripts/saas-stage-gates.json') as { currentStage: string };
    const result = spawnSync('npm', ['run', 'contracts:check'], {
      cwd: repositoryRoot,
      encoding: 'utf8',
    });

    expect(result.status, result.stdout + result.stderr).toBe(0);
    expect(readJson('.reports/saas-gates/contracts-check.json')).toMatchObject({
      gate: 'contracts:check',
      stage: stageManifest.currentStage,
      status: 'PASS',
    });
  }, 30_000);

  test('provides the frozen contract registries, specifications, and consumers', () => {
    const requiredFiles = [
      'libs/shared/contracts/src/registry/routes.ts',
      'libs/shared/contracts/src/registry/channels.ts',
      'libs/shared/contracts/src/registry/cowork-stream.ts',
      'libs/shared/contracts/src/registry/ipc-ga-inventory.ts',
      'libs/shared/contracts/src/registry/bridge.ts',
      'libs/shared/contracts/openapi.yaml',
      'libs/shared/contracts/asyncapi.yaml',
      'libs/shared/contracts/generated/contract-manifest.ts',
      'libs/client/bridge/src/generated/bridge-map.ts',
      'apps/api/src/generated/openapi-types.ts',
      'apps/web/src/generated/api-client.ts',
      'scripts/contracts/generate.mjs',
      'scripts/contracts/check.mjs',
    ];

    expect(requiredFiles.filter((file) => !existsSync(path.join(repositoryRoot, file)))).toEqual([]);
  });

  test('freezes the exact ten Cowork wire events including goal', () => {
    const registryPath = path.join(
      repositoryRoot,
      'libs/shared/contracts/src/registry/cowork-stream.ts',
    );

    expect(existsSync(registryPath)).toBe(true);
    const source = existsSync(registryPath) ? readFileSync(registryPath, 'utf8') : '';
    const wireTypes = [
      'message',
      'messageUpdate',
      'sessionStatus',
      'contextUsage',
      'goal',
      'contextMaintenance',
      'permission',
      'permissionDismiss',
      'complete',
      'error',
    ];

    for (const wireType of wireTypes) {
      expect(source, `missing Cowork wire event ${wireType}`).toContain(`wireType: '${wireType}'`);
    }
    expect((source.match(/wireType:/g) ?? []).length).toBe(10);
  });

  test('rejects legacy, unversioned, and colon-action paths', () => {
    const result = spawnSync(
      process.execPath,
      ['scripts/contracts/check.mjs', '--only', 'route-negative'],
      { cwd: repositoryRoot, encoding: 'utf8' },
    );

    expect(result.status, result.stdout + result.stderr).toBe(0);
    expect(result.stdout).toContain('route-negative: PASS');
  });

  test('exposes the contract test command for focused TDD batches', () => {
    const scripts = (
      readJson('package.json') as { scripts?: Record<string, string> }
    ).scripts;
    expect(scripts?.['test:contract']).toBeDefined();
    expect(() =>
      execFileSync('npm', ['run', 'test:contract', '--', 'cowork-stream'], {
        cwd: repositoryRoot,
        stdio: 'pipe',
      }),
    ).not.toThrow();
  });
});
