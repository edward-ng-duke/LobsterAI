import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';

import pg from 'pg';

import {
  createRunMetadata,
  repositoryRoot,
  writeAtomicJson,
} from './common.mjs';
import {
  createPostgresImagePolicyError,
  loadPostgresImageManifest,
  normalizeDockerPlatform,
  PostgresImagePolicyErrorCode,
  selectApprovedPostgresImage,
  validateApprovedPostgresImageInspection,
  validatePostgresServerSettings,
} from './postgres-image-policy.mjs';
import { stopPostgresContainer } from './postgres-container-cleanup.mjs';
import { runPostgresMigrationLifecycle } from './postgres-migration-lifecycle.mjs';

const { Client } = pg;
const report = {
  ...createRunMetadata('P02_DATABASE_INTEGRATION'),
  status: 'RUNNING',
  skipped: 0,
  checks: {},
};

const run = (command, args, env = {}) =>
  spawnSync(command, args, {
    cwd: repositoryRoot,
    encoding: 'utf8',
    env: { ...process.env, ...env },
  });

const requireSuccessful = (result, label) => {
  if (result.status !== 0) {
    throw new Error(`${label} failed: ${result.stderr || result.stdout}`.trim());
  }
  return result.stdout.trim();
};

let container;
let exitCode = 0;
try {
  requireSuccessful(run(process.execPath, ['scripts/db/preflight.mjs', '--contracts']), 'contract preflight');
  const manifest = loadPostgresImageManifest(repositoryRoot);
  const dockerInfo = run('docker', ['info', '--format', '{{.OSType}}/{{.Architecture}}']);
  if (dockerInfo.status !== 0) {
    throw createPostgresImagePolicyError(
      PostgresImagePolicyErrorCode.DockerProviderUnavailable,
      'Docker provider is unavailable',
      true,
    );
  }
  const dockerPlatform = normalizeDockerPlatform(dockerInfo.stdout.trim());
  const approvedImage = selectApprovedPostgresImage(
    manifest,
    dockerInfo.stdout.trim(),
    process.arch,
  );
  if (!process.env.DOCKER_HOST) {
    process.env.DOCKER_HOST = requireSuccessful(
      run('docker', ['context', 'inspect', '--format', '{{.Endpoints.docker.Host}}']),
      'Docker context endpoint lookup',
    );
  }
  process.env.TESTCONTAINERS_DOCKER_SOCKET_OVERRIDE ??= '/var/run/docker.sock';

  let inspect = run('docker', ['image', 'inspect', approvedImage.immutableReference]);
  if (inspect.status !== 0) {
    const pull = run('docker', ['pull', approvedImage.immutableReference]);
    if (pull.status !== 0) {
      throw createPostgresImagePolicyError(
        PostgresImagePolicyErrorCode.ImageUnavailable,
        `immutable PostgreSQL image unavailable: ${pull.stderr}`,
        true,
      );
    }
    inspect = run('docker', ['image', 'inspect', approvedImage.immutableReference]);
  }
  const inspected = JSON.parse(requireSuccessful(inspect, 'PostgreSQL image inspect'))[0];
  const inspection = validateApprovedPostgresImageInspection(approvedImage, inspected);

  const { GenericContainer, Wait } = await import('testcontainers');
  const adminPassword = `p02-${report.runId}`;
  const database = 'p02_integration';
  container = await new GenericContainer(approvedImage.immutableReference)
    .withEnvironment({
      POSTGRES_DB: database,
      POSTGRES_PASSWORD: adminPassword,
      POSTGRES_USER: 'p02_admin',
    })
    .withExposedPorts(5432)
    .withWaitStrategy(Wait.forLogMessage(/database system is ready to accept connections/, 2))
    .withStartupTimeout(120_000)
    .start();

  const host = container.getHost();
  const port = container.getMappedPort(5432);
  const adminUrl = `postgresql://p02_admin:${encodeURIComponent(adminPassword)}@${host}:${port}/${database}?schema=public`;
  const appPassword = 'p02-synthetic-app-role';
  const appUrl = `postgresql://p02_app:${encodeURIComponent(appPassword)}@${host}:${port}/${database}?schema=public`;
  const migrationEnv = { DATABASE_URL: adminUrl };
  requireSuccessful(run('npx', ['prisma', 'migrate', 'deploy', '--schema', 'prisma/schema.prisma'], migrationEnv), 'empty database migration');
  requireSuccessful(run('npx', ['prisma', 'migrate', 'deploy', '--schema', 'prisma/schema.prisma'], migrationEnv), 'repeat migration');
  requireSuccessful(run('npx', ['prisma', 'migrate', 'deploy', '--schema', 'prisma/schema.prisma'], migrationEnv), 'existing schema migration');
  const migrationLifecycle = {
    first: true,
    repeat: true,
    existingSchema: true,
    ...await runPostgresMigrationLifecycle({ adminUrl, runId: report.runId }),
  };

  const admin = new Client({ connectionString: adminUrl });
  await admin.connect();
  await admin.query(`
    CREATE ROLE p02_app
      LOGIN PASSWORD '${appPassword}'
      NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOREPLICATION NOBYPASSRLS;
    GRANT CONNECT ON DATABASE p02_integration TO p02_app;
    GRANT USAGE ON SCHEMA public TO p02_app;
    GRANT SELECT ON TABLE tenants TO p02_app;
    GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE agents TO p02_app;
  `);
  await admin.end();

  const seedEnv = { DATABASE_URL: adminUrl, NODE_ENV: 'test' };
  requireSuccessful(
    run(process.execPath, ['--experimental-strip-types', 'prisma/seed/index.ts'], seedEnv),
    'first deterministic seed',
  );
  requireSuccessful(
    run(process.execPath, ['--experimental-strip-types', 'prisma/seed/index.ts'], seedEnv),
    'repeat deterministic seed',
  );

  const catalog = new Client({ connectionString: adminUrl });
  await catalog.connect();
  const serverVersion = (await catalog.query('SHOW server_version')).rows[0].server_version;
  const locale = await catalog.query(
    'SELECT datcollate, datctype FROM pg_database WHERE datname = current_database()',
  );
  const runtimeSettings = await catalog.query(
    "SELECT current_setting('TimeZone') AS timezone, current_setting('ssl') AS ssl",
  );
  const migrations = await catalog.query(
    'SELECT migration_name, finished_at IS NOT NULL AS finished FROM _prisma_migrations ORDER BY started_at',
  );
  const rls = await catalog.query(`
    SELECT c.relrowsecurity, c.relforcerowsecurity, pg_get_userbyid(c.relowner) AS table_owner,
           p.policyname, p.qual, p.with_check
      FROM pg_class c
      JOIN pg_policies p ON p.tablename = c.relname AND p.schemaname = 'public'
     WHERE c.relname = 'agents'
  `);
  const roles = await catalog.query(
    "SELECT rolname, rolsuper, rolbypassrls FROM pg_roles WHERE rolname IN ('p02_admin', 'p02_app') ORDER BY rolname",
  );
  const seedRows = await catalog.query(
    'SELECT tenant_id::text, logical_id, id::text FROM agents ORDER BY tenant_id, logical_id',
  );
  await catalog.end();

  const serverSettings = validatePostgresServerSettings(manifest, {
    serverVersion,
    lcCollate: locale.rows[0]?.datcollate,
    lcCtype: locale.rows[0]?.datctype,
    timezone: runtimeSettings.rows[0]?.timezone,
    ssl: runtimeSettings.rows[0]?.ssl,
  });

  if (migrations.rowCount !== 1 || migrations.rows[0]?.finished !== true) {
    throw new Error('repeat migrate did not preserve one completed Prisma migration history row');
  }
  if (rls.rowCount !== 1 || !rls.rows[0]?.relrowsecurity || !rls.rows[0]?.relforcerowsecurity) {
    throw new Error('live agents RLS catalog is incomplete');
  }
  const appRole = roles.rows.find((role) => role.rolname === 'p02_app');
  if (!appRole || appRole.rolsuper || appRole.rolbypassrls || rls.rows[0].table_owner === 'p02_app') {
    throw new Error('application role is privileged or owns the tenant table');
  }
  if (seedRows.rowCount !== 2 || new Set(seedRows.rows.map((row) => row.id)).size !== 2) {
    throw new Error('deterministic seed did not create distinct A/B internal main UUIDs');
  }

  const testEnv = {
    P02_ADMIN_DATABASE_URL: adminUrl,
    P02_APP_DATABASE_URL: appUrl,
    P02_CONTAINER_ID: container.getId(),
    P02_DATABASE_RUN_ID: report.runId,
    P02_MIGRATION_LIFECYCLE_EVIDENCE: JSON.stringify(migrationLifecycle),
  };
  const tests = run(
    'npx',
    ['vitest', 'run', '--config', 'vitest.db.config.ts', '--reporter=verbose'],
    testEnv,
  );
  process.stdout.write(tests.stdout);
  process.stderr.write(tests.stderr);
  if (tests.status !== 0) throw new Error(`database integration tests failed with exit ${tests.status}`);
  const checksTotal = Number.parseInt(
    tests.stdout.match(/Tests\s+(\d+) passed/)?.[1] ?? '',
    10,
  );
  if (!Number.isInteger(checksTotal) || checksTotal <= 0) {
    throw new Error('database integration test count is unavailable');
  }

  report.status = 'PASS';
  report.checks = {
    provider: {
      dockerPlatform,
      runnerOs: process.platform,
      runnerArch: process.arch,
      image: manifest.image,
      immutableReference: approvedImage.immutableReference,
      digest: approvedImage.digest,
      ...inspection,
      containerId: container.getId(),
      ...serverSettings,
    },
    migrations: migrationLifecycle,
    rls: rls.rows,
    roles: roles.rows,
    seed: seedRows.rows,
    checksPassed: checksTotal,
    checksTotal,
    testOutputSha256: createHash('sha256').update(`${tests.stdout}\n${tests.stderr}`).digest('hex'),
  };
} catch (error) {
  const isBlocked = Boolean(error?.blocked) || /Could not find a working container runtime strategy/.test(String(error));
  report.status = isBlocked ? 'BLOCKED' : 'FAILED';
  report.error = error instanceof Error ? error.message : String(error);
  exitCode = isBlocked ? 2 : 1;
} finally {
  report.cleanup = await stopPostgresContainer(container);
  if (container && !report.cleanup.removed) {
    report.status = 'FAILED';
    exitCode = 1;
  }
  writeAtomicJson('.reports/db/integration.json', report);
  (exitCode === 0 ? console.log : console.error)(JSON.stringify(report));
  process.exitCode = exitCode;
}
