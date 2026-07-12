import { spawnSync } from 'node:child_process';
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
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

  test('requires the checked-out HEAD to equal the workflow source SHA', async () => {
    const resolverPath = path.join(repositoryRoot, 'scripts/db/resolve-evidence-phase.mjs');
    const { requireCheckedOutSource } = await import(resolverPath);
    const sourceSha = 'a'.repeat(40);

    expect(requireCheckedOutSource(sourceSha, sourceSha)).toBe(sourceSha);
    expect(() => requireCheckedOutSource(sourceSha, 'b'.repeat(40))).toThrow();
    expect(() => requireCheckedOutSource('', sourceSha)).toThrow();
  });

  test('classifies only auditable source drift as pre-freeze evidence', async () => {
    const resolverPath = path.join(repositoryRoot, 'scripts/db/resolve-evidence-phase.mjs');
    const { classifyTrustedEvidenceValidation } = await import(resolverPath);

    expect(classifyTrustedEvidenceValidation({
      status: 0, stdout: '{"status":"PASS"}', stderr: '',
    })).toBe(true);
    expect(classifyTrustedEvidenceValidation({
      status: 1,
      stdout: '',
      stderr: JSON.stringify({
        status: 'FAILED',
        errors: [
          `codeEvidenceSha: non-evidence change after source SHA: M src/file.ts (${'a'.repeat(40)})`,
          `stageEvidenceSha: non-evidence change after source SHA: M src/file.ts (${'a'.repeat(40)})`,
        ],
      }),
    })).toBe(false);
  });

  test.each([
    ['bootstrap integrity failure', 86, '', 'P02 evidence trust launcher: bootstrap integrity mismatch'],
    ['trusted file mismatch', 86, '', 'P02 evidence bootstrap: trusted file mismatch package.json'],
    ['invalid manifest', 1, '', 'SyntaxError: Unexpected token'],
    ['evidence digest corruption', 1, '{"status":"FAILED","errors":["integration.json: manifest report digest mismatch"]}', ''],
    ['missing trusted file', 86, '', 'P02 evidence bootstrap: missing trusted package.json'],
    ['provenance JSON on stdout', 1, '{"status":"FAILED","errors":["codeEvidenceSha: non-evidence change after source SHA: M src/file.ts (abc)","stageEvidenceSha: non-evidence change after source SHA: M src/file.ts (abc)"]}', ''],
    ['stderr diagnostic with noise', 1, '', 'noise\n{"status":"FAILED","errors":[]}'],
    ['multiple stderr diagnostics', 1, '', '{"status":"FAILED","errors":[]}\n{"status":"FAILED","errors":[]}'],
    ['conflicting output streams', 1, '{"status":"PASS"}', '{"status":"FAILED","errors":[]}'],
    ['successful stdout with noise', 0, 'noise\n{"status":"PASS"}', ''],
    ['successful validation with stderr', 0, '{"status":"PASS"}', '{"status":"FAILED"}'],
  ])('does not mask %s as a pre-freeze source', async (_label, status, stdout, stderr) => {
    const resolverPath = path.join(repositoryRoot, 'scripts/db/resolve-evidence-phase.mjs');
    const { classifyTrustedEvidenceValidation } = await import(resolverPath);

    expect(() => classifyTrustedEvidenceValidation({ status, stdout, stderr })).toThrow();
  });

  test('classifies the real trusted launcher stderr after a linear source drift commit', async () => {
    const root = mkdtempSync(path.join(tmpdir(), 'lobsterai-p02-phase-drift-'));
    const worktree = path.join(root, 'worktree');
    try {
      const added = spawnSync('git', ['worktree', 'add', '--detach', worktree, '6c7bf0b9'], {
        cwd: repositoryRoot,
        encoding: 'utf8',
      });
      expect(added.status, added.stderr).toBe(0);
      const gates = JSON.parse(
        readFileSync(path.join(worktree, 'scripts/saas-stage-gates.json'), 'utf8'),
      ) as {
        gates: Record<string, { trustedFiles: Record<string, string> }>;
      };
      const digest = gates.gates['prisma:validate']
        .trustedFiles['scripts/db/evidence-bootstrap.mjs'];
      const launch = () => spawnSync(
        process.execPath,
        [
          'scripts/db/evidence-trust-launcher.mjs',
          '--expected-bootstrap-sha256',
          digest,
        ],
        { cwd: worktree, encoding: 'utf8', env: { ...process.env, NODE_OPTIONS: '' } },
      );
      const valid = launch();
      expect(valid.status, `${valid.stdout}\n${valid.stderr}`).toBe(0);

      mkdirSync(path.join(worktree, 'src'), { recursive: true });
      writeFileSync(
        path.join(worktree, 'src/p02-phase-drift-probe.ts'),
        'export const p02PhaseDriftProbe = true;\n',
      );
      expect(spawnSync('git', ['add', 'src/p02-phase-drift-probe.ts'], {
        cwd: worktree, encoding: 'utf8',
      }).status).toBe(0);
      const committed = spawnSync(
        'git',
        [
          '-c', 'core.hooksPath=/dev/null',
          '-c', 'user.name=P02 Phase Test',
          '-c', 'user.email=p02-phase@example.invalid',
          'commit', '-m', 'test: add linear phase drift probe',
        ],
        { cwd: worktree, encoding: 'utf8' },
      );
      expect(committed.status, committed.stderr).toBe(0);
      const drift = launch();
      expect(drift.status).toBe(1);
      expect(drift.stdout).toBe('');
      expect(JSON.parse(drift.stderr)).toMatchObject({
        status: 'FAILED',
        errors: [
          expect.stringContaining('codeEvidenceSha: non-evidence change after source SHA'),
          expect.stringContaining('stageEvidenceSha: non-evidence change after source SHA'),
        ],
      });

      const { classifyTrustedEvidenceValidation } = await import(
        path.join(repositoryRoot, 'scripts/db/resolve-evidence-phase.mjs')
      );
      expect(classifyTrustedEvidenceValidation(drift)).toBe(false);
    } finally {
      spawnSync('git', ['worktree', 'remove', '--force', worktree], {
        cwd: repositoryRoot,
      });
      spawnSync('git', ['worktree', 'prune'], { cwd: repositoryRoot });
      rmSync(root, { recursive: true, force: true });
    }
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
