import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import {
  cpSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { afterEach, describe, expect, test } from 'vitest';

const repositoryRoot = path.resolve(import.meta.dirname, '../..');
const evidenceRelativePath = 'docs/db/20260711_P02_Prisma与RLS脚手架证据';
const taskRelativePath =
  '改造计划/20260711_V2单租户Web闭环开发/任务/P02-PR2数据库脚手架';
const temporaryRoots: string[] = [];

const sha256File = (target: string): string =>
  createHash('sha256').update(readFileSync(target)).digest('hex');

const git = (root: string, ...args: string[]): string => {
  const result = spawnSync('git', args, { cwd: root, encoding: 'utf8' });
  expect(result.status, `${result.stdout}\n${result.stderr}`).toBe(0);
  return result.stdout.trim();
};

const writeJson = (target: string, value: unknown): void => {
  mkdirSync(path.dirname(target), { recursive: true });
  writeFileSync(target, `${JSON.stringify(value, null, 2)}\n`);
};

const createEvidenceFixture = (): string => {
  const root = mkdtempSync(path.join(tmpdir(), 'lobsterai-p02-tester-evidence-'));
  temporaryRoots.push(root);
  git(root, 'init', '-b', 'main');
  git(root, 'config', 'user.name', 'P02 Independent Tester');
  git(root, 'config', 'user.email', 'p02-tester@example.invalid');

  for (const relativePath of [
    'scripts/db/common.mjs',
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
  writeFileSync(path.join(root, 'implementation.txt'), 'stable P02 implementation\n');
  git(root, 'add', '.');
  git(root, 'commit', '-m', 'feat: implementation');
  const implementationSha = git(root, 'rev-parse', 'HEAD');

  const evidenceDirectory = path.join(root, evidenceRelativePath);
  mkdirSync(evidenceDirectory, { recursive: true });
  const reportRunners = {
    'contracts-preflight.json': 'scripts/db/preflight.mjs',
    'preflight.json': 'scripts/db/preflight.mjs',
    'integration.json': 'scripts/db/run-integration.mjs',
    'validation.json': 'scripts/db/validate.mjs',
  } as const;
  for (const reportName of Object.keys(reportRunners)) {
    const report = JSON.parse(
      readFileSync(path.join(repositoryRoot, evidenceRelativePath, reportName), 'utf8'),
    ) as Record<string, unknown>;
    report.sourceSha = implementationSha;
    writeJson(path.join(evidenceDirectory, reportName), report);
  }
  const reports = Object.fromEntries(
    Object.entries(reportRunners).map(([reportName, runner]) => [
      reportName,
      {
        sourceSha: implementationSha,
        sha256: sha256File(path.join(evidenceDirectory, reportName)),
        runner,
        runnerSha256: sha256File(path.join(root, runner)),
      },
    ]),
  );
  writeJson(path.join(evidenceDirectory, 'evidence-manifest.json'), {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    codeEvidenceSha: implementationSha,
    reports,
  });
  git(root, 'add', '.');
  git(root, 'commit', '-m', 'docs: evidence');
  return root;
};

const runValidator = (root: string) =>
  spawnSync(process.execPath, ['scripts/db/validate-evidence.mjs'], {
    cwd: root,
    encoding: 'utf8',
  });

const commitFile = (root: string, relativePath: string, content: string, message: string): void => {
  const target = path.join(root, relativePath);
  mkdirSync(path.dirname(target), { recursive: true });
  writeFileSync(target, content);
  git(root, 'add', relativePath);
  git(root, 'commit', '-m', message);
};

afterEach(() => {
  temporaryRoots.splice(0).forEach((root) => rmSync(root, { recursive: true, force: true }));
});

describe('P02 independent Tester evidence and provenance boundaries', () => {
  test('fixture starts with a valid native-report evidence chain', () => {
    const root = createEvidenceFixture();
    const result = runValidator(root);
    expect(result.status, `${result.stdout}\n${result.stderr}`).toBe(0);
  });

  test('keeps Reviewer and Tester handoff records verifiable without allowing implementation code', () => {
    const root = createEvidenceFixture();
    commitFile(
      root,
      `${taskRelativePath}/审核记录.md`,
      '# Reviewer approved for independent test\n',
      'docs(db): approve review',
    );
    commitFile(
      root,
      `${taskRelativePath}/测试记录.md`,
      '# Independent Tester evidence\n',
      'docs(db): record independent test',
    );

    const handoff = runValidator(root);
    expect(handoff.status, `${handoff.stdout}\n${handoff.stderr}`).toBe(0);
  });

  test('continues to reject implementation changes outside the evidence boundary', () => {
    const root = createEvidenceFixture();
    commitFile(
      root,
      'libs/server/db/src/client.ts',
      'export const bypass = true;\n',
      'feat(db): mutate implementation',
    );
    const implementationMutation = runValidator(root);
    expect(implementationMutation.status).not.toBe(0);
    expect(implementationMutation.stderr).toContain('libs/server/db/src/client.ts');
  });

  test('does not let a parallel task documentation commit invalidate P02 evidence', () => {
    const root = createEvidenceFixture();
    commitFile(
      root,
      '改造计划/20260711_V2单租户Web闭环开发/任务/V102-单Pod真实turn/开发记录.md',
      '# Parallel task record\n',
      'docs(runtime): record parallel task',
    );
    const result = runValidator(root);
    expect(result.status, `${result.stdout}\n${result.stderr}`).toBe(0);
  });

  test('fails closed when the evidence validator tampers with its own provenance checks', () => {
    const root = createEvidenceFixture();
    commitFile(
      root,
      'scripts/db/validate-evidence.mjs',
      "console.log(JSON.stringify({ status: 'PASS', bypassed: true }));\n",
      'fix(db): bypass evidence validation',
    );
    const result = runValidator(root);
    expect(result.status).not.toBe(0);
  });

  test('rejects a coordinated raw validation report and manifest digest rewrite', () => {
    const root = createEvidenceFixture();
    const evidenceDirectory = path.join(root, evidenceRelativePath);
    const validationPath = path.join(evidenceDirectory, 'validation.json');
    const validation = JSON.parse(readFileSync(validationPath, 'utf8')) as {
      commands: Array<{ command: string[]; exitCode: number; outputSha256: string }>;
    };
    validation.commands = Array.from({ length: 8 }, () => ({
      command: ['node', '-e', 'process.exit(0)'],
      exitCode: 0,
      outputSha256: '0'.repeat(64),
    }));
    writeJson(validationPath, validation);

    const manifestPath = path.join(evidenceDirectory, 'evidence-manifest.json');
    const manifest = JSON.parse(readFileSync(manifestPath, 'utf8')) as {
      reports: Record<string, { sha256: string }>;
    };
    manifest.reports['validation.json'].sha256 = sha256File(validationPath);
    writeJson(manifestPath, manifest);
    git(root, 'add', evidenceRelativePath);
    git(root, 'commit', '-m', 'docs(db): rewrite validation evidence');

    const result = runValidator(root);
    expect(result.status).not.toBe(0);
  });
});
