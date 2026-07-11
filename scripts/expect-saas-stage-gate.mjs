import { readFileSync } from 'node:fs';
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

if (
  result.status !== expectedExitCode ||
  report?.gate !== gateName ||
  report?.stage !== manifest.currentStage ||
  report?.status !== expectedGate.status
) {
  console.error(`[P00 Gate] ${gateName} did not report the declared stage status`);
  console.error(result.stdout);
  console.error(result.stderr);
  process.exit(1);
}

console.log(`[P00 Gate] ${gateName}: verified ${expectedGate.status} (exit ${expectedExitCode})`);
