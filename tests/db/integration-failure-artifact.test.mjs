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

test('the integration runner preserves a real Vitest failure in its final artifact', () => {
  const root = mkdtempSync(path.join(tmpdir(), 'lobsterai-p02-failure-artifact-'));
  const worktree = path.join(root, 'worktree');
  const isolatedTmp = path.join(root, 'tmp');
  mkdirSync(isolatedTmp);

  try {
    const added = run('git', ['worktree', 'add', '--detach', worktree, 'HEAD']);
    assert.equal(added.status, 0, added.stderr || added.stdout);
    symlinkSync(path.join(repositoryRoot, 'node_modules'), path.join(worktree, 'node_modules'), 'dir');
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

    const result = spawnSync('npm', ['run', 'test:db:integration'], {
      cwd: worktree,
      encoding: 'utf8',
      timeout: 300_000,
      env: { ...process.env, TMPDIR: isolatedTmp },
    });
    assert.equal(result.status, 1, `${result.stdout}\n${result.stderr}`);

    const report = JSON.parse(
      readFileSync(path.join(worktree, '.reports/db/integration.json'), 'utf8'),
    );
    assert.equal(report.status, 'FAILED');
    assert.equal(report.cleanup.attempted, true);
    assert.equal(report.cleanup.removed, true);
    assert.deepEqual(report.checks.testResults, {
      passed: 27,
      failed: 1,
      skipped: 0,
      todo: 0,
      total: 28,
    });
    assert.equal(report.checks.checksPassed, 27);
    assert.equal(report.checks.checksTotal, 28);
    assert.match(report.error, /Vitest|integration tests failed/);
    assert.deepEqual(
      readdirSync(isolatedTmp).filter((entry) => entry.startsWith('lobsterai-p02-vitest-report-')),
      [],
    );
  } finally {
    run('git', ['worktree', 'remove', '--force', worktree]);
    run('git', ['worktree', 'prune']);
    rmSync(root, { recursive: true, force: true });
  }
});
