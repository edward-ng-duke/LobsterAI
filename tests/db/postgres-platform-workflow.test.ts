import { spawnSync } from 'node:child_process';
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { describe, expect, test } from 'vitest';
import { parse } from 'yaml';

interface WorkflowStep {
  id?: string;
  env?: Record<string, unknown>;
  run?: string;
  uses?: string;
  with?: Record<string, unknown>;
}

interface WorkflowJob {
  if?: string;
  needs?: string | string[];
  'runs-on'?: string;
  steps?: WorkflowStep[];
}

interface Workflow {
  on?: {
    workflow_dispatch?: {
      inputs?: Record<string, { type?: string; required?: boolean; default?: unknown }>;
    };
  };
  jobs?: Record<string, WorkflowJob>;
}

const repositoryRoot = path.resolve(import.meta.dirname, '../..');
const workflow = parse(
  readFileSync(path.join(repositoryRoot, '.github/workflows/saas-scaffold.yml'), 'utf8'),
) as Workflow;
const mainWorkflow = parse(
  readFileSync(path.join(repositoryRoot, '.github/workflows/ci.yml'), 'utf8'),
) as Workflow;

const commands = (job: WorkflowJob | undefined): string[] =>
  job?.steps?.flatMap((step) => typeof step.run === 'string' ? [step.run.trim()] : []) ?? [];

describe('PostgreSQL native arm64 CI stages', () => {
  test('runs the pre-freeze platform gate natively without trusted evidence', () => {
    const job = workflow.jobs?.['db-platform-arm64'];
    const jobCommands = commands(job);

    expect(job?.['runs-on']).toBe('ubuntu-24.04-arm');
    expect(jobCommands).toContain('npm ci');
    expect(jobCommands).toContain('node scripts/db/validate-static.mjs');
    expect(jobCommands).toContain('npm run test:db:preflight');
    expect(jobCommands).toContain('npm run test:db:integration');
    expect(jobCommands).not.toContain('npm run prisma:validate');
    expect(jobCommands.join('\n')).not.toContain('evidence-trust-launcher');
  });

  test('uploads the native arm64 reports under a source-bound artifact name', () => {
    const steps = workflow.jobs?.['db-platform-arm64']?.steps ?? [];
    const upload = steps.find((step) => step.uses === 'actions/upload-artifact@v4');

    expect(upload?.with?.name).toBe('db-platform-arm64-${{ env.SAAS_SOURCE_SHA }}');
    expect(upload?.with?.path).toContain('.reports/db/preflight.json');
    expect(upload?.with?.path).toContain('.reports/db/integration.json');
  });

  test('runs the post-freeze evidence gate after the platform artifact', () => {
    const job = workflow.jobs?.['db-evidence-arm64'];
    const jobCommands = commands(job);
    const needs = Array.isArray(job?.needs) ? job.needs : [job?.needs];

    expect(job?.['runs-on']).toBe('ubuntu-24.04-arm');
    expect(needs).toEqual(['db-platform-arm64']);
    expect(job?.if).toBe(
      "${{ github.event_name == 'workflow_dispatch' && inputs.p02_evidence_ready == true }}",
    );
    expect(jobCommands).toContain('npm ci');
    expect(jobCommands).toContain('npm run prisma:validate');
    expect(jobCommands).toContain(
      'node scripts/db/validate-platform-artifact.mjs --root .artifacts/db-platform-arm64 --source-sha "$SAAS_SOURCE_SHA" --platform linux/arm64',
    );
    expect(jobCommands).toContain(
      'npx vitest run tests/db/tester-evidence-boundary.test.ts tests/db/validator-mutations.test.ts tests/db/evidence-bootstrap.test.ts tests/db/p03-merge-evidence.test.ts --reporter=verbose',
    );
    expect(jobCommands).toContain('git diff --exit-code');
  });

  test('runs official tests in the source-derived phase in both workflows', () => {
    const scaffoldPhase = workflow.jobs?.scaffold?.steps?.find(
      (step) => step.id === 'p02-evidence-phase',
    );
    const mainPhase = mainWorkflow.jobs?.test?.steps?.find(
      (step) => step.id === 'p02-evidence-phase',
    );
    const scaffoldTest = workflow.jobs?.scaffold?.steps?.find(
      (step) => step.run?.trim() === 'npm test',
    );
    const mainTest = mainWorkflow.jobs?.test?.steps?.find(
      (step) => step.run?.trim() === 'npm test',
    );

    for (const phaseStep of [scaffoldPhase, mainPhase]) {
      expect(phaseStep?.run).toBe('node scripts/db/resolve-evidence-phase.mjs');
      expect(phaseStep?.env?.P02_EVIDENCE_READY).toBe('${{ inputs.p02_evidence_ready }}');
      expect(phaseStep?.env?.GITHUB_EVENT_NAME).toBe('${{ github.event_name }}');
      expect(phaseStep?.env?.P02_SOURCE_SHA).toBe(
        '${{ github.event.pull_request.head.sha || github.sha }}',
      );
    }
    expect(scaffoldTest?.env?.P02_EVIDENCE_PHASE).toBe(
      '${{ steps.p02-evidence-phase.outputs.phase }}',
    );
    expect(mainTest?.env?.P02_EVIDENCE_PHASE).toBe(
      '${{ steps.p02-evidence-phase.outputs.phase }}',
    );
  });

  test('checks out the exact PR head with full history before resolving evidence phase', () => {
    for (const targetWorkflow of [workflow, mainWorkflow]) {
      const checkout = targetWorkflow.jobs?.[targetWorkflow === workflow ? 'scaffold' : 'test']
        ?.steps?.find((step) => step.uses === 'actions/checkout@v4');

      expect(checkout?.with?.['fetch-depth']).toBe(0);
      expect(checkout?.with?.ref).toBe('${{ github.event.pull_request.head.sha || github.sha }}');
    }
  });

  test('keeps a valid PR head distinct from a synthetic merge first-parent topology', async () => {
    const root = mkdtempSync(path.join(tmpdir(), 'lobsterai-p02-pr-head-'));
    const headWorktree = path.join(root, 'head');
    const baseWorktree = path.join(root, 'base');
    const mergeWorktree = path.join(root, 'merge');
    const runGit = (args: string[], cwd = repositoryRoot) => spawnSync('git', args, {
      cwd,
      encoding: 'utf8',
    });
    try {
      expect(runGit(['worktree', 'add', '--detach', headWorktree, '6c7bf0b9']).status).toBe(0);
      const manifest = JSON.parse(readFileSync(path.join(
        headWorktree,
        'docs/db/20260711_P02_Prisma与RLS脚手架证据/evidence-manifest.json',
      ), 'utf8')) as { codeEvidenceSha: string };
      const common = runGit(['rev-parse', `${manifest.codeEvidenceSha}^`]).stdout.trim();
      expect(runGit(['worktree', 'add', '--detach', baseWorktree, common]).status).toBe(0);
      mkdirSync(path.join(baseWorktree, 'src'), { recursive: true });
      writeFileSync(path.join(baseWorktree, 'src/base-advance.ts'), 'export const baseAdvance = true;\n');
      expect(runGit(['add', 'src/base-advance.ts'], baseWorktree).status).toBe(0);
      const baseCommit = spawnSync('git', [
        '-c', 'core.hooksPath=/dev/null',
        '-c', 'user.name=P02 PR Test',
        '-c', 'user.email=p02-pr@example.invalid',
        'commit', '-m', 'test: advance synthetic base',
      ], { cwd: baseWorktree, encoding: 'utf8' });
      expect(baseCommit.status, baseCommit.stderr).toBe(0);
      const baseSha = runGit(['rev-parse', 'HEAD'], baseWorktree).stdout.trim();
      const headSha = runGit(['rev-parse', 'HEAD'], headWorktree).stdout.trim();
      const headTree = runGit(['rev-parse', 'HEAD^{tree}'], headWorktree).stdout.trim();
      const merge = spawnSync('git', [
        '-c', 'user.name=P02 PR Test',
        '-c', 'user.email=p02-pr@example.invalid',
        'commit-tree', headTree, '-p', baseSha, '-p', headSha,
      ], {
        cwd: repositoryRoot,
        encoding: 'utf8',
        input: 'synthetic PR merge\n',
      });
      expect(merge.status, merge.stderr).toBe(0);
      const mergeSha = merge.stdout.trim();
      expect(runGit(['worktree', 'add', '--detach', mergeWorktree, mergeSha]).status).toBe(0);

      const gates = JSON.parse(
        readFileSync(path.join(headWorktree, 'scripts/saas-stage-gates.json'), 'utf8'),
      ) as { gates: Record<string, { trustedFiles: Record<string, string> }> };
      const digest = gates.gates['prisma:validate']
        .trustedFiles['scripts/db/evidence-bootstrap.mjs'];
      const launch = (cwd: string) => spawnSync(process.execPath, [
        'scripts/db/evidence-trust-launcher.mjs',
        '--expected-bootstrap-sha256', digest,
      ], { cwd, encoding: 'utf8', env: { ...process.env, NODE_OPTIONS: '' } });
      const headResult = launch(headWorktree);
      const mergeResult = launch(mergeWorktree);
      expect(headResult.status, `${headResult.stdout}\n${headResult.stderr}`).toBe(0);
      expect(mergeResult.status).toBe(1);
      expect(mergeResult.stderr).toContain('evidence SHA is not on the first-parent history of HEAD');

      const { classifyTrustedEvidenceValidation } = await import(
        path.join(repositoryRoot, 'scripts/db/resolve-evidence-phase.mjs')
      );
      expect(classifyTrustedEvidenceValidation(headResult)).toBe(true);
      expect(() => classifyTrustedEvidenceValidation(mergeResult)).toThrow();
    } finally {
      for (const worktreePath of [mergeWorktree, baseWorktree, headWorktree]) {
        runGit(['worktree', 'remove', '--force', worktreePath]);
      }
      runGit(['worktree', 'prune']);
      rmSync(root, { recursive: true, force: true });
    }
  });

  test('does not mask phase or required-gate failures', () => {
    const sources = [
      readFileSync(path.join(repositoryRoot, '.github/workflows/saas-scaffold.yml'), 'utf8'),
      readFileSync(path.join(repositoryRoot, '.github/workflows/ci.yml'), 'utf8'),
    ].join('\n');

    expect(sources).not.toContain('continue-on-error');
    expect(sources).not.toMatch(/\|\|\s*true/);
  });

  test('exposes an explicit evidence-ready dispatch and auditable required state', () => {
    expect(workflow.on?.workflow_dispatch?.inputs?.p02_evidence_ready).toMatchObject({
      type: 'boolean',
      required: true,
      default: false,
    });
    const stateJob = workflow.jobs?.['db-evidence-arm64-required'];
    const needs = Array.isArray(stateJob?.needs) ? stateJob.needs : [stateJob?.needs];
    expect(needs).toEqual(['db-platform-arm64', 'db-evidence-arm64']);
    expect(stateJob?.if).toBe('${{ always() }}');
    expect(commands(stateJob)).toContain('node scripts/db/check-evidence-ci-state.mjs');
  });

  test('downloads only the matching source-bound arm64 artifact', () => {
    const steps = workflow.jobs?.['db-evidence-arm64']?.steps ?? [];
    const download = steps.find((step) => step.uses === 'actions/download-artifact@v4');

    expect(download?.with?.name).toBe('db-platform-arm64-${{ env.SAAS_SOURCE_SHA }}');
    expect(download?.with?.path).toBe('.artifacts/db-platform-arm64');
  });
});
