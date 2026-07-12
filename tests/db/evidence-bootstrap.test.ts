import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { afterEach, describe, expect, test } from 'vitest';

const repositoryRoot = path.resolve(import.meta.dirname, '../..');
const evidencePath = 'docs/db/20260711_P02_Prisma与RLS脚手架证据';
const trustedBootstrapSha256 = '3a539b57aeae01f2ad0b6fd4b6d5adab1c1cb2362cb0ca03adf7723965032c23';
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
    'scripts/db/evidence-trust-launcher.mjs',
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
      ...(bootstrapped
        ? [
            'scripts/db/evidence-trust-launcher.mjs',
            '--expected-bootstrap-sha256',
            trustedBootstrapSha256,
          ]
        : ['scripts/db/validate-evidence.mjs']),
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
  test('the official bootstrap accepts the canonical current four-report bundle', () => {
    const root = createFixture();
    const readReport = <T,>(name: string): T => JSON.parse(
      readFileSync(path.join(root, evidencePath, name), 'utf8'),
    ) as T;
    const contracts = readReport<{ cleanup: unknown }>('contracts-preflight.json');
    const preflight = readReport<{ checks: { provider: unknown }; cleanup: unknown }>(
      'preflight.json',
    );
    const integration = readReport<{
      checks: { migrations: unknown; checksPassed: number; checksTotal: number; testResults: unknown };
    }>('integration.json');

    expect(contracts.cleanup).toEqual({ attempted: false, removed: false });
    expect(preflight.checks.provider).toMatchObject({
      runnerOs: 'linux',
      runnerArch: 'x64',
      inspectedOs: 'linux',
      inspectedArch: 'amd64',
      serverMajor: 17,
    });
    expect(preflight.cleanup).toMatchObject({ attempted: true, removed: true });
    expect(integration.checks.migrations).toMatchObject({
      first: true,
      repeat: true,
      existingSchema: { completedMigrations: 2 },
    });
    expect(integration.checks).toMatchObject({
      checksPassed: 27,
      checksTotal: 27,
      testResults: { passed: 27, failed: 0, skipped: 0, todo: 0, total: 27 },
    });

    const official = run(root, true);
    expect(official.status, `${official.stdout}\n${official.stderr}`).toBe(0);
  });

  test('a bare validator is not qualified evidence', () => {
    const root = createFixture();
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
    expect(result.stderr).toContain('bootstrap integrity mismatch');
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
