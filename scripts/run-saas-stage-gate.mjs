import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const manifest = JSON.parse(
  readFileSync(path.join(repositoryRoot, 'scripts/saas-stage-gates.json'), 'utf8'),
);
const gateName = process.argv[2];
const gate = manifest.gates?.[gateName];

if (!gateName || !gate) {
  console.error(JSON.stringify({ status: 'ERROR', gate: gateName ?? null, reason: 'unknown gate' }));
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
if (!Number.isInteger(exitCode) || exitCode === 0) {
  console.error(JSON.stringify({ status: 'ERROR', gate: gateName, reason: 'invalid stage status' }));
  process.exit(1);
}

const report = {
  schemaVersion: manifest.schemaVersion,
  gate: gateName,
  stage: manifest.currentStage,
  status: gate.status,
  activationTask: gate.activationTask,
  reason: gate.reason,
  fixturesChecked: gate.fixtures,
};
const reportDirectory = path.join(repositoryRoot, '.reports/saas-gates');
mkdirSync(reportDirectory, { recursive: true });
writeFileSync(path.join(reportDirectory, `${gateName.replaceAll(':', '-')}.json`), `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report));
process.exit(exitCode);
