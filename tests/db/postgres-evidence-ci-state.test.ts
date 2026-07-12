import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
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
  test('derives the official phase from event input and trusted source state', async () => {
    const resolverPath = path.join(repositoryRoot, 'scripts/db/resolve-evidence-phase.mjs');
    expect(existsSync(resolverPath)).toBe(true);
    if (!existsSync(resolverPath)) return;
    const { resolveEvidencePhase } = await import(resolverPath);

    expect(resolveEvidencePhase({
      eventName: 'pull_request', evidenceReady: '', trustedEvidenceValid: false,
    })).toBe('pre-freeze');
    expect(resolveEvidencePhase({
      eventName: 'push', evidenceReady: '', trustedEvidenceValid: true,
    })).toBe('post-freeze');
    expect(resolveEvidencePhase({
      eventName: 'workflow_dispatch', evidenceReady: 'false', trustedEvidenceValid: false,
    })).toBe('pre-freeze');
    expect(resolveEvidencePhase({
      eventName: 'workflow_dispatch', evidenceReady: 'true', trustedEvidenceValid: true,
    })).toBe('post-freeze');
  });

  test.each([
    ['stale evidence presented as post-freeze', 'workflow_dispatch', 'true', false],
    ['valid evidence held in pre-freeze', 'workflow_dispatch', 'false', true],
    ['a dispatch input on push', 'push', 'false', false],
    ['an invalid dispatch input', 'workflow_dispatch', 'invalid', false],
  ])('rejects %s', async (_label, eventName, evidenceReady, trustedEvidenceValid) => {
    const resolverPath = path.join(repositoryRoot, 'scripts/db/resolve-evidence-phase.mjs');
    expect(existsSync(resolverPath)).toBe(true);
    if (!existsSync(resolverPath)) return;
    const { resolveEvidencePhase } = await import(resolverPath);

    expect(() => resolveEvidencePhase({
      eventName, evidenceReady, trustedEvidenceValid,
    })).toThrow();
  });

  test('binds CLI source state to the trusted launcher without an override', () => {
    const resolverPath = path.join(repositoryRoot, 'scripts/db/resolve-evidence-phase.mjs');
    expect(existsSync(resolverPath)).toBe(true);
    if (!existsSync(resolverPath)) return;
    const source = readFileSync(resolverPath, 'utf8');

    expect(source).toContain('evidence-trust-launcher.mjs');
    expect(source).toContain('scripts/saas-stage-gates.json');
    expect(source).not.toMatch(/continue-on-error|\|\|\s*true|TRUSTED_EVIDENCE_STATUS/);
  });

  test('classifies only auditable source drift as pre-freeze evidence', async () => {
    const resolverPath = path.join(repositoryRoot, 'scripts/db/resolve-evidence-phase.mjs');
    const { classifyTrustedEvidenceValidation } = await import(resolverPath);

    expect(classifyTrustedEvidenceValidation({
      status: 0, stdout: '{"status":"PASS"}', stderr: '',
    })).toBe(true);
    expect(classifyTrustedEvidenceValidation({
      status: 86,
      stdout: '',
      stderr: 'P02 evidence bootstrap: trusted file mismatch package.json\n',
    })).toBe(false);
    expect(classifyTrustedEvidenceValidation({
      status: 1,
      stdout: JSON.stringify({
        status: 'FAILED',
        errors: ['codeEvidenceSha: non-evidence change after source SHA: M src/file.ts (abc)'],
      }),
      stderr: '',
    })).toBe(false);
  });

  test.each([
    ['bootstrap integrity failure', 86, '', 'P02 evidence trust launcher: bootstrap integrity mismatch'],
    ['invalid manifest', 1, '', 'SyntaxError: Unexpected token'],
    ['evidence digest corruption', 1, '{"status":"FAILED","errors":["integration.json: manifest report digest mismatch"]}', ''],
    ['missing trusted file', 86, '', 'P02 evidence bootstrap: missing trusted package.json'],
  ])('does not mask %s as a pre-freeze source', async (_label, status, stdout, stderr) => {
    const resolverPath = path.join(repositoryRoot, 'scripts/db/resolve-evidence-phase.mjs');
    const { classifyTrustedEvidenceValidation } = await import(resolverPath);

    expect(() => classifyTrustedEvidenceValidation({ status, stdout, stderr })).toThrow();
  });

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
