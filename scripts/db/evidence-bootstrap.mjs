import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const target = path.resolve(process.argv[1] ?? '');
if (target.endsWith(path.join('scripts', 'db', 'validate-evidence.mjs'))) {
  const argument = (name) => {
    const index = process.argv.indexOf(name);
    return index >= 0 ? process.argv[index + 1] : undefined;
  };
  const root = path.resolve(argument('--root') ?? process.cwd());
  const gitRoot = path.resolve(argument('--git-root') ?? root);
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

  const protectedFiles = [
    'scripts/db/validate-evidence.mjs',
    'scripts/db/evidence-provenance.mjs',
    'scripts/db/evidence-bundle.schema.json',
  ];
  for (const relativePath of [
    'package.json',
    'scripts/db/evidence-trust-launcher.mjs',
    'scripts/run-saas-stage-gate.mjs',
    'scripts/saas-stage-gates.json',
  ]) {
    if (existsSync(path.join(root, relativePath))) protectedFiles.push(relativePath);
  }
  const bootstrapRelativePath = path.relative(root, fileURLToPath(import.meta.url));
  if (!bootstrapRelativePath.startsWith('..')) protectedFiles.push(bootstrapRelativePath);
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
