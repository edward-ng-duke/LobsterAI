export interface WorkflowStep {
  'continue-on-error'?: unknown;
  if?: string;
  run?: string;
  uses?: string;
  with?: Record<string, unknown>;
}

export interface WorkflowJob {
  'continue-on-error'?: unknown;
  if?: string;
  needs?: string | string[];
  steps?: WorkflowStep[];
}

export interface Workflow {
  on?: { pull_request?: unknown };
  jobs?: Record<string, WorkflowJob>;
}

export const validateMainCiWorkflow = (workflow: Workflow): string[] => {
  const errors: string[] = [];
  const job = workflow.jobs?.test;
  const lintJob = workflow.jobs?.lint;
  const steps = job?.steps ?? [];

  if (!job) errors.push('test job must exist');
  if (!lintJob) errors.push('lint job must exist');
  if (lintJob && Object.hasOwn(lintJob, 'if')) errors.push('lint job must be unconditional');
  if (JSON.stringify(job?.needs) !== JSON.stringify(['lint'])) {
    errors.push('test job must depend only on lint');
  }
  if (job && Object.hasOwn(job, 'if')) errors.push('test job must be unconditional');
  if (job && Object.hasOwn(job, 'continue-on-error')) {
    errors.push('test job must not continue on error');
  }

  const pullRequest = workflow.on?.pull_request;
  if (pullRequest === undefined) errors.push('pull_request trigger must exist');
  if (pullRequest && typeof pullRequest === 'object' &&
      (Object.hasOwn(pullRequest, 'paths') || Object.hasOwn(pullRequest, 'paths-ignore'))) {
    errors.push('pull_request trigger must not filter paths or paths-ignore');
  }

  const checkoutSteps = steps.filter((step) => step.uses === 'actions/checkout@v4');
  const setupNodeSteps = steps.filter((step) => step.uses === 'actions/setup-node@v4');
  const cacheSteps = steps.filter((step) => step.uses === 'actions/cache@v4');
  const installSteps = steps.filter((step) => step.run?.trim() === 'npm ci');
  const testSteps = steps.filter((step) => step.run?.trim() === 'npm test');
  const requiredSteps = [checkoutSteps, setupNodeSteps, cacheSteps, installSteps, testSteps];
  const requiredStepNames = ['checkout', 'setup-node', 'npm cache', 'npm ci', 'npm test'];
  requiredSteps.forEach((matches, index) => {
    if (matches.length !== 1) errors.push(`test job must contain exactly one ${requiredStepNames[index]} step`);
  });

  const checkout = checkoutSteps[0];
  if (checkout?.with?.['fetch-depth'] !== 0) errors.push('checkout must fetch full history');
  const setupNode = setupNodeSteps[0];
  if (setupNode?.with?.['node-version'] !== '24.x') {
    errors.push('setup-node must use the frozen Node 24.x line');
  }

  const requiredIndexes = requiredSteps.map((matches) => steps.indexOf(matches[0]));
  if (requiredIndexes.some((index) => index < 0) ||
      requiredIndexes.some((index, position) => position > 0 && index <= requiredIndexes[position - 1])) {
    errors.push('test steps must run in checkout, setup-node, cache, npm ci, npm test order');
  }

  requiredSteps.forEach((matches, index) => {
    for (const step of matches) {
      if (Object.hasOwn(step, 'if')) {
        errors.push(`${requiredStepNames[index]} step must be unconditional`);
      }
    }
  });

  const commands = steps.flatMap((step) => (typeof step.run === 'string' ? [step.run.trim()] : []));
  if (!commands.includes('npm ci')) errors.push('test job must run npm ci');
  if (!commands.includes('npm test')) errors.push('test job must run npm test');
  if (commands.indexOf('npm ci') >= commands.indexOf('npm test')) {
    errors.push('npm ci must run before npm test');
  }
  if (commands.some((command) => /(^|\s)npm install(?:\s|$)/.test(command))) {
    errors.push('test job must not run npm install');
  }
  if (commands.some((command) => command.includes('|| true'))) {
    errors.push('test job must not bypass command failures');
  }
  if (steps.some((step) => Object.hasOwn(step, 'continue-on-error'))) {
    errors.push('test job must not continue on error');
  }

  return errors;
};
