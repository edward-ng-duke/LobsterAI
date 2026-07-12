import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { afterEach, describe, expect, test } from 'vitest';

const repositoryRoot = path.resolve(import.meta.dirname, '../..');
const sourceSha = '1234567890abcdef1234567890abcdef12345678';
const digest = 'sha256:17b6c778de50f4bb9a878c36e736110fbcd9b7020377d6fdfdf20f7c0347e40a';
const temporaryRoots: string[] = [];

const provider = () => ({
  dockerPlatform: 'linux/arm64',
  runnerOs: 'linux',
  runnerArch: 'arm64',
  image: 'postgres:17.10-bookworm',
  immutableReference: `postgres:17.10-bookworm@${digest}`,
  digest,
  inspectedOs: 'linux',
  inspectedArch: 'arm64',
  repoDigests: [`postgres@${digest}`],
  containerId: 'container-id',
  serverVersion: '17.10 (Debian 17.10-1.pgdg12+1)',
  serverMajor: 17,
  lcCollate: 'en_US.utf8',
  lcCtype: 'en_US.utf8',
  timezone: 'Etc/UTC',
  ssl: 'off',
});

const writeArtifact = (): string => {
  const root = mkdtempSync(path.join(tmpdir(), 'lobsterai-db-platform-artifact-'));
  temporaryRoots.push(root);
  mkdirSync(root, { recursive: true });
  writeFileSync(path.join(root, 'preflight.json'), `${JSON.stringify({
    schemaVersion: 1,
    kind: 'P02_DATABASE_PREFLIGHT',
    sourceSha,
    runId: 'preflight-run',
    status: 'PASS',
    checks: { provider: provider() },
    cleanup: { containerId: 'container-id', removed: true },
  })}\n`);
  writeFileSync(path.join(root, 'integration.json'), `${JSON.stringify({
    schemaVersion: 1,
    kind: 'P02_DATABASE_INTEGRATION',
    sourceSha,
    runId: 'integration-run',
    status: 'PASS',
    skipped: 0,
    checks: {
      provider: provider(),
      migrations: {
        first: true,
        repeat: true,
        rollback: true,
        concurrent: true,
      },
      checksPassed: 24,
      checksTotal: 24,
    },
    cleanup: { containerId: 'container-id', removed: true },
  })}\n`);
  return root;
};

const run = (root: string, platform = 'linux/arm64') => spawnSync(
  process.execPath,
  [
    'scripts/db/validate-platform-artifact.mjs',
    '--root', root,
    '--source-sha', sourceSha,
    '--platform', platform,
  ],
  { cwd: repositoryRoot, encoding: 'utf8' },
);

const mutate = (
  root: string,
  file: string,
  operation: (value: Record<string, unknown>) => void,
): void => {
  const target = path.join(root, file);
  const value = JSON.parse(readFileSync(target, 'utf8')) as Record<string, unknown>;
  operation(value);
  writeFileSync(target, `${JSON.stringify(value)}\n`);
};

afterEach(() => {
  temporaryRoots.splice(0).forEach((root) => rmSync(root, { recursive: true, force: true }));
});

describe('PostgreSQL native platform artifact boundary', () => {
  test('accepts complete reports from the requested source and platform', () => {
    const result = run(writeArtifact());

    expect(result.status, `${result.stdout}\n${result.stderr}`).toBe(0);
  });

  test('rejects a report from another source SHA', () => {
    const root = writeArtifact();
    mutate(root, 'integration.json', (value) => { value.sourceSha = '0'.repeat(40); });

    expect(run(root).status).toBe(1);
  });

  test('rejects a digest that differs between preflight and integration', () => {
    const root = writeArtifact();
    mutate(root, 'integration.json', (value) => {
      const checks = value.checks as { provider: { digest: string } };
      checks.provider.digest = `sha256:${'0'.repeat(64)}`;
    });

    expect(run(root).status).toBe(1);
  });

  test('rejects skipped checks or incomplete cleanup', () => {
    const root = writeArtifact();
    mutate(root, 'integration.json', (value) => {
      value.skipped = 1;
      const cleanup = value.cleanup as { removed: boolean };
      cleanup.removed = false;
    });

    expect(run(root).status).toBe(1);
  });

  test('classifies an unsupported requested platform as BLOCKED', () => {
    expect(run(writeArtifact(), 'linux/ppc64le').status).toBe(2);
  });
});
