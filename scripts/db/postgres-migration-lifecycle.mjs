import { spawn, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

import pg from 'pg';

import { repositoryRoot } from './common.mjs';

const { Client } = pg;

const databaseUrl = (adminUrl, database) => {
  const url = new URL(adminUrl);
  url.pathname = `/${database}`;
  url.searchParams.delete('schema');
  return url.toString();
};

const runPrisma = (args, url) => spawnSync('npx', ['prisma', ...args], {
  cwd: repositoryRoot,
  encoding: 'utf8',
  env: { ...process.env, DATABASE_URL: url },
});

const runPrismaAsync = (args, url) => new Promise((resolve) => {
  const child = spawn('npx', ['prisma', ...args], {
    cwd: repositoryRoot,
    env: { ...process.env, DATABASE_URL: url },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let stdout = '';
  let stderr = '';
  child.stdout.setEncoding('utf8');
  child.stderr.setEncoding('utf8');
  child.stdout.on('data', (chunk) => { stdout += chunk; });
  child.stderr.on('data', (chunk) => { stderr += chunk; });
  child.on('error', (error) => resolve({ status: 1, stdout, stderr: `${stderr}${error.message}` }));
  child.on('close', (status) => resolve({ status: status ?? 1, stdout, stderr }));
});

const createMigrationFixture = (root, migrationName, sql) => {
  const migrationDirectory = path.join(root, 'migrations', migrationName);
  mkdirSync(migrationDirectory, { recursive: true });
  writeFileSync(path.join(root, 'schema.prisma'), [
    'generator client {',
    '  provider = "prisma-client-js"',
    '}',
    '',
    'datasource db {',
    '  provider = "postgresql"',
    '  url      = env("DATABASE_URL")',
    '}',
    '',
  ].join('\n'));
  writeFileSync(path.join(migrationDirectory, 'migration.sql'), sql);
  return path.join(root, 'schema.prisma');
};

const requireStatus = (result, expected, label) => {
  if (result.status !== expected) {
    throw new Error(`${label} returned ${result.status}: ${result.stderr || result.stdout}`.trim());
  }
};

export const runPostgresMigrationLifecycle = async ({ adminUrl, runId }) => {
  const suffix = runId.replace(/[^a-z0-9]/gi, '').slice(0, 12).toLowerCase();
  const rollbackDatabase = `p02_rollback_${suffix}`;
  const concurrentDatabase = `p02_concurrent_${suffix}`;
  const existingDatabase = `p02_existing_${suffix}`;
  const databases = [rollbackDatabase, concurrentDatabase, existingDatabase];
  const temporaryRoots = [];
  const control = new Client({ connectionString: databaseUrl(adminUrl, 'postgres') });
  await control.connect();

  try {
    for (const database of databases) {
      await control.query(`DROP DATABASE IF EXISTS "${database}" WITH (FORCE)`);
      await control.query(`CREATE DATABASE "${database}"`);
    }

    const existingUrl = databaseUrl(adminUrl, existingDatabase);
    const existingRoot = mkdtempSync(path.join(tmpdir(), 'lobsterai-p02-existing-'));
    temporaryRoots.push(existingRoot);
    const existingBaselineMigration = '20260710000000_existing_catalog_baseline';
    const existingSchema = createMigrationFixture(existingRoot, existingBaselineMigration, [
      'CREATE TABLE p02_preexisting_catalog (id INTEGER PRIMARY KEY, marker TEXT NOT NULL);',
      "INSERT INTO p02_preexisting_catalog (id, marker) VALUES (1, 'preserve-me');",
      '',
    ].join('\n'));
    const baselineDeploy = runPrisma(
      ['migrate', 'deploy', '--schema', existingSchema],
      existingUrl,
    );
    requireStatus(baselineDeploy, 0, 'existing-schema baseline migration');
    const existingClient = new Client({ connectionString: existingUrl });
    await existingClient.connect();
    const beforeCatalog = await existingClient.query(
      "SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename",
    );
    await existingClient.end();
    const currentMigration = '20260711000000_init_prisma_rls_scaffold';
    const currentMigrationDirectory = path.join(existingRoot, 'migrations', currentMigration);
    mkdirSync(currentMigrationDirectory, { recursive: true });
    writeFileSync(
      path.join(currentMigrationDirectory, 'migration.sql'),
      readFileSync(
        path.join(repositoryRoot, 'prisma/migrations', currentMigration, 'migration.sql'),
        'utf8',
      ),
    );
    const existingDeploy = runPrisma(
      ['migrate', 'deploy', '--schema', existingSchema],
      existingUrl,
    );
    requireStatus(existingDeploy, 0, 'existing-schema migration');

    const existingAfterClient = new Client({ connectionString: existingUrl });
    await existingAfterClient.connect();
    const afterCatalog = await existingAfterClient.query(
      "SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename",
    );
    const existingMarker = await existingAfterClient.query(
      "SELECT count(*)::int AS count FROM p02_preexisting_catalog WHERE marker = 'preserve-me'",
    );
    const existingMigrations = await existingAfterClient.query(
      'SELECT count(*)::int AS count FROM _prisma_migrations WHERE finished_at IS NOT NULL',
    );
    await existingAfterClient.end();
    const beforeTables = beforeCatalog.rows.map((row) => row.tablename);
    const afterTables = afterCatalog.rows.map((row) => row.tablename);
    const existingSchemaEvidence = {
      independentDatabase:
        existingDatabase !== new URL(adminUrl).pathname.replace(/^\//, ''),
      prepared: JSON.stringify(beforeTables) === JSON.stringify([
        '_prisma_migrations',
        'p02_preexisting_catalog',
      ]),
      preserved: existingMarker.rows[0]?.count === 1 &&
        ['_prisma_migrations', 'agents', 'p02_preexisting_catalog', 'tenants'].every(
          (table) => afterTables.includes(table),
        ),
      completedMigrations: existingMigrations.rows[0]?.count,
      beforeTables,
      afterTables,
      beforeCatalogSha256: createHash('sha256').update(JSON.stringify(beforeTables)).digest('hex'),
      afterCatalogSha256: createHash('sha256').update(JSON.stringify(afterTables)).digest('hex'),
    };
    if (
      !existingSchemaEvidence.independentDatabase ||
      !existingSchemaEvidence.prepared ||
      !existingSchemaEvidence.preserved ||
      existingSchemaEvidence.completedMigrations !== 2
    ) {
      throw new Error('existing-schema migration evidence is incomplete');
    }

    const rollbackRoot = mkdtempSync(path.join(tmpdir(), 'lobsterai-p02-rollback-'));
    temporaryRoots.push(rollbackRoot);
    const rollbackMigration = '20260712000000_rollback_probe';
    const rollbackSchema = createMigrationFixture(rollbackRoot, rollbackMigration, [
      'BEGIN;',
      'CREATE TABLE "p02_partial_migration_probe" ("id" INTEGER PRIMARY KEY);',
      'SELECT 1 / 0;',
      'COMMIT;',
      '',
    ].join('\n'));
    const rollbackUrl = databaseUrl(adminUrl, rollbackDatabase);
    const failed = runPrisma(['migrate', 'deploy', '--schema', rollbackSchema], rollbackUrl);
    if (failed.status === 0) throw new Error('synthetic failing migration unexpectedly passed');

    const rollbackClient = new Client({ connectionString: rollbackUrl });
    await rollbackClient.connect();
    const partialTable = await rollbackClient.query(
      "SELECT to_regclass('public.p02_partial_migration_probe') IS NULL AS absent",
    );
    const failedRows = await rollbackClient.query(
      'SELECT count(*)::int AS count FROM _prisma_migrations WHERE finished_at IS NULL AND rolled_back_at IS NULL',
    );
    await rollbackClient.end();

    const resolved = runPrisma(
      ['migrate', 'resolve', '--rolled-back', rollbackMigration, '--schema', rollbackSchema],
      rollbackUrl,
    );
    requireStatus(resolved, 0, 'rollback resolution');
    writeFileSync(
      path.join(rollbackRoot, 'migrations', rollbackMigration, 'migration.sql'),
      'CREATE TABLE "p02_partial_migration_probe" ("id" INTEGER PRIMARY KEY);\n',
    );
    const repaired = runPrisma(['migrate', 'deploy', '--schema', rollbackSchema], rollbackUrl);
    requireStatus(repaired, 0, 'repaired migration');

    const repairedClient = new Client({ connectionString: rollbackUrl });
    await repairedClient.connect();
    const repairedRows = await repairedClient.query(
      `SELECT
         count(*) FILTER (WHERE rolled_back_at IS NOT NULL)::int AS rolled_back,
         count(*) FILTER (WHERE finished_at IS NOT NULL)::int AS finished
       FROM _prisma_migrations
       WHERE migration_name = $1`,
      [rollbackMigration],
    );
    const repairedTable = await repairedClient.query(
      "SELECT to_regclass('public.p02_partial_migration_probe') IS NOT NULL AS present",
    );
    await repairedClient.end();

    const concurrentRoot = mkdtempSync(path.join(tmpdir(), 'lobsterai-p02-concurrent-'));
    temporaryRoots.push(concurrentRoot);
    const concurrentMigration = '20260712000000_concurrent_probe';
    const concurrentSchema = createMigrationFixture(concurrentRoot, concurrentMigration, [
      'SELECT pg_sleep(1);',
      'CREATE TABLE "p02_concurrent_migration_probe" ("id" INTEGER PRIMARY KEY);',
      '',
    ].join('\n'));
    const concurrentUrl = databaseUrl(adminUrl, concurrentDatabase);
    const concurrentRuns = await Promise.all([
      runPrismaAsync(['migrate', 'deploy', '--schema', concurrentSchema], concurrentUrl),
      runPrismaAsync(['migrate', 'deploy', '--schema', concurrentSchema], concurrentUrl),
    ]);
    const exitCodes = concurrentRuns.map((result) => result.status);

    const concurrentClient = new Client({ connectionString: concurrentUrl });
    await concurrentClient.connect();
    const concurrentRows = await concurrentClient.query(
      'SELECT count(*)::int AS count FROM _prisma_migrations WHERE migration_name = $1 AND finished_at IS NOT NULL',
      [concurrentMigration],
    );
    const concurrentTable = await concurrentClient.query(
      "SELECT to_regclass('public.p02_concurrent_migration_probe') IS NOT NULL AS present",
    );
    await concurrentClient.end();

    const rollbackEvidence = {
      failed: failed.status !== 0 && failedRows.rows[0]?.count === 1,
      partialTableAbsent: partialTable.rows[0]?.absent === true,
      rolledBackRows: repairedRows.rows[0]?.rolled_back,
      repaired: repairedRows.rows[0]?.finished === 1 && repairedTable.rows[0]?.present === true,
    };
    const concurrentEvidence = {
      safe: exitCodes.every((status) => status === 0) &&
        concurrentRows.rows[0]?.count === 1 && concurrentTable.rows[0]?.present === true,
      exitCodes,
      completedRows: concurrentRows.rows[0]?.count,
    };
    if (
      !rollbackEvidence.failed ||
      !rollbackEvidence.partialTableAbsent ||
      rollbackEvidence.rolledBackRows !== 1 ||
      !rollbackEvidence.repaired ||
      !concurrentEvidence.safe
    ) {
      throw new Error('PostgreSQL migration lifecycle evidence is incomplete');
    }
    return {
      existingSchema: existingSchemaEvidence,
      rollback: rollbackEvidence,
      concurrent: concurrentEvidence,
    };
  } finally {
    for (const database of databases.reverse()) {
      await control.query(`DROP DATABASE IF EXISTS "${database}" WITH (FORCE)`);
    }
    await control.end();
    temporaryRoots.forEach((root) => rmSync(root, { recursive: true, force: true }));
  }
};
