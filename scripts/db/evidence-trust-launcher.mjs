import { createHash } from 'node:crypto';
import { lstatSync, readFileSync, realpathSync } from 'node:fs';
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
const requestedRoot = path.resolve(
  rootIndex >= 0 ? forwardedArguments[rootIndex + 1] : process.cwd(),
);
let root;
try {
  root = realpathSync(requestedRoot);
  if (!lstatSync(root).isDirectory()) throw new Error('root is not a directory');
} catch {
  console.error('P02 evidence trust launcher: unable to resolve root');
  process.exit(86);
}

const bootstrapRelativePath = 'scripts/db/evidence-bootstrap.mjs';
const bootstrapPath = path.resolve(root, bootstrapRelativePath);
let bootstrapStats;
try {
  bootstrapStats = lstatSync(bootstrapPath);
} catch {
  console.error(`P02 evidence trust launcher: missing bootstrap ${bootstrapRelativePath}`);
  process.exit(86);
}
if (!bootstrapStats.isFile() || bootstrapStats.isSymbolicLink()) {
  console.error(
    `P02 evidence trust launcher: bootstrap must be a regular file ${bootstrapRelativePath}`,
  );
  process.exit(86);
}
let realBootstrapPath;
try {
  realBootstrapPath = realpathSync(bootstrapPath);
} catch {
  console.error(`P02 evidence trust launcher: unable to resolve bootstrap ${bootstrapRelativePath}`);
  process.exit(86);
}
if (realBootstrapPath !== bootstrapPath) {
  console.error(`P02 evidence trust launcher: bootstrap escapes root ${bootstrapRelativePath}`);
  process.exit(86);
}
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
