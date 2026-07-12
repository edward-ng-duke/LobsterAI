import { spawnSync } from 'node:child_process';
import path from 'node:path';

import { describe, expect, test } from 'vitest';

const repositoryRoot = path.resolve(import.meta.dirname, '../..');

const runEvidenceTests = (phase: string) => spawnSync(
  'npx',
  [
    'vitest',
    'run',
    'tests/db/p03-merge-evidence.test.ts',
    'tests/db/reviewer-round2-red.test.ts',
    '--reporter=dot',
  ],
  {
    cwd: repositoryRoot,
    encoding: 'utf8',
    env: { ...process.env, P02_EVIDENCE_PHASE: phase },
  },
);

const runRequiredState = (values: Record<string, string>) => spawnSync(
  process.execPath,
  ['scripts/db/check-evidence-ci-state.mjs'],
  {
    cwd: repositoryRoot,
    encoding: 'utf8',
    env: { ...process.env, ...values },
  },
);

describe('P02 pre-freeze and post-freeze CI state', () => {
  test('treats stale trusted evidence as the expected pre-freeze state', () => {
    const result = runEvidenceTests('pre-freeze');

    expect(result.status, `${result.stdout}\n${result.stderr}`).toBe(0);
  });

  test('continues to require valid trusted evidence in post-freeze state', () => {
    expect(runEvidenceTests('post-freeze').status).not.toBe(0);
  });

  test('marks the pre-freeze required state ready after the platform job', () => {
    const result = runRequiredState({
      P02_EVIDENCE_READY: 'false',
      P02_PLATFORM_RESULT: 'success',
      P02_EVIDENCE_RESULT: 'skipped',
    });

    expect(result.status, result.stderr).toBe(0);
    expect(result.stdout).toContain('WAITING_POST_FREEZE');
  });

  test('requires successful evidence when the explicit freeze input is ready', () => {
    const success = runRequiredState({
      P02_EVIDENCE_READY: 'true',
      P02_PLATFORM_RESULT: 'success',
      P02_EVIDENCE_RESULT: 'success',
    });
    expect(success.status, success.stderr).toBe(0);
    expect(success.stdout).toContain('POST_FREEZE_PASSED');

    for (const evidenceResult of ['skipped', 'failure']) {
      expect(runRequiredState({
        P02_EVIDENCE_READY: 'true',
        P02_PLATFORM_RESULT: 'success',
        P02_EVIDENCE_RESULT: evidenceResult,
      }).status).toBe(1);
    }
  });
});
