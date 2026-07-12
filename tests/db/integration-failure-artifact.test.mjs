import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import {
  appendFileSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';

const repositoryRoot = path.resolve(import.meta.dirname, '../..');

const run = (command, args, options = {}) => spawnSync(command, args, {
  cwd: repositoryRoot,
  encoding: 'utf8',
  timeout: 300_000,
  ...options,
});

const runIsolatedIntegration = (mutate) => {
  const root = mkdtempSync(path.join(tmpdir(), 'lobsterai-p02-failure-artifact-'));
  const worktree = path.join(root, 'worktree');
  const isolatedTmp = path.join(root, 'tmp');
  mkdirSync(isolatedTmp);

  try {
    const added = run('git', ['worktree', 'add', '--detach', worktree, 'HEAD']);
    assert.equal(added.status, 0, added.stderr || added.stdout);
    const pendingPatch = run('git', ['diff', '--binary', 'HEAD']);
    assert.equal(pendingPatch.status, 0, pendingPatch.stderr);
    if (pendingPatch.stdout && process.env.P02_TEST_COMMITTED_ONLY !== '1') {
      const applied = spawnSync('git', ['apply', '--whitespace=nowarn', '-'], {
        cwd: worktree,
        encoding: 'utf8',
        input: pendingPatch.stdout,
      });
      assert.equal(applied.status, 0, applied.stderr || applied.stdout);
    }
    symlinkSync(path.join(repositoryRoot, 'node_modules'), path.join(worktree, 'node_modules'), 'dir');
    const generatedTarget = path.join(worktree, 'libs/server/db/generated');
    rmSync(generatedTarget, { recursive: true, force: true });
    symlinkSync(path.join(repositoryRoot, 'libs/server/db/generated'), generatedTarget, 'dir');
    mutate(worktree);

    const result = spawnSync('npm', ['run', 'test:db:integration'], {
      cwd: worktree,
      encoding: 'utf8',
      timeout: 300_000,
      env: { ...process.env, TMPDIR: isolatedTmp },
    });
    const report = JSON.parse(
      readFileSync(path.join(worktree, '.reports/db/integration.json'), 'utf8'),
    );
    const temporaryReports = readdirSync(isolatedTmp)
      .filter((entry) => entry.startsWith('lobsterai-p02-vitest-report-'));
    return { result, report, temporaryReports };
  } finally {
    run('git', ['worktree', 'remove', '--force', worktree]);
    run('git', ['worktree', 'prune']);
    rmSync(root, { recursive: true, force: true });
  }
};

test('the integration runner preserves a real Vitest failure in its final artifact', () => {
  const { result, report, temporaryReports } = runIsolatedIntegration((worktree) => {
    appendFileSync(
      path.join(worktree, 'tests/integration/db/migration-lifecycle.test.ts'),
      [
        '',
        "test('isolated failure artifact probe', () => {",
        "  expect('actual').toBe('expected');",
        '});',
        '',
      ].join('\n'),
    );
  });
  assert.equal(result.status, 1, `${result.stdout}\n${result.stderr}`);
  assert.equal(report.status, 'FAILED');
  assert.equal(report.cleanup.attempted, true);
  assert.equal(report.cleanup.removed, true);
  assert.deepEqual(report.checks.testResults, {
    passed: 27,
    failed: 1,
    skipped: 0,
    todo: 0,
    total: 28,
  }, JSON.stringify(report));
  assert.equal(report.checks.checksPassed, 27);
  assert.equal(report.checks.checksTotal, 28);
  assert.match(report.error, /Vitest|integration tests failed/);
  assert.deepEqual(temporaryReports, []);
});

test('the integration runner identifies a suite collection failure without leaking raw diagnostics', () => {
  const { result, report, temporaryReports } = runIsolatedIntegration((worktree) => {
    writeFileSync(
      path.join(worktree, 'tests/integration/db/migration-lifecycle.test.ts'),
      [
        "import './p02-intentionally-missing-SECRET_TOKEN.js';",
        "throw new Error('postgresql://p02:private@database.internal/p02');",
        '',
      ].join('\n'),
    );
  });
  assert.equal(result.status, 1, `${result.stdout}\n${result.stderr}`);
  assert.equal(report.status, 'FAILED');
  assert.equal(report.checks.provider.serverMajor, 17);
  assert.equal(report.cleanup.attempted, true);
  assert.equal(report.cleanup.removed, true);
  assert.match(report.error, /migration-lifecycle\.test\.ts/);
  assert.doesNotMatch(report.error, /SECRET_TOKEN|postgresql:\/\//);
  assert.deepEqual(temporaryReports, []);
});

test('the integration runner preserves base evidence and cleanup after JSON parse failure', () => {
  const { result, report, temporaryReports } = runIsolatedIntegration((worktree) => {
    const parser = path.join(worktree, 'scripts/db/vitest-json-evidence.mjs');
    const source = readFileSync(parser, 'utf8');
    const mutated = source.replace(
      "JSON.parse(readFileSync(reportPath, 'utf8'))",
      "JSON.parse('{malformed')",
    );
    assert.notEqual(mutated, source);
    writeFileSync(parser, mutated);
  });
  assert.equal(result.status, 1, `${result.stdout}\n${result.stderr}`);
  assert.equal(report.status, 'FAILED');
  assert.match(report.error, /cannot be parsed/);
  assert.equal(report.checks.provider.serverMajor, 17);
  assert.equal(report.checks.testResults, null);
  assert.match(report.checks.testOutputSha256, /^[a-f0-9]{64}$/);
  assert.equal(report.cleanup.removed, true);
  assert.deepEqual(temporaryReports, []);
});
