import { readFileSync } from 'node:fs';
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
    }
    expect(scaffoldTest?.env?.P02_EVIDENCE_PHASE).toBe(
      '${{ steps.p02-evidence-phase.outputs.phase }}',
    );
    expect(mainTest?.env?.P02_EVIDENCE_PHASE).toBe(
      '${{ steps.p02-evidence-phase.outputs.phase }}',
    );
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
