import { readFileSync } from 'node:fs';
import path from 'node:path';

import { describe, expect, test } from 'vitest';
import { parse } from 'yaml';

interface WorkflowStep {
  run?: string;
  uses?: string;
  with?: Record<string, unknown>;
}

interface WorkflowJob {
  needs?: string | string[];
  'runs-on'?: string;
  steps?: WorkflowStep[];
}

interface Workflow {
  jobs?: Record<string, WorkflowJob>;
}

const repositoryRoot = path.resolve(import.meta.dirname, '../..');
const workflow = parse(
  readFileSync(path.join(repositoryRoot, '.github/workflows/saas-scaffold.yml'), 'utf8'),
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

  test('downloads only the matching source-bound arm64 artifact', () => {
    const steps = workflow.jobs?.['db-evidence-arm64']?.steps ?? [];
    const download = steps.find((step) => step.uses === 'actions/download-artifact@v4');

    expect(download?.with?.name).toBe('db-platform-arm64-${{ env.SAAS_SOURCE_SHA }}');
    expect(download?.with?.path).toBe('.artifacts/db-platform-arm64');
  });
});
