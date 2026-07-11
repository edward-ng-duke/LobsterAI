import { createHash, randomUUID } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, renameSync, statSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const manifest = JSON.parse(
  readFileSync(path.join(repositoryRoot, 'scripts/saas-stage-gates.json'), 'utf8'),
);
const runnerPath = fileURLToPath(import.meta.url);
const runnerSha256 = createHash('sha256').update(readFileSync(runnerPath)).digest('hex');
const gateName = process.argv[2];
const gate = manifest.gates?.[gateName];

if (!gateName || !gate) {
  console.error(JSON.stringify({ status: 'ERROR', gate: gateName ?? null, reason: 'unknown gate' }));
  process.exit(1);
}

if (runnerSha256 !== manifest.runnerSha256) {
  console.error(
    JSON.stringify({ status: 'ERROR', gate: gateName, reason: 'stage runner integrity mismatch' }),
  );
  process.exit(1);
}

const fixtureErrors = gate.fixtures.flatMap((relativePath) => {
  const absolutePath = path.join(repositoryRoot, relativePath);
  if (!existsSync(absolutePath)) return [`missing fixture: ${relativePath}`];
  if (statSync(absolutePath).isFile() && statSync(absolutePath).size === 0) {
    return [`empty fixture: ${relativePath}`];
  }
  return [];
});

if (fixtureErrors.length > 0) {
  console.error(
    JSON.stringify({ status: 'ERROR', gate: gateName, stage: manifest.currentStage, errors: fixtureErrors }),
  );
  process.exit(1);
}

const exitCode = manifest.statuses?.[gate.status];
if (!Number.isInteger(exitCode) || exitCode < 0) {
  console.error(JSON.stringify({ status: 'ERROR', gate: gateName, reason: 'invalid stage status' }));
  process.exit(1);
}

let commandResult;
if (gate.status === 'PASS') {
  if (!Array.isArray(gate.command) || gate.command.length === 0) {
    console.error(JSON.stringify({ status: 'ERROR', gate: gateName, reason: 'PASS gate has no command' }));
    process.exit(1);
  }
  commandResult = spawnSync(gate.command[0], gate.command.slice(1), {
    cwd: repositoryRoot,
    encoding: 'utf8',
  });
  if (commandResult.status !== 0) {
    process.stdout.write(commandResult.stdout);
    process.stderr.write(commandResult.stderr);
    process.exit(commandResult.status ?? 1);
  }
}

const report = {
  schemaVersion: manifest.schemaVersion,
  gate: gateName,
  stage: manifest.currentStage,
  status: gate.status,
  activationTask: gate.activationTask,
  reason: gate.reason,
  fixturesChecked: gate.fixtures,
  invocationId: randomUUID(),
  generatedAt: new Date().toISOString(),
  runnerSha256,
  command: gate.command ?? null,
  commandOutputSha256: commandResult
    ? createHash('sha256').update(commandResult.stdout).digest('hex')
    : null,
};
const reportDirectory = path.join(repositoryRoot, '.reports/saas-gates');
mkdirSync(reportDirectory, { recursive: true });
const reportPath = path.join(reportDirectory, `${gateName.replaceAll(':', '-')}.json`);
const temporaryReportPath = `${reportPath}.${report.invocationId}.tmp`;
writeFileSync(temporaryReportPath, `${JSON.stringify(report, null, 2)}\n`);
renameSync(temporaryReportPath, reportPath);
console.log(JSON.stringify(report));
process.exit(exitCode);
