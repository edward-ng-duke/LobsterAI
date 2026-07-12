import { createHash, randomUUID } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, renameSync, rmSync, statSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const manifestContent = readFileSync(
  path.join(repositoryRoot, 'scripts/saas-stage-gates.json'),
);
const manifest = JSON.parse(manifestContent.toString('utf8'));
const manifestSha256 = createHash('sha256').update(manifestContent).digest('hex');
const runnerPath = fileURLToPath(import.meta.url);
const runnerSha256 = createHash('sha256').update(readFileSync(runnerPath)).digest('hex');
const gateName = process.argv[2];
const gate = manifest.gates?.[gateName];
const reportDirectory = path.join(repositoryRoot, '.reports/saas-gates');
const reportPath = gateName
  ? path.join(reportDirectory, `${gateName.replaceAll(':', '-')}.json`)
  : undefined;

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

const externallyExpectedManifestSha256 =
  process.env.SAAS_EXPECTED_STAGE_MANIFEST_SHA256 || process.argv[3];
if (gateName === 'prisma:validate') {
  if (!/^[a-f0-9]{64}$/.test(externallyExpectedManifestSha256 ?? '')) {
    console.error(JSON.stringify({
      status: 'ERROR',
      gate: gateName,
      reason: 'external stage manifest digest is required',
    }));
    process.exit(1);
  }
  if (externallyExpectedManifestSha256 !== manifestSha256) {
    console.error(JSON.stringify({
      status: 'ERROR',
      gate: gateName,
      reason: 'external stage manifest digest mismatch',
    }));
    process.exit(1);
  }
}

const fixtureErrors = gate.fixtures.flatMap((relativePath) => {
  const absolutePath = path.join(repositoryRoot, relativePath);
  if (!existsSync(absolutePath)) return [`missing fixture: ${relativePath}`];
  if (statSync(absolutePath).isFile() && statSync(absolutePath).size === 0) {
    return [`empty fixture: ${relativePath}`];
  }
  return [];
});

const trustedFileErrors = Object.entries(gate.trustedFiles ?? {}).flatMap(
  ([relativePath, expectedSha256]) => {
    const absolutePath = path.join(repositoryRoot, relativePath);
    if (!existsSync(absolutePath)) return [`missing trusted file: ${relativePath}`];
    const actualSha256 = createHash('sha256').update(readFileSync(absolutePath)).digest('hex');
    return actualSha256 === expectedSha256
      ? []
      : [`trusted file integrity mismatch: ${relativePath}`];
  },
);

if (fixtureErrors.length > 0 || trustedFileErrors.length > 0) {
  console.error(
    JSON.stringify({
      status: 'ERROR',
      gate: gateName,
      stage: manifest.currentStage,
      errors: [...fixtureErrors, ...trustedFileErrors],
    }),
  );
  process.exit(1);
}

if (reportPath) rmSync(reportPath, { force: true });

const gitResult = spawnSync('git', ['rev-parse', 'HEAD'], { cwd: repositoryRoot, encoding: 'utf8' });
const gitSourceSha = gitResult.status === 0 ? gitResult.stdout.trim() : undefined;
const providedSourceSha = process.env.SAAS_SOURCE_SHA || process.env.GITHUB_SHA;
if (providedSourceSha && gitSourceSha && providedSourceSha !== gitSourceSha) {
  console.error(JSON.stringify({ status: 'ERROR', gate: gateName, reason: 'source SHA does not match checkout HEAD' }));
  process.exit(1);
}
const sourceSha = providedSourceSha ?? gitSourceSha;
if (!sourceSha || !/^[a-f0-9]{40}$/.test(sourceSha)) {
  console.error(JSON.stringify({ status: 'ERROR', gate: gateName, reason: 'unable to bind report to source SHA' }));
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
    process.exit(commandResult.status === 78 ? 1 : (commandResult.status ?? 1));
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
  sourceSha,
  runnerSha256,
  manifestSha256,
  expectedManifestSha256: externallyExpectedManifestSha256 ?? null,
  command: gate.command ?? null,
  commandOutputSha256: commandResult
    ? createHash('sha256').update(`${commandResult.stdout}\n${commandResult.stderr}`).digest('hex')
    : null,
};
mkdirSync(reportDirectory, { recursive: true });
const temporaryReportPath = `${reportPath}.${report.invocationId}.tmp`;
writeFileSync(temporaryReportPath, `${JSON.stringify(report, null, 2)}\n`, { mode: 0o600 });
renameSync(temporaryReportPath, reportPath);
console.log(JSON.stringify(report));
process.exit(exitCode);
