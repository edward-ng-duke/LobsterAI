import { readFileSync } from 'node:fs';
import path from 'node:path';

import { parseJsonRejectingDuplicateKeys } from '../json-without-duplicate-keys.mjs';
import { repositoryRoot } from './common.mjs';
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

const fail = (message) => {
  throw new Error(message);
};

const readReport = (root, name) => {
  try {
    return parseJsonRejectingDuplicateKeys(readFileSync(path.join(root, name), 'utf8'));
  } catch (error) {
    return fail(`cannot read ${name}: ${error.message}`);
  }
};

const requireEqual = (actual, expected, label) => {
  if (actual !== expected) fail(`${label} differs: expected ${expected}, received ${actual}`);
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
    requireEqual(report.schemaVersion, 1, `${name} schemaVersion`);
    requireEqual(report.kind, kind, `${name} kind`);
    requireEqual(report.sourceSha, sourceSha, `${name} sourceSha`);
    requireEqual(report.status, 'PASS', `${name} status`);
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

  requireEqual(integration.skipped, 0, 'integration skipped');
  const migrations = integration.checks?.migrations;
  for (const field of ['first', 'repeat', 'existingSchema']) {
    requireEqual(migrations?.[field], true, `integration migrations.${field}`);
  }
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
