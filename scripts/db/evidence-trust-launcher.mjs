import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const expectedIndex = process.argv.indexOf('--expected-bootstrap-sha256');
const expectedBootstrapSha256 = expectedIndex >= 0 ? process.argv[expectedIndex + 1] : undefined;
if (!/^[a-f0-9]{64}$/.test(expectedBootstrapSha256 ?? '')) {
  console.error('P02 evidence trust launcher: external bootstrap digest is required');
  process.exit(86);
}

const forwardedArguments = process.argv.slice(2);
forwardedArguments.splice(expectedIndex, 2);
const rootIndex = forwardedArguments.indexOf('--root');
const root = path.resolve(rootIndex >= 0 ? forwardedArguments[rootIndex + 1] : process.cwd());
const bootstrapPath = path.join(root, 'scripts/db/evidence-bootstrap.mjs');
const bootstrapSha256 = createHash('sha256').update(readFileSync(bootstrapPath)).digest('hex');
if (bootstrapSha256 !== expectedBootstrapSha256) {
  console.error('P02 evidence trust launcher: bootstrap integrity mismatch');
  process.exit(86);
}

const result = spawnSync(
  process.execPath,
  [
    '--import',
    bootstrapPath,
    path.join(root, 'scripts/db/validate-evidence.mjs'),
    ...forwardedArguments,
  ],
  { cwd: root, stdio: 'inherit', env: { ...process.env, NODE_OPTIONS: '' } },
);
process.exit(result.status ?? 1);
