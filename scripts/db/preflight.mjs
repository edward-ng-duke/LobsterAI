import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import path from 'node:path';

import pg from 'pg';

import {
  createRunMetadata,
  readJson,
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

const { Client } = pg;
const contractsOnly = process.argv.includes('--contracts');
const reportPath = contractsOnly
  ? '.reports/db/contracts-preflight.json'
  : '.reports/db/preflight.json';
const report = {
  ...createRunMetadata(contractsOnly ? 'P02_CONTRACT_PREFLIGHT' : 'P02_DATABASE_PREFLIGHT'),
  status: 'RUNNING',
  checks: {},
};

const run = (command, args) =>
  spawnSync(command, args, { cwd: repositoryRoot, encoding: 'utf8' });

const requireSuccessful = (result, label) => {
  if (result.status !== 0) {
    throw new Error(`${label} failed: ${result.stderr || result.stdout}`.trim());
  }
  return result.stdout.trim();
};

const verifyContracts = () => {
  const baseline = readJson('scripts/db/p02-baseline.json');
  const ancestor = run('git', ['merge-base', '--is-ancestor', baseline.p01AcceptedSha, 'HEAD']);
  if (ancestor.status !== 0) throw new Error('P01 accepted SHA is not an ancestor of HEAD');

  const testerReportSha = requireSuccessful(
    run('git', [
      'log',
      '-1',
      '--format=%H',
      '--',
      '改造计划/20260711_V2单租户Web闭环开发/任务/P01-PR1契约/测试报告.md',
    ]),
    'P01 tester report lookup',
  );
  if (testerReportSha !== baseline.p01TesterReportSha) {
    throw new Error('P01 tester report SHA differs from the accepted P02 baseline');
  }

  const completionTable = readFileSync(
    path.join(repositoryRoot, '改造计划/20260711_V2单租户Web闭环开发/00-总体完成表.md'),
    'utf8',
  );
  if (!/^\| \[x\] \| P01 PR-1 contracts\/codegen .+\| \[x\] \| \[x\] \| \[x\] \| \[x\] \|/m.test(completionTable)) {
    throw new Error('P01 is not coordinator-accepted in the authoritative completion table');
  }

  const contractManifest = readFileSync(
    path.join(repositoryRoot, 'libs/shared/contracts/generated/contract-manifest.ts'),
    'utf8',
  );
  const contractVersion = contractManifest.match(/"contractVersion":\s*"([^"]+)"/)?.[1];
  const sourceHash = contractManifest.match(/"sourceHash":\s*"([a-f0-9]{64})"/)?.[1];
  if (contractVersion !== baseline.contractVersion || sourceHash !== baseline.contractSourceHash) {
    throw new Error('accepted P01 contract version/source hash drifted');
  }

  report.checks.contracts = {
    acceptedSha: baseline.p01AcceptedSha,
    testerReportSha,
    contractVersion,
    sourceHash,
  };
};

let container;
let exitCode = 0;
try {
  verifyContracts();
  if (!contractsOnly) {
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
    const { GenericContainer, Wait } = await import('testcontainers');

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

    const password = `p02-${report.runId}`;
    container = await new GenericContainer(approvedImage.immutableReference)
      .withEnvironment({
        POSTGRES_DB: 'p02_preflight',
        POSTGRES_PASSWORD: password,
        POSTGRES_USER: 'p02_admin',
      })
      .withExposedPorts(5432)
      .withWaitStrategy(Wait.forLogMessage(/database system is ready to accept connections/, 2))
      .withStartupTimeout(120_000)
      .start();

    const client = new Client({
      host: container.getHost(),
      port: container.getMappedPort(5432),
      database: 'p02_preflight',
      user: 'p02_admin',
      password,
    });
    await client.connect();
    const version = await client.query('SHOW server_version');
    const locale = await client.query(
      'SELECT datcollate, datctype FROM pg_database WHERE datname = current_database()',
    );
    const runtimeSettings = await client.query(
      "SELECT current_setting('TimeZone') AS timezone, current_setting('ssl') AS ssl",
    );
    const extension = await client.query(
      "SELECT name, default_version, installed_version FROM pg_available_extensions WHERE name = 'citext'",
    );
    const uuid = await client.query('SELECT gen_random_uuid()::text AS generated_uuid');
    const role = await client.query(
      'SELECT rolsuper, rolbypassrls FROM pg_roles WHERE rolname = current_user',
    );
    await client.end();

    const serverVersion = version.rows[0]?.server_version;
    const serverSettings = validatePostgresServerSettings(manifest, {
      serverVersion,
      lcCollate: locale.rows[0]?.datcollate,
      lcCtype: locale.rows[0]?.datctype,
      timezone: runtimeSettings.rows[0]?.timezone,
      ssl: runtimeSettings.rows[0]?.ssl,
    });
    if (extension.rowCount !== 1 || !extension.rows[0]?.default_version) {
      throw new Error('citext is not available from pg_available_extensions');
    }
    if (!/^[0-9a-f-]{36}$/i.test(uuid.rows[0]?.generated_uuid ?? '')) {
      throw new Error('gen_random_uuid() did not return a UUID');
    }
    if (role.rows[0]?.rolsuper !== true || role.rows[0]?.rolbypassrls !== true) {
      throw new Error('migration role preflight is not an administrative role');
    }

    report.checks.provider = {
      dockerPlatform,
      runnerOs: process.platform,
      runnerArch: process.arch,
      image: manifest.image,
      immutableReference: approvedImage.immutableReference,
      digest: approvedImage.digest,
      ...inspection,
      containerId: container.getId(),
      ...serverSettings,
      citextAvailableVersion: extension.rows[0].default_version,
      generatedUuid: uuid.rows[0].generated_uuid,
      migrationRole: { rolsuper: role.rows[0].rolsuper, rolbypassrls: role.rows[0].rolbypassrls },
    };
  }

  report.status = 'PASS';
} catch (error) {
  const blocked = Boolean(error?.blocked);
  report.status = blocked ? 'BLOCKED' : 'FAILED';
  report.error = error instanceof Error ? error.message : String(error);
  exitCode = blocked ? 2 : 1;
} finally {
  if (container) {
    try {
      const containerId = container.getId();
      await container.stop();
      report.cleanup = { containerId, removed: true };
    } catch (error) {
      report.status = 'FAILED';
      report.cleanup = {
        containerId: container.getId(),
        removed: false,
        error: error instanceof Error ? error.message : String(error),
      };
      exitCode = 1;
    }
  }
  writeAtomicJson(reportPath, report);
  (exitCode === 0 ? console.log : console.error)(JSON.stringify(report));
  process.exitCode = exitCode;
}
