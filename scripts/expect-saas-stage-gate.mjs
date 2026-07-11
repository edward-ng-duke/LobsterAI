import { createHash } from 'node:crypto';
import { existsSync, readFileSync, rmSync, statSync } from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const manifest = JSON.parse(
  readFileSync(path.join(repositoryRoot, 'scripts/saas-stage-gates.json'), 'utf8'),
);
const gateName = process.argv[2];
const expectedGate = manifest.gates?.[gateName];

if (!gateName || !expectedGate) {
  console.error(`[P00 Gate] unknown gate: ${gateName ?? '(missing)'}`);
  process.exit(1);
}

const runnerPath = path.join(repositoryRoot, 'scripts/run-saas-stage-gate.mjs');
const runnerSha256 = createHash('sha256').update(readFileSync(runnerPath)).digest('hex');
if (runnerSha256 !== manifest.runnerSha256) {
  console.error(`[P00 Gate] ${gateName} runner integrity mismatch`);
  process.exit(1);
}

const reportPath = path.join(
  repositoryRoot,
  '.reports/saas-gates',
  `${gateName.replaceAll(':', '-')}.json`,
);
rmSync(reportPath, { force: true });
const startedAt = Date.now();

const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const result = spawnSync(npmCommand, ['run', '--silent', gateName], {
  cwd: repositoryRoot,
  encoding: 'utf8',
});
const expectedExitCode = manifest.statuses[expectedGate.status];
const reportLine = result.stdout
  .trim()
  .split(/\r?\n/)
  .findLast((line) => line.startsWith('{'));

let report;
try {
  report = reportLine ? JSON.parse(reportLine) : undefined;
} catch {
  report = undefined;
}

let fileReport;
if (existsSync(reportPath)) {
  try {
    fileReport = JSON.parse(readFileSync(reportPath, 'utf8'));
  } catch {
    fileReport = undefined;
  }
}

const expectedFields = {
  schemaVersion: manifest.schemaVersion,
  gate: gateName,
  stage: manifest.currentStage,
  status: expectedGate.status,
  activationTask: expectedGate.activationTask,
  reason: expectedGate.reason,
  fixturesChecked: expectedGate.fixtures,
  runnerSha256: manifest.runnerSha256,
};
const hasExpectedFields = (candidate) =>
  candidate &&
  Object.entries(expectedFields).every(
    ([key, value]) => JSON.stringify(candidate[key]) === JSON.stringify(value),
  );
const generatedAt = Date.parse(fileReport?.generatedAt ?? '');
const reportIsFresh =
  existsSync(reportPath) &&
  statSync(reportPath).mtimeMs >= startedAt - 1_000 &&
  Number.isFinite(generatedAt) &&
  generatedAt >= startedAt - 1_000 &&
  typeof fileReport?.invocationId === 'string' &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    fileReport.invocationId,
  );

if (
  result.status !== expectedExitCode ||
  !hasExpectedFields(report) ||
  !hasExpectedFields(fileReport) ||
  JSON.stringify(report) !== JSON.stringify(fileReport) ||
  !reportIsFresh
) {
  console.error(`[P00 Gate] ${gateName} did not report the declared stage status`);
  console.error(result.stdout);
  console.error(result.stderr);
  process.exit(1);
}

console.log(`[P00 Gate] ${gateName}: verified ${expectedGate.status} (exit ${expectedExitCode})`);
