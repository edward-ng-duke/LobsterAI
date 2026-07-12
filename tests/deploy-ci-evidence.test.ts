import { readFileSync } from 'node:fs';
import path from 'node:path';

import { load } from 'js-yaml';
import { describe, expect, test } from 'vitest';

import {
  validateMainCiWorkflow,
  type Workflow,
  type WorkflowStep,
} from './helpers/ci-workflow-evidence';

const repositoryRoot = path.resolve(import.meta.dirname, '..');

const parseWorkflow = (): Workflow =>
  load(readFileSync(path.join(repositoryRoot, '.github/workflows/ci.yml'), 'utf8')) as Workflow;

const findCommandStep = (workflow: Workflow, command: string): WorkflowStep => {
  const matches = (workflow.jobs?.test?.steps ?? []).filter((step) => step.run?.trim() === command);
  expect(matches).toHaveLength(1);
  return matches[0];
};

describe('main CI test evidence', () => {
  test('runs official tests independently with full Git history and a frozen install', () => {
    const workflow = parseWorkflow();
    expect(validateMainCiWorkflow(workflow)).toEqual([]);
  });

  test.each(['npm ci', 'npm test'])('rejects a step-level if on %s', (command) => {
    const workflow = structuredClone(parseWorkflow());
    findCommandStep(workflow, command).if = '${{ false }}';

    expect(validateMainCiWorkflow(workflow)).not.toEqual([]);
  });

  test.each(['npm ci', 'npm test'])('rejects continue-on-error on %s even when false', (command) => {
    const workflow = structuredClone(parseWorkflow());
    findCommandStep(workflow, command)['continue-on-error'] = false;

    expect(validateMainCiWorkflow(workflow)).not.toEqual([]);
  });

  test('rejects reordering setup-node before checkout', () => {
    const workflow = structuredClone(parseWorkflow());
    const steps = workflow.jobs?.test?.steps ?? [];
    [steps[0], steps[1]] = [steps[1], steps[0]];

    expect(validateMainCiWorkflow(workflow)).not.toEqual([]);
  });

  test('rejects duplicate npm test steps', () => {
    const workflow = structuredClone(parseWorkflow());
    workflow.jobs?.test?.steps?.push({ run: 'npm test' });

    expect(validateMainCiWorkflow(workflow)).not.toEqual([]);
  });
});
