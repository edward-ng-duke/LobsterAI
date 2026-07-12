import { readFileSync } from 'node:fs';
import path from 'node:path';

import { load } from 'js-yaml';
import { describe, expect, test } from 'vitest';

import { p03EvidenceRelativeDirectory } from '../scripts/check-supply-chain.mjs';
import {
  validateMainCiWorkflow,
  validateSaasEvidenceWorkflow,
  type Workflow,
  type WorkflowStep,
} from './helpers/ci-workflow-evidence';

const repositoryRoot = path.resolve(import.meta.dirname, '..');

const parseWorkflow = (): Workflow =>
  load(readFileSync(path.join(repositoryRoot, '.github/workflows/ci.yml'), 'utf8')) as Workflow;

const parseSaasWorkflow = (): Workflow =>
  load(readFileSync(path.join(repositoryRoot, '.github/workflows/saas-scaffold.yml'), 'utf8')) as Workflow;

const saasRequirements = {
  evidenceDirectory: p03EvidenceRelativeDirectory,
  fixturePath: 'tests/helpers/supply-chain-evidence-fixture.ts',
  fixtureTemplateGlob: 'tests/fixtures/supply_chain/**',
};

const validSaasEvidenceWorkflow = (): Workflow => ({
  on: {
    push: { paths: [saasRequirements.fixturePath, saasRequirements.fixtureTemplateGlob] },
    pull_request: { paths: [saasRequirements.fixturePath, saasRequirements.fixtureTemplateGlob] },
  },
  jobs: {
    scaffold: {
      steps: [
        { uses: 'actions/checkout@v4', with: { 'fetch-depth': 0 } },
        { run: 'npm run docker:build:check' },
        { run: 'npm run supply-chain:check' },
        { run: 'npm run helm:lint' },
        {
          run: `test "$(stat -c '%a' '${p03EvidenceRelativeDirectory}/docker-build-check.json')" = 600`,
        },
        {
          name: 'Upload validated P03 supply-chain evidence',
          uses: 'actions/upload-artifact@v4',
          with: {
            name: 'p03-supply-chain-${{ github.sha }}',
            path: `${p03EvidenceRelativeDirectory}/`,
            'include-hidden-files': true,
            'if-no-files-found': 'error',
            'retention-days': 14,
          },
        },
      ],
    },
  },
});

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

  test.each([
    '${{ github.sha }}',
    '${{ github.event.pull_request.head.sha }}',
    '${{ github.event.pull_request.merge_commit_sha || github.sha }}',
  ])('rejects an official test source binding that is not PR/push compatible: %s', (sourceSha) => {
    const workflow = structuredClone(parseWorkflow());
    findCommandStep(workflow, 'npm test').env = { SAAS_SOURCE_SHA: sourceSha };

    expect(validateMainCiWorkflow(workflow)).not.toEqual([]);
  });

  test('rejects a wrong step override even when the job binding is correct', () => {
    const workflow = structuredClone(parseWorkflow());
    const testJob = workflow.jobs?.test;
    if (!testJob) throw new Error('main CI fixture is missing the test job');
    testJob.env = {
      SAAS_SOURCE_SHA: '${{ github.event.pull_request.head.sha || github.sha }}',
    };
    findCommandStep(workflow, 'npm test').env = { SAAS_SOURCE_SHA: '${{ github.sha }}' };

    expect(validateMainCiWorkflow(workflow)).not.toEqual([]);
  });

  test('accepts the exact checkout expression at job scope', () => {
    const workflow = structuredClone(parseWorkflow());
    const testJob = workflow.jobs?.test;
    if (!testJob) throw new Error('main CI fixture is missing the test job');
    testJob.env = {
      SAAS_SOURCE_SHA: '${{ github.event.pull_request.head.sha || github.sha }}',
    };

    expect(validateMainCiWorkflow(workflow)).toEqual([]);
  });
});

describe('SaaS Scaffold exact-five evidence handoff', () => {
  test('runs live gates before a fail-closed SHA-bound exact-five upload', () => {
    expect(validateSaasEvidenceWorkflow(parseSaasWorkflow(), saasRequirements)).toEqual([]);
  });

  test.each([
    ['push', saasRequirements.fixturePath],
    ['push', saasRequirements.fixtureTemplateGlob],
    ['pull_request', saasRequirements.fixturePath],
    ['pull_request', saasRequirements.fixtureTemplateGlob],
  ] as const)(
    'requires %s to cover %s',
    (triggerName, requiredPath) => {
      const workflow = validSaasEvidenceWorkflow();
      const trigger = workflow.on?.[triggerName] as { paths: string[] };
      trigger.paths = trigger.paths.filter(pathEntry => pathEntry !== requiredPath);

      expect(validateSaasEvidenceWorkflow(workflow, saasRequirements)).not.toEqual([]);
    },
  );

  test('rejects evidence upload before the mode assertion', () => {
    const workflow = validSaasEvidenceWorkflow();
    const steps = workflow.jobs?.scaffold?.steps ?? [];
    [steps[4], steps[5]] = [steps[5], steps[4]];

    expect(validateSaasEvidenceWorkflow(workflow, saasRequirements)).not.toEqual([]);
  });

  test.each([
    ['if', '${{ always() }}'],
    ['continue-on-error', false],
  ] as const)('rejects upload %s even when superficially harmless', (field, value) => {
    const workflow = validSaasEvidenceWorkflow();
    const upload = workflow.jobs?.scaffold?.steps?.at(-1);
    if (!upload) throw new Error('valid fixture is missing its upload step');
    upload[field] = value;

    expect(validateSaasEvidenceWorkflow(workflow, saasRequirements)).not.toEqual([]);
  });

  test.each([
    ['path', '.reports/supply-chain/other/'],
    ['include-hidden-files', false],
    ['if-no-files-found', 'warn'],
    ['retention-days', 13],
    ['name', 'p03-supply-chain-latest'],
  ] as const)('rejects upload option drift: %s', (field, value) => {
    const workflow = validSaasEvidenceWorkflow();
    const upload = workflow.jobs?.scaffold?.steps?.at(-1);
    if (!upload?.with) throw new Error('valid fixture is missing upload options');
    upload.with[field] = value;

    expect(validateSaasEvidenceWorkflow(workflow, saasRequirements)).not.toEqual([]);
  });

  test('uses the checker export as the single evidence directory fact', () => {
    const supplyChainChecker = readFileSync(
      path.join(repositoryRoot, 'scripts/check-supply-chain.mjs'),
      'utf8',
    );
    const dockerChecker = readFileSync(
      path.join(repositoryRoot, 'scripts/check-docker-build.mjs'),
      'utf8',
    );
    expect(p03EvidenceRelativeDirectory).toBe(
      '.reports/supply-chain/20260712_PR3部署供应链证据',
    );
    expect(supplyChainChecker.match(/export const p03EvidenceRelativeDirectory\s*=/g)).toHaveLength(1);
    expect(dockerChecker).toContain('p03EvidenceRelativeDirectory');
    expect(dockerChecker).not.toContain(p03EvidenceRelativeDirectory);
  });
});
