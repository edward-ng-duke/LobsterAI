import { spawnSync } from 'node:child_process';
import {
  appendFileSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
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

const commonReport = () => ({
  schemaVersion: 1,
  runId: 'report-run',
  generatedAt: '2026-07-12T00:00:00.000Z',
  sourceSha,
  nodeVersion: 'v24.18.0',
  platform: 'linux/arm64',
  status: 'PASS',
});

const writeArtifact = (): string => {
  const root = mkdtempSync(path.join(tmpdir(), 'lobsterai-db-platform-artifact-'));
  temporaryRoots.push(root);
  mkdirSync(root, { recursive: true });
  writeFileSync(path.join(root, 'preflight.json'), `${JSON.stringify({
    ...commonReport(),
    kind: 'P02_DATABASE_PREFLIGHT',
    runId: 'preflight-run',
    checks: {
      contracts: {
        acceptedSha: 'a'.repeat(40),
        testerReportSha: 'b'.repeat(40),
        contractVersion: '1.0.0',
        sourceHash: 'c'.repeat(64),
      },
      provider: {
        ...provider(),
        citextAvailableVersion: '1.6',
        generatedUuid: '10000000-0000-4000-8000-000000000001',
        migrationRole: { rolsuper: true, rolbypassrls: true },
      },
    },
    cleanup: { attempted: true, containerId: 'container-id', removed: true },
  })}\n`);
  writeFileSync(path.join(root, 'integration.json'), `${JSON.stringify({
    ...commonReport(),
    kind: 'P02_DATABASE_INTEGRATION',
    runId: 'integration-run',
    skipped: 0,
    checks: {
      provider: provider(),
      migrations: {
        first: true,
        repeat: true,
        existingSchema: {
          independentDatabase: true,
          prepared: true,
          preserved: true,
          completedMigrations: 2,
          beforeTables: ['_prisma_migrations', 'p02_preexisting_catalog'],
          afterTables: ['_prisma_migrations', 'agents', 'p02_preexisting_catalog', 'tenants'],
          beforeCatalogSha256: '1'.repeat(64),
          afterCatalogSha256: '2'.repeat(64),
        },
        rollback: {
          failed: true,
          partialTableAbsent: true,
          rolledBackRows: 1,
          repaired: true,
        },
        concurrent: {
          safe: true,
          exitCodes: [0, 0],
          completedRows: 1,
        },
      },
      checksPassed: 24,
      checksTotal: 24,
      testResults: {
        passed: 24,
        failed: 0,
        skipped: 0,
        todo: 0,
        total: 24,
      },
      rls: [{
        relrowsecurity: true,
        relforcerowsecurity: true,
        table_owner: 'p02_admin',
        policyname: 'agents_tenant_isolation',
        qual: 'tenant policy',
        with_check: 'tenant policy',
      }],
      roles: [
        { rolname: 'p02_admin', rolsuper: true, rolbypassrls: true },
        { rolname: 'p02_app', rolsuper: false, rolbypassrls: false },
      ],
      seed: [{
        tenant_id: '10000000-0000-4000-8000-000000000001',
        logical_id: 'main',
        id: 'a0000000-0000-4000-8000-000000000001',
      }],
      testOutputSha256: '3'.repeat(64),
    },
    cleanup: { attempted: true, containerId: 'container-id', removed: true },
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
  { cwd: repositoryRoot, encoding: 'utf8', timeout: 1_500 },
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

  test('rejects unknown root and nested fields', () => {
    for (const location of ['root', 'provider'] as const) {
      const root = writeArtifact();
      mutate(root, 'integration.json', (value) => {
        if (location === 'root') value.untrusted = true;
        else {
          const checks = value.checks as { provider: Record<string, unknown> };
          checks.provider.untrusted = true;
        }
      });
      expect(run(root).status).toBe(1);
    }
  });

  test('rejects missing cleanup attempted evidence', () => {
    const root = writeArtifact();
    mutate(root, 'integration.json', (value) => {
      const cleanup = value.cleanup as Record<string, unknown>;
      delete cleanup.attempted;
    });

    expect(run(root).status).toBe(1);
  });

  test('rejects report symlinks even when their targets contain valid JSON', () => {
    const root = writeArtifact();
    const external = writeArtifact();
    for (const reportName of ['preflight.json', 'integration.json']) {
      const target = path.join(root, reportName);
      rmSync(target);
      symlinkSync(path.join(external, reportName), target);
    }

    expect(run(root).status).toBe(1);
  });

  test('rejects a FIFO before attempting to read it', () => {
    const root = writeArtifact();
    const target = path.join(root, 'integration.json');
    rmSync(target);
    const fifo = spawnSync('mkfifo', [target], { encoding: 'utf8' });
    expect(fifo.status, fifo.stderr).toBe(0);

    expect(run(root).status).toBe(1);
  });

  test('rejects a report larger than one MiB before parsing it', () => {
    const root = writeArtifact();
    appendFileSync(path.join(root, 'integration.json'), ' '.repeat(1024 * 1024));

    expect(run(root).status).toBe(1);
  });

  test('rejects duplicate and missing required fields', () => {
    const duplicateRoot = writeArtifact();
    const duplicatePath = path.join(duplicateRoot, 'integration.json');
    writeFileSync(
      duplicatePath,
      readFileSync(duplicatePath, 'utf8').replace(
        '"schemaVersion":1',
        '"schemaVersion":1,"schemaVersion":1',
      ),
    );
    expect(run(duplicateRoot).status).toBe(1);

    const missingRoot = writeArtifact();
    mutate(missingRoot, 'preflight.json', (value) => { delete value.runId; });
    expect(run(missingRoot).status).toBe(1);
  });

  test('rejects a structured test result containing one skipped test', () => {
    const root = writeArtifact();
    mutate(root, 'integration.json', (value) => {
      const checks = value.checks as {
        testResults: { passed: number; skipped: number };
      };
      checks.testResults.passed = 23;
      checks.testResults.skipped = 1;
    });

    expect(run(root).status).toBe(1);
  });

  test('rejects an existing-schema claim without its preparation fact', () => {
    const root = writeArtifact();
    mutate(root, 'integration.json', (value) => {
      const checks = value.checks as {
        migrations: { existingSchema: { prepared: boolean } };
      };
      checks.migrations.existingSchema.prepared = false;
    });

    expect(run(root).status).toBe(1);
  });

  test('classifies an unsupported requested platform as BLOCKED', () => {
    expect(run(writeArtifact(), 'linux/ppc64le').status).toBe(2);
  });
});
