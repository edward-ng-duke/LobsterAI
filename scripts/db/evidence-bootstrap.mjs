import { createHash } from 'node:crypto';
import { lstatSync, readFileSync, realpathSync } from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

export const evidenceRequiredProtectedFiles = Object.freeze([
  'scripts/db/validate-evidence.mjs',
  'scripts/db/evidence-provenance.mjs',
  'scripts/db/evidence-bundle.schema.json',
  'scripts/db/existing-schema-evidence.mjs',
  'scripts/db/postgres-image-policy.mjs',
  'scripts/json-without-duplicate-keys.mjs',
  'prisma/migrations/20260711000000_init_prisma_rls_scaffold/migration.sql',
  'tests/integration/db/postgres-image.json',
]);
export const evidenceOptionalProtectedFiles = Object.freeze([
  'package.json',
  'scripts/db/evidence-trust-launcher.mjs',
  'scripts/run-saas-stage-gate.mjs',
  'scripts/saas-stage-gates.json',
]);
export const evidenceAuditableProtectedFiles = Object.freeze([
  ...evidenceRequiredProtectedFiles,
  ...evidenceOptionalProtectedFiles,
  'scripts/db/evidence-bootstrap.mjs',
]);

const failBootstrap = (message) => {
  console.error(`P02 evidence bootstrap: ${message}`);
  process.exit(86);
};

const inspectTrustedFile = (root, relativePath, optional = false) => {
  const trustedPath = path.resolve(root, relativePath);
  const relativeToRoot = path.relative(root, trustedPath);
  if (relativeToRoot.startsWith('..') || path.isAbsolute(relativeToRoot)) {
    failBootstrap(`trusted file escapes root ${relativePath}`);
  }

  let stats;
  try {
    stats = lstatSync(trustedPath);
  } catch (error) {
    if (error?.code === 'ENOENT') {
      if (optional) return false;
      failBootstrap(`missing trusted ${relativePath}`);
    }
    failBootstrap(`unable to inspect trusted file ${relativePath}`);
  }
  if (!stats.isFile() || stats.isSymbolicLink()) {
    failBootstrap(`trusted file must be a regular file ${relativePath}`);
  }

  let realTrustedPath;
  try {
    realTrustedPath = realpathSync(trustedPath);
  } catch {
    failBootstrap(`unable to resolve trusted file ${relativePath}`);
  }
  if (realTrustedPath !== trustedPath) {
    failBootstrap(`trusted file escapes root ${relativePath}`);
  }
  return true;
};

const resolveRealDirectory = (requestedPath, label) => {
  try {
    const realPath = realpathSync(path.resolve(requestedPath));
    if (!lstatSync(realPath).isDirectory()) failBootstrap(`${label} must be a directory`);
    return realPath;
  } catch {
    failBootstrap(`unable to resolve ${label}`);
  }
};

const target = path.resolve(process.argv[1] ?? '');
if (target.endsWith(path.join('scripts', 'db', 'validate-evidence.mjs'))) {
  const argument = (name) => {
    const index = process.argv.indexOf(name);
    return index >= 0 ? process.argv[index + 1] : undefined;
  };
  const root = resolveRealDirectory(argument('--root') ?? process.cwd(), 'root');
  const gitRoot = resolveRealDirectory(argument('--git-root') ?? root, 'git root');
  const protectedFiles = [...evidenceRequiredProtectedFiles];
  for (const relativePath of evidenceOptionalProtectedFiles) {
    if (inspectTrustedFile(root, relativePath, true)) protectedFiles.push(relativePath);
  }
  const bootstrapRelativePath = path.relative(root, fileURLToPath(import.meta.url));
  if (!bootstrapRelativePath.startsWith('..') && !path.isAbsolute(bootstrapRelativePath)) {
    protectedFiles.push(bootstrapRelativePath);
  }
  for (const relativePath of protectedFiles) inspectTrustedFile(root, relativePath);

  const manifestPath = path.join(
    root,
    'docs/db/20260711_P02_Prisma与RLS脚手架证据/evidence-manifest.json',
  );
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
  const sourceSha = manifest.codeEvidenceSha;
  if (!/^[a-f0-9]{40}$/.test(sourceSha)) {
    console.error('P02 evidence bootstrap: invalid codeEvidenceSha');
    process.exit(86);
  }

  for (const relativePath of protectedFiles) {
    const historical = spawnSync(
      'git',
      ['show', `${sourceSha}:${relativePath}`],
      { cwd: gitRoot },
    );
    if (historical.status !== 0) {
      if (relativePath === bootstrapRelativePath) continue;
      console.error(`P02 evidence bootstrap: missing trusted ${relativePath}`);
      process.exit(86);
    }
    const current = readFileSync(path.join(root, relativePath));
    const historicalHash = createHash('sha256').update(historical.stdout).digest('hex');
    const currentHash = createHash('sha256').update(current).digest('hex');
    if (currentHash !== historicalHash) {
      console.error(`P02 evidence bootstrap: trusted file mismatch ${relativePath}`);
      process.exit(86);
    }
  }
  process.env.P02_EVIDENCE_BOOTSTRAPPED = sourceSha;
}
