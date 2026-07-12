import { readFileSync } from 'node:fs';
import path from 'node:path';

import { load } from 'js-yaml';
import { describe, expect, test } from 'vitest';

const repositoryRoot = path.resolve(import.meta.dirname, '..');

interface WorkflowStep {
  'continue-on-error'?: boolean;
  run?: string;
  uses?: string;
  with?: Record<string, unknown>;
}

interface WorkflowJob {
  if?: string;
  needs?: string | string[];
  steps?: WorkflowStep[];
}

interface Workflow {
  on?: { pull_request?: unknown };
  jobs?: Record<string, WorkflowJob>;
}

const parseWorkflow = (): Workflow =>
  load(readFileSync(path.join(repositoryRoot, '.github/workflows/ci.yml'), 'utf8')) as Workflow;

describe('main CI test evidence', () => {
  test('runs official tests independently with full Git history and a frozen install', () => {
    const workflow = parseWorkflow();
    const job = workflow.jobs?.test;
    const lintJob = workflow.jobs?.lint;
    const steps = job?.steps ?? [];

    expect(job).toBeDefined();
    expect(lintJob).toBeDefined();
    expect(lintJob).not.toHaveProperty('if');
    expect(job?.needs).toEqual(['lint']);
    expect(job).not.toHaveProperty('if');
    const pullRequest = workflow.on?.pull_request;
    expect(pullRequest).toBeDefined();
    if (pullRequest && typeof pullRequest === 'object') {
      expect(pullRequest).not.toHaveProperty('paths');
    }

    const checkout = steps.find((step) => step.uses === 'actions/checkout@v4');
    expect(checkout?.with?.['fetch-depth']).toBe(0);

    const commands = steps.flatMap((step) => (typeof step.run === 'string' ? [step.run.trim()] : []));
    expect(commands).toContain('npm ci');
    expect(commands).toContain('npm test');
    expect(commands.indexOf('npm ci')).toBeLessThan(commands.indexOf('npm test'));
    expect(commands.some((command) => /(^|\s)npm install(?:\s|$)/.test(command))).toBe(false);
    expect(commands.some((command) => command.includes('|| true'))).toBe(false);
    expect(steps.some((step) => step['continue-on-error'] === true)).toBe(false);
  });
});
