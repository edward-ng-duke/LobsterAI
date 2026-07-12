import { spawnSync } from 'node:child_process';
import {
  chmodSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { load } from 'js-yaml';
import { afterEach, describe, expect, test } from 'vitest';

import {
  validateMainCiWorkflow,
  type Workflow,
  type WorkflowJob,
  type WorkflowStep,
} from './helpers/ci-workflow-evidence';

const repositoryRoot = path.resolve(import.meta.dirname, '..');
const temporaryRoots: string[] = [];
const expectedBootstrapCalls = [
  'npm:rebuild better-sqlite3',
  'tsc:-b tsconfig.workspace.json --clean',
  'tsc:-b tsconfig.workspace.json --pretty false',
  'node:scripts/contracts/generate.mjs --check',
  'vitest:run',
];

const readRootPackage = (): { scripts?: Record<string, string> } =>
  JSON.parse(readFileSync(path.join(repositoryRoot, 'package.json'), 'utf8')) as {
    scripts?: Record<string, string>;
  };

const parseWorkflow = (): Workflow =>
  load(readFileSync(path.join(repositoryRoot, '.github/workflows/ci.yml'), 'utf8')) as Workflow;

const findStep = (workflow: Workflow, predicate: (step: WorkflowStep) => boolean): WorkflowStep => {
  const matches = (workflow.jobs?.test?.steps ?? []).filter(predicate);
  expect(matches).toHaveLength(1);
  return matches[0];
};

const criticalSteps = [
  ['checkout', (step: WorkflowStep) => step.uses === 'actions/checkout@v4'],
  ['setup-node', (step: WorkflowStep) => step.uses === 'actions/setup-node@v4'],
  ['npm cache', (step: WorkflowStep) => step.uses === 'actions/cache@v4'],
  ['npm ci', (step: WorkflowStep) => step.run?.trim() === 'npm ci'],
  ['npm test', (step: WorkflowStep) => step.run?.trim() === 'npm test'],
] as const;

const createCommandHarness = (): { bin: string; trace: string } => {
  const root = mkdtempSync(path.join(tmpdir(), 'lobsterai-b00-3c-bootstrap-'));
  temporaryRoots.push(root);
  const trace = path.join(root, 'trace.log');
  const executable = `#!/bin/sh
name="\${0##*/}"
call="$name:$*"
printf '%s\\n' "$call" >> "$TRACE_FILE"
if [ "$call" = "$FAIL_CALL" ]; then
  exit 23
fi
exit 0
`;
  for (const command of ['npm', 'tsc', 'node', 'vitest']) {
    const commandPath = path.join(root, command);
    writeFileSync(commandPath, executable);
    chmodSync(commandPath, 0o755);
  }
  return { bin: root, trace };
};

const runBootstrap = (failCall = ''): { calls: string[]; status: number | null } => {
  const harness = createCommandHarness();
  const pretest = readRootPackage().scripts?.pretest ?? '';
  const result = spawnSync('/bin/sh', ['-c', `${pretest} && vitest run`], {
    cwd: repositoryRoot,
    encoding: 'utf8',
    env: {
      ...process.env,
      FAIL_CALL: failCall,
      PATH: harness.bin,
      TRACE_FILE: harness.trace,
    },
  });
  const calls = readFileSync(harness.trace, 'utf8').trim().split('\n').filter(Boolean);
  return { calls, status: result.status };
};

afterEach(() => {
  temporaryRoots.splice(0).forEach((root) => rmSync(root, { recursive: true, force: true }));
});

describe('B00-3C independent bootstrap execution', () => {
  test('executes the frozen bootstrap in order and invokes the generator only in check mode', () => {
    const result = runBootstrap();

    expect(result.status).toBe(0);
    expect(result.calls).toEqual(expectedBootstrapCalls);
  });

  test.each(expectedBootstrapCalls.slice(0, -1))(
    'fails fast at %s without starting any later build, check, or Vitest command',
    (failedCall) => {
      const result = runBootstrap(failedCall);
      const failedIndex = expectedBootstrapCalls.indexOf(failedCall);

      expect(result.status).toBe(23);
      expect(result.calls).toEqual(expectedBootstrapCalls.slice(0, failedIndex + 1));
      expect(result.calls).not.toContain('vitest:run');
    },
  );

  test('runs under the frozen Linux x64 and Node 24 gate semantics', () => {
    expect(process.platform).toBe('linux');
    expect(process.arch).toBe('x64');
    expect(process.version).toMatch(/^v24\./);
  });
});

describe('B00-3C independent main CI mutations', () => {
  test('accepts the checked-in workflow before applying mutations', () => {
    expect(validateMainCiWorkflow(parseWorkflow())).toEqual([]);
  });

  test.each(criticalSteps)('rejects a step-level if on the unique %s step', (_name, predicate) => {
    const workflow = structuredClone(parseWorkflow());
    findStep(workflow, predicate).if = '${{ false }}';

    expect(validateMainCiWorkflow(workflow)).not.toEqual([]);
  });

  test.each(criticalSteps)(
    'rejects continue-on-error on the unique %s step even when it is false',
    (_name, predicate) => {
      const workflow = structuredClone(parseWorkflow());
      findStep(workflow, predicate)['continue-on-error'] = false;

      expect(validateMainCiWorkflow(workflow)).not.toEqual([]);
    },
  );

  test.each(criticalSteps)('rejects a duplicate %s step', (_name, predicate) => {
    const workflow = structuredClone(parseWorkflow());
    const step = findStep(workflow, predicate);
    workflow.jobs?.test?.steps?.push(structuredClone(step));

    expect(validateMainCiWorkflow(workflow)).not.toEqual([]);
  });

  test('rejects job-level continue-on-error on the official test job', () => {
    const workflow = structuredClone(parseWorkflow());
    const testJob = workflow.jobs?.test as WorkflowJob & { 'continue-on-error'?: boolean };
    testJob['continue-on-error'] = true;

    expect(validateMainCiWorkflow(workflow)).not.toEqual([]);
  });

  test.each([[], ['lint', 'changed-files'], ['build-main'], 'build-main'])(
    'rejects a test dependency set other than only lint: %j',
    (needs) => {
      const workflow = structuredClone(parseWorkflow());
      if (workflow.jobs?.test) workflow.jobs.test.needs = needs;

      expect(validateMainCiWorkflow(workflow)).not.toEqual([]);
    },
  );

  test.each(['paths', 'paths-ignore'])('rejects pull_request %s filters', (filter) => {
    const workflow = structuredClone(parseWorkflow());
    workflow.on = { pull_request: { [filter]: ['scripts/**'] } };

    expect(validateMainCiWorkflow(workflow)).not.toEqual([]);
  });

  test('rejects a setup-node version outside the frozen Node 24 line', () => {
    const workflow = structuredClone(parseWorkflow());
    findStep(workflow, (step) => step.uses === 'actions/setup-node@v4').with = {
      'node-version': '22.x',
    };

    expect(validateMainCiWorkflow(workflow)).not.toEqual([]);
  });
});
