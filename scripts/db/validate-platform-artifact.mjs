import { lstatSync, readFileSync, realpathSync } from 'node:fs';
import path from 'node:path';

import { parseJsonRejectingDuplicateKeys } from '../json-without-duplicate-keys.mjs';
import { repositoryRoot } from './common.mjs';
import { validateExistingSchemaEvidence } from './existing-schema-evidence.mjs';
import {
  createPostgresImagePolicyError,
  loadPostgresImageManifest,
  normalizeDockerPlatform,
  PostgresImagePolicyErrorCode,
  selectApprovedPostgresImage,
  validateApprovedPostgresImageInspection,
  validatePostgresServerSettings,
} from './postgres-image-policy.mjs';

const argument = (name) => {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
};

const MAX_REPORT_BYTES = 1024 * 1024;
const exactFields = (value, fields, label) => {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    fail(`${label} must be an object`);
  }
  const actual = Object.keys(value).sort();
  const expected = [...fields].sort();
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    fail(`${label} fields differ: expected ${expected.join(',')}, received ${actual.join(',')}`);
  }
  return value;
};

const fail = (message) => {
  throw new Error(message);
};

const readReport = (root, name) => {
  try {
    const target = path.join(root, name);
    const stat = lstatSync(target);
    if (!stat.isFile() || stat.isSymbolicLink()) fail(`${name} must be a regular non-symlink file`);
    if (stat.size <= 0 || stat.size > MAX_REPORT_BYTES) {
      fail(`${name} size must be between 1 and ${MAX_REPORT_BYTES} bytes`);
    }
    const canonicalRoot = realpathSync(root);
    const canonicalTarget = realpathSync(target);
    const relative = path.relative(canonicalRoot, canonicalTarget);
    if (!relative || relative.startsWith('..') || path.isAbsolute(relative)) {
      fail(`${name} escapes the canonical artifact root`);
    }
    return parseJsonRejectingDuplicateKeys(readFileSync(canonicalTarget, 'utf8'));
  } catch (error) {
    return fail(`cannot read ${name}: ${error.message}`);
  }
};

const requireEqual = (actual, expected, label) => {
  if (actual !== expected) fail(`${label} differs: expected ${expected}, received ${actual}`);
};

const validateProvider = (provider, name, kind) => {
  const commonFields = [
    'dockerPlatform',
    'runnerOs',
    'runnerArch',
    'image',
    'immutableReference',
    'digest',
    'inspectedOs',
    'inspectedArch',
    'repoDigests',
    'containerId',
    'serverVersion',
    'serverMajor',
    'lcCollate',
    'lcCtype',
    'timezone',
    'ssl',
  ];
  exactFields(
    provider,
    kind === 'P02_DATABASE_PREFLIGHT'
      ? [...commonFields, 'citextAvailableVersion', 'generatedUuid', 'migrationRole']
      : commonFields,
    `${name} checks.provider`,
  );
  if (kind === 'P02_DATABASE_PREFLIGHT') {
    exactFields(provider.migrationRole, ['rolsuper', 'rolbypassrls'], `${name} migrationRole`);
  }
};

const validateStrictReportSchema = (report, name, kind) => {
  const rootFields = [
    'schemaVersion',
    'kind',
    'runId',
    'generatedAt',
    'sourceSha',
    'nodeVersion',
    'platform',
    'status',
    'checks',
    'cleanup',
  ];
  if (kind === 'P02_DATABASE_INTEGRATION') rootFields.push('skipped');
  if (report?.status === 'FAILED' || report?.status === 'BLOCKED') rootFields.push('error');
  exactFields(report, rootFields, name);
  if (rootFields.includes('error') && (typeof report.error !== 'string' || report.error.length === 0)) {
    fail(`${name} error is required for ${report.status}`);
  }
  exactFields(report.cleanup, ['attempted', 'containerId', 'removed'], `${name} cleanup`);
  requireEqual(report.cleanup.attempted, true, `${name} cleanup.attempted`);
  requireEqual(report.cleanup.removed, true, `${name} cleanup.removed`);
  if (typeof report.generatedAt !== 'string' || !Number.isFinite(Date.parse(report.generatedAt))) {
    fail(`${name} generatedAt is invalid`);
  }
  if (typeof report.nodeVersion !== 'string' || typeof report.platform !== 'string') {
    fail(`${name} nodeVersion/platform is invalid`);
  }

  if (kind === 'P02_DATABASE_PREFLIGHT') {
    exactFields(report.checks, ['contracts', 'provider'], `${name} checks`);
    exactFields(
      report.checks.contracts,
      ['acceptedSha', 'testerReportSha', 'contractVersion', 'sourceHash'],
      `${name} checks.contracts`,
    );
  } else {
    exactFields(report.checks, [
      'provider',
      'migrations',
      'rls',
      'roles',
      'seed',
      'checksPassed',
      'checksTotal',
      'testResults',
      'testOutputSha256',
    ], `${name} checks`);
    exactFields(report.checks.migrations, [
      'first', 'repeat', 'existingSchema', 'rollback', 'concurrent',
    ], `${name} checks.migrations`);
    exactFields(report.checks.migrations.existingSchema, [
      'independentDatabase', 'prepared', 'preserved', 'completedMigrations',
      'beforeCatalog', 'afterCatalog', 'migrationHistory',
    ], `${name} existingSchema`);
    for (const catalogName of ['beforeCatalog', 'afterCatalog']) {
      const catalog = report.checks.migrations.existingSchema[catalogName];
      exactFields(catalog, ['payload', 'sha256'], `${name} existingSchema.${catalogName}`);
      exactFields(
        catalog.payload,
        ['tables'],
        `${name} existingSchema.${catalogName}.payload`,
      );
      if (!Array.isArray(catalog.payload.tables)) {
        fail(`${name} existingSchema.${catalogName}.payload.tables must be an array`);
      }
    }
    if (!Array.isArray(report.checks.migrations.existingSchema.migrationHistory)) {
      fail(`${name} existingSchema.migrationHistory must be an array`);
    }
    report.checks.migrations.existingSchema.migrationHistory.forEach((entry, index) =>
      exactFields(
        entry,
        ['migrationName', 'checksum', 'finished', 'rolledBack'],
        `${name} existingSchema.migrationHistory[${index}]`,
      ),
    );
    exactFields(report.checks.migrations.rollback, [
      'failed', 'partialTableAbsent', 'rolledBackRows', 'repaired',
    ], `${name} rollback`);
    exactFields(report.checks.migrations.concurrent, [
      'safe', 'exitCodes', 'completedRows',
    ], `${name} concurrent`);
    exactFields(report.checks.testResults, [
      'passed', 'failed', 'skipped', 'todo', 'total',
    ], `${name} testResults`);
    if (!Array.isArray(report.checks.rls) || !Array.isArray(report.checks.roles) ||
        !Array.isArray(report.checks.seed)) {
      fail(`${name} RLS, roles, and seed evidence must be arrays`);
    }
    report.checks.rls.forEach((entry, index) => exactFields(entry, [
      'relrowsecurity', 'relforcerowsecurity', 'table_owner', 'policyname', 'qual', 'with_check',
    ], `${name} rls[${index}]`));
    report.checks.roles.forEach((entry, index) => exactFields(entry, [
      'rolname', 'rolsuper', 'rolbypassrls',
    ], `${name} roles[${index}]`));
    report.checks.seed.forEach((entry, index) => exactFields(entry, [
      'tenant_id', 'logical_id', 'id',
    ], `${name} seed[${index}]`));
    if (!/^[a-f0-9]{64}$/.test(report.checks.testOutputSha256 ?? '')) {
      fail(`${name} testOutputSha256 is invalid`);
    }
  }
  validateProvider(report.checks.provider, name, kind);
};

let exitCode = 0;
try {
  const rootArgument = argument('--root');
  const root = rootArgument ? path.resolve(rootArgument) : undefined;
  const sourceSha = argument('--source-sha');
  const requestedPlatform = argument('--platform');
  if (!root || !/^[a-f0-9]{40}$/.test(sourceSha ?? '')) {
    fail('artifact root and a 40-character source SHA are required');
  }
  const normalizedPlatform = normalizeDockerPlatform(requestedPlatform);
  if (!normalizedPlatform || normalizedPlatform !== requestedPlatform) {
    throw createPostgresImagePolicyError(
      PostgresImagePolicyErrorCode.UnsupportedPlatform,
      `unsupported requested platform: ${requestedPlatform}`,
      true,
    );
  }

  const manifest = loadPostgresImageManifest(repositoryRoot);
  const approvedImage = selectApprovedPostgresImage(
    manifest,
    normalizedPlatform,
    normalizedPlatform,
  );
  const preflight = readReport(root, 'preflight.json');
  const integration = readReport(root, 'integration.json');
  for (const [name, report, kind] of [
    ['preflight.json', preflight, 'P02_DATABASE_PREFLIGHT'],
    ['integration.json', integration, 'P02_DATABASE_INTEGRATION'],
  ]) {
    validateStrictReportSchema(report, name, kind);
    requireEqual(report.schemaVersion, 1, `${name} schemaVersion`);
    requireEqual(report.kind, kind, `${name} kind`);
    requireEqual(report.sourceSha, sourceSha, `${name} sourceSha`);
    if (!['PASS', 'FAILED', 'BLOCKED'].includes(report.status)) {
      fail(`${name} status is invalid`);
    }
    if (typeof report.runId !== 'string' || report.runId.length === 0) {
      fail(`${name} runId is required`);
    }
    requireEqual(report.cleanup?.removed, true, `${name} cleanup.removed`);

    const provider = report.checks?.provider;
    requireEqual(provider?.dockerPlatform, normalizedPlatform, `${name} dockerPlatform`);
    requireEqual(provider?.runnerOs, 'linux', `${name} runnerOs`);
    requireEqual(
      normalizeDockerPlatform(provider?.runnerArch),
      normalizedPlatform,
      `${name} runnerArch`,
    );
    requireEqual(provider?.image, manifest.image, `${name} image`);
    requireEqual(provider?.digest, approvedImage.digest, `${name} digest`);
    requireEqual(
      provider?.immutableReference,
      approvedImage.immutableReference,
      `${name} immutableReference`,
    );
    validateApprovedPostgresImageInspection(approvedImage, {
      Os: provider?.inspectedOs,
      Architecture: provider?.inspectedArch,
      RepoDigests: provider?.repoDigests,
    });
    validatePostgresServerSettings(manifest, provider);
  }

  requireEqual(preflight.status, 'PASS', 'preflight.json status');
  if (integration.status !== 'PASS') {
    const failedResults = integration.checks?.testResults;
    for (const field of ['passed', 'failed', 'skipped', 'todo', 'total']) {
      if (!Number.isInteger(failedResults?.[field]) || failedResults[field] < 0) {
        fail(`integration failed testResults.${field} is invalid`);
      }
    }
    if (
      failedResults.passed + failedResults.failed + failedResults.skipped + failedResults.todo !==
      failedResults.total
    ) {
      fail('integration failed test result counts do not add up to total');
    }
    requireEqual(
      integration.checks?.checksPassed,
      failedResults.passed,
      'integration failed checksPassed',
    );
    requireEqual(
      integration.checks?.checksTotal,
      failedResults.total,
      'integration failed checksTotal',
    );
    fail(`structurally valid ${integration.status} integration artifact cannot pass the required gate`);
  }

  requireEqual(integration.skipped, 0, 'integration skipped');
  const migrations = integration.checks?.migrations;
  for (const field of ['first', 'repeat']) {
    requireEqual(migrations?.[field], true, `integration migrations.${field}`);
  }
  const existingSchema = migrations?.existingSchema;
  for (const field of ['independentDatabase', 'prepared', 'preserved']) {
    requireEqual(existingSchema?.[field], true, `integration migrations.existingSchema.${field}`);
  }
  requireEqual(
    existingSchema?.completedMigrations,
    2,
    'integration migrations.existingSchema.completedMigrations',
  );
  validateExistingSchemaEvidence(existingSchema);
  requireEqual(migrations?.rollback?.failed, true, 'integration migrations.rollback.failed');
  requireEqual(
    migrations?.rollback?.partialTableAbsent,
    true,
    'integration migrations.rollback.partialTableAbsent',
  );
  requireEqual(
    migrations?.rollback?.rolledBackRows,
    1,
    'integration migrations.rollback.rolledBackRows',
  );
  requireEqual(migrations?.rollback?.repaired, true, 'integration migrations.rollback.repaired');
  requireEqual(migrations?.concurrent?.safe, true, 'integration migrations.concurrent.safe');
  if (JSON.stringify(migrations?.concurrent?.exitCodes) !== JSON.stringify([0, 0])) {
    fail('integration migrations.concurrent.exitCodes differs from [0,0]');
  }
  requireEqual(
    migrations?.concurrent?.completedRows,
    1,
    'integration migrations.concurrent.completedRows',
  );
  const checksPassed = integration.checks?.checksPassed;
  const checksTotal = integration.checks?.checksTotal;
  if (!Number.isInteger(checksPassed) || checksPassed <= 0 || checksPassed !== checksTotal) {
    fail('integration checksPassed/checksTotal are incomplete');
  }
  const testResults = integration.checks?.testResults;
  for (const field of ['failed', 'skipped', 'todo']) {
    requireEqual(testResults?.[field], 0, `integration testResults.${field}`);
  }
  requireEqual(testResults?.passed, checksPassed, 'integration testResults.passed');
  requireEqual(testResults?.total, checksTotal, 'integration testResults.total');
  requireEqual(integration.skipped, testResults?.skipped, 'integration skipped/testResults.skipped');

  console.log(JSON.stringify({
    status: 'PASS',
    sourceSha,
    dockerPlatform: normalizedPlatform,
    digest: approvedImage.digest,
    preflightRunId: preflight.runId,
    integrationRunId: integration.runId,
    checksPassed,
    checksTotal,
  }));
} catch (error) {
  const blocked = Boolean(error?.blocked);
  exitCode = blocked ? 2 : 1;
  console.error(JSON.stringify({
    status: blocked ? 'BLOCKED' : 'FAILED',
    error: error instanceof Error ? error.message : String(error),
  }));
}

process.exitCode = exitCode;
