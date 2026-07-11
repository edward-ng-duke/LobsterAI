import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { afterEach, describe, expect, test } from 'vitest';

const repositoryRoot = path.resolve(import.meta.dirname, '../..');
const evidencePath = 'docs/db/20260711_P02_Prisma与RLS脚手架证据';
const temporaryRoots: string[] = [];
const sha256File = (target: string) =>
  createHash('sha256').update(readFileSync(target)).digest('hex');

const git = (root: string, ...args: string[]): string => {
  const result = spawnSync('git', args, { cwd: root, encoding: 'utf8' });
  expect(result.status, `${result.stdout}\n${result.stderr}`).toBe(0);
  return result.stdout.trim();
};

const createFixture = (): string => {
  const root = mkdtempSync(path.join(tmpdir(), 'lobsterai-p02-bootstrap-'));
  temporaryRoots.push(root);
  git(root, 'init', '-b', 'main');
  git(root, 'config', 'user.name', 'P02 Bootstrap Test');
  git(root, 'config', 'user.email', 'p02-bootstrap@example.invalid');
  for (const relativePath of [
    'scripts/db/common.mjs',
    'scripts/db/evidence-bootstrap.mjs',
    'scripts/db/evidence-bundle.schema.json',
    'scripts/db/evidence-provenance.mjs',
    'scripts/db/preflight.mjs',
    'scripts/db/run-integration.mjs',
    'scripts/db/validate-evidence.mjs',
    'scripts/db/validate.mjs',
  ]) {
    const target = path.join(root, relativePath);
    mkdirSync(path.dirname(target), { recursive: true });
    cpSync(path.join(repositoryRoot, relativePath), target);
  }
  git(root, 'add', '.');
  git(root, 'commit', '-m', 'feat: trusted implementation');
  const sourceSha = git(root, 'rev-parse', 'HEAD');

  const evidenceDirectory = path.join(root, evidencePath);
  mkdirSync(evidenceDirectory, { recursive: true });
  const runners = {
    'contracts-preflight.json': 'scripts/db/preflight.mjs',
    'preflight.json': 'scripts/db/preflight.mjs',
    'integration.json': 'scripts/db/run-integration.mjs',
    'validation.json': 'scripts/db/validate.mjs',
  } as const;
  for (const reportName of Object.keys(runners)) {
    const report = JSON.parse(
      readFileSync(path.join(repositoryRoot, evidencePath, reportName), 'utf8'),
    ) as Record<string, unknown>;
    report.sourceSha = sourceSha;
    writeFileSync(
      path.join(evidenceDirectory, reportName),
      `${JSON.stringify(report, null, 2)}\n`,
    );
  }
  const reports = Object.fromEntries(
    Object.entries(runners).map(([reportName, runner]) => [
      reportName,
      {
        sourceSha,
        sha256: sha256File(path.join(evidenceDirectory, reportName)),
        runner,
        runnerSha256: sha256File(path.join(root, runner)),
      },
    ]),
  );
  writeFileSync(
    path.join(evidenceDirectory, 'evidence-manifest.json'),
    `${JSON.stringify({
      schemaVersion: 1,
      generatedAt: new Date().toISOString(),
      codeEvidenceSha: sourceSha,
      reports,
    }, null, 2)}\n`,
  );
  git(root, 'add', '.');
  git(root, 'commit', '-m', 'docs: native evidence');
  return root;
};

const run = (root: string, bootstrapped: boolean) =>
  spawnSync(
    process.execPath,
    [
      ...(bootstrapped ? ['--import', './scripts/db/evidence-bootstrap.mjs'] : []),
      'scripts/db/validate-evidence.mjs',
    ],
    {
      cwd: root,
      encoding: 'utf8',
      env: { ...process.env, NODE_OPTIONS: '' },
    },
  );

afterEach(() => {
  temporaryRoots.splice(0).forEach((root) => rmSync(root, { recursive: true, force: true }));
});

describe('P02 external evidence bootstrap boundary', () => {
  test('the official bootstrap entry passes while a bare validator is not qualified evidence', () => {
    const root = createFixture();
    const official = run(root, true);
    expect(official.status, `${official.stdout}\n${official.stderr}`).toBe(0);
    const bare = run(root, false);
    expect(bare.status).not.toBe(0);
    expect(bare.stderr).toContain('trusted bootstrap');
  });

  test('replacing the bootstrap cannot turn the unchanged validator into PASS', () => {
    const root = createFixture();
    writeFileSync(path.join(root, 'scripts/db/evidence-bootstrap.mjs'), '// bypass attempt\n');
    git(root, 'add', '.');
    git(root, 'commit', '-m', 'fix(db): bypass bootstrap');
    const result = run(root, true);
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('trusted bootstrap');
  });

  test('coordinated bootstrap and validator replacement cannot make the official entry pass', () => {
    const root = createFixture();
    writeFileSync(path.join(root, 'scripts/db/evidence-bootstrap.mjs'), '// bypass attempt\n');
    writeFileSync(
      path.join(root, 'scripts/db/validate-evidence.mjs'),
      "console.log(JSON.stringify({ status: 'PASS', coordinatedBypass: true }));\n",
    );
    git(root, 'add', '.');
    git(root, 'commit', '-m', 'fix(db): coordinated evidence bypass');
    const result = run(root, true);
    expect(result.status).not.toBe(0);
  });
});
