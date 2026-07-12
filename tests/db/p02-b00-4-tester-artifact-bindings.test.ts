import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { afterEach, describe, expect, test } from 'vitest';

const repositoryRoot = path.resolve(import.meta.dirname, '../..');
const sourceSha = '1234567890abcdef1234567890abcdef12345678';
const digest = 'sha256:17b6c778de50f4bb9a878c36e736110fbcd9b7020377d6fdfdf20f7c0347e40a';
const baselineMigrationName = '20260710000000_existing_catalog_baseline';
const currentMigrationName = '20260711000000_init_prisma_rls_scaffold';
const temporaryRoots: string[] = [];

const sha256 = (value: string): string => createHash('sha256').update(value).digest('hex');
const baselineMigrationSql = [
  'CREATE TABLE p02_preexisting_catalog (id INTEGER PRIMARY KEY, marker TEXT NOT NULL);',
  "INSERT INTO p02_preexisting_catalog (id, marker) VALUES (1, 'preserve-me');",
  '',
].join('\n');
const currentMigrationChecksum = sha256(readFileSync(
  path.join(repositoryRoot, 'prisma/migrations', currentMigrationName, 'migration.sql'),
  'utf8',
));
const beforeCatalogPayload = { tables: ['_prisma_migrations', 'p02_preexisting_catalog'] };
const afterCatalogPayload = {
  tables: ['_prisma_migrations', 'agents', 'p02_preexisting_catalog', 'tenants'],
};

interface ArtifactReports {
  preflight: Record<string, unknown>;
  integration: Record<string, unknown>;
}

const provider = (): Record<string, unknown> => ({
  dockerPlatform: 'linux/arm64',
  runnerOs: 'linux',
  runnerArch: 'arm64',
  image: 'postgres:17.10-bookworm',
  immutableReference: `postgres:17.10-bookworm@${digest}`,
  digest,
  inspectedOs: 'linux',
  inspectedArch: 'arm64',
  repoDigests: [`postgres@${digest}`],
  containerId: 'database-container-id',
  serverVersion: '17.10 (Debian 17.10-1.pgdg12+1)',
  serverMajor: 17,
  lcCollate: 'en_US.utf8',
  lcCtype: 'en_US.utf8',
  timezone: 'Etc/UTC',
  ssl: 'off',
});

const commonReport = (): Record<string, unknown> => ({
  schemaVersion: 1,
  runId: 'report-run',
  generatedAt: '2026-07-12T00:00:00.000Z',
  sourceSha,
  nodeVersion: 'v24.18.0',
  platform: 'linux/arm64',
  status: 'PASS',
});

const reports = (): ArtifactReports => ({
  preflight: {
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
    cleanup: { attempted: true, containerId: 'database-container-id', removed: true },
  },
  integration: {
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
          beforeCatalog: {
            payload: beforeCatalogPayload,
            sha256: sha256(JSON.stringify(beforeCatalogPayload)),
          },
          afterCatalog: {
            payload: afterCatalogPayload,
            sha256: sha256(JSON.stringify(afterCatalogPayload)),
          },
          migrationHistory: [
            {
              migrationName: baselineMigrationName,
              checksum: sha256(baselineMigrationSql),
              finished: true,
              rolledBack: false,
            },
            {
              migrationName: currentMigrationName,
              checksum: currentMigrationChecksum,
              finished: true,
              rolledBack: false,
            },
          ],
        },
        rollback: {
          failed: true,
          partialTableAbsent: true,
          rolledBackRows: 1,
          repaired: true,
        },
        concurrent: { safe: true, exitCodes: [0, 0], completedRows: 1 },
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
      checksPassed: 24,
      checksTotal: 24,
      testResults: { passed: 24, failed: 0, skipped: 0, todo: 0, total: 24 },
      testOutputSha256: '3'.repeat(64),
    },
    cleanup: { attempted: true, containerId: 'database-container-id', removed: true },
  },
});

const writeArtifact = (value: ArtifactReports): string => {
  const root = mkdtempSync(path.join(tmpdir(), 'lobsterai-p02-tester-artifact-'));
  temporaryRoots.push(root);
  mkdirSync(root, { recursive: true });
  writeFileSync(path.join(root, 'preflight.json'), `${JSON.stringify(value.preflight)}\n`);
  writeFileSync(path.join(root, 'integration.json'), `${JSON.stringify(value.integration)}\n`);
  return root;
};

const run = (root: string) => spawnSync(
  process.execPath,
  [
    'scripts/db/validate-platform-artifact.mjs',
    '--root', root,
    '--source-sha', sourceSha,
    '--platform', 'linux/arm64',
  ],
  { cwd: repositoryRoot, encoding: 'utf8', timeout: 2_000 },
);

const providerFrom = (report: Record<string, unknown>): Record<string, unknown> =>
  (report.checks as { provider: Record<string, unknown> }).provider;

afterEach(() => {
  temporaryRoots.splice(0).forEach((root) => rmSync(root, { recursive: true, force: true }));
});

describe('P02 B00-4 independent Tester artifact fact bindings', () => {
  test('keeps the independent complete artifact fixture valid', () => {
    const result = run(writeArtifact(reports()));

    expect(result.status, `${result.stdout}\n${result.stderr}`).toBe(0);
  });

  test('rejects a report whose root platform contradicts its provider facts', () => {
    const value = reports();
    value.preflight.platform = 'linux/amd64';

    expect(run(writeArtifact(value)).status).toBe(1);
  });

  test('rejects a declared serverMajor that contradicts SHOW server_version', () => {
    const value = reports();
    providerFrom(value.integration).serverMajor = 16;

    expect(run(writeArtifact(value)).status).toBe(1);
  });

  test('rejects cleanup evidence for a different container', () => {
    const value = reports();
    const cleanup = value.integration.cleanup as Record<string, unknown>;
    cleanup.containerId = 'unrelated-container-id';

    expect(run(writeArtifact(value)).status).toBe(1);
  });
});
