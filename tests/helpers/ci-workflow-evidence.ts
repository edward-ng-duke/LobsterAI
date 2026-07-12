export interface WorkflowStep {
  'continue-on-error'?: unknown;
  if?: string;
  name?: string;
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

export interface WorkflowTrigger {
  paths?: unknown;
}

export interface Workflow {
  on?: {
    pull_request?: unknown;
    push?: unknown;
  };
  jobs?: Record<string, WorkflowJob>;
}

export interface SaasEvidenceWorkflowRequirements {
  evidenceDirectory: string;
  fixturePath: string;
  fixtureTemplateGlob: string;
}

const asTrigger = (trigger: unknown): WorkflowTrigger | undefined =>
  trigger && typeof trigger === 'object' ? trigger as WorkflowTrigger : undefined;

const exactRunSteps = (steps: WorkflowStep[], command: string) =>
  steps.filter(step => step.run?.trim() === command);

export const validateSaasEvidenceWorkflow = (
  workflow: Workflow,
  requirements: SaasEvidenceWorkflowRequirements,
): string[] => {
  const errors: string[] = [];
  const requiredTriggerPaths = [requirements.fixturePath, requirements.fixtureTemplateGlob];

  for (const triggerName of ['push', 'pull_request'] as const) {
    const trigger = asTrigger(workflow.on?.[triggerName]);
    const paths = trigger?.paths;
    if (!Array.isArray(paths) || !paths.every(path => typeof path === 'string')) {
      errors.push(`${triggerName} trigger must declare string paths`);
      continue;
    }
    for (const requiredPath of requiredTriggerPaths) {
      if (!paths.includes(requiredPath)) {
        errors.push(`${triggerName} paths must include ${requiredPath}`);
      }
    }
  }

  const scaffold = workflow.jobs?.scaffold;
  if (!scaffold) errors.push('scaffold job must exist');
  const steps = scaffold?.steps ?? [];
  const checkoutSteps = steps.filter(step => step.uses === 'actions/checkout@v4');
  if (checkoutSteps.length !== 1) errors.push('scaffold must contain exactly one checkout step');
  if (checkoutSteps[0]?.with?.['fetch-depth'] !== 0) {
    errors.push('scaffold checkout must fetch full history');
  }

  const dockerCommand = 'npm run docker:build:check';
  const supplyChainCommand = 'npm run supply-chain:check';
  const helmCommand = 'npm run helm:lint';
  const modeCommand = `test "$(stat -c '%a' '${requirements.evidenceDirectory}/docker-build-check.json')" = 600`;
  const requiredCommands = [dockerCommand, supplyChainCommand, helmCommand, modeCommand];
  const commandSteps = requiredCommands.map(command => exactRunSteps(steps, command));
  commandSteps.forEach((matches, index) => {
    if (matches.length !== 1) {
      errors.push(`scaffold must contain exactly one ${requiredCommands[index]} step`);
    }
  });

  const uploadSteps = steps.filter(step => step.uses === 'actions/upload-artifact@v4' &&
    step.with?.name === 'p03-supply-chain-${{ github.sha }}');
  if (uploadSteps.length !== 1) {
    errors.push('scaffold must contain exactly one SHA-bound P03 evidence upload');
  }
  const upload = uploadSteps[0];
  const expectedUploadPath = `${requirements.evidenceDirectory}/`;
  if (upload?.with?.path !== expectedUploadPath) {
    errors.push(`P03 upload path must be exactly ${expectedUploadPath}`);
  }
  if (upload?.with?.['include-hidden-files'] !== true) {
    errors.push('P03 upload must include hidden files');
  }
  if (upload?.with?.['if-no-files-found'] !== 'error') {
    errors.push('P03 upload must fail when evidence is missing');
  }
  if (upload?.with?.['retention-days'] !== 14) {
    errors.push('P03 upload retention must be 14 days');
  }

  const orderedSteps = [...commandSteps.map(matches => matches[0]), upload];
  const orderedIndexes = orderedSteps.map(step => steps.indexOf(step));
  if (orderedIndexes.some(index => index < 0) ||
      orderedIndexes.some((index, position) => position > 0 && index <= orderedIndexes[position - 1])) {
    errors.push('P03 evidence steps must run docker, supply-chain, Helm, mode check, upload in order');
  }

  for (const [index, step] of orderedSteps.entries()) {
    if (!step) continue;
    if (Object.hasOwn(step, 'if')) {
      errors.push(`P03 evidence step ${index + 1} must be unconditional`);
    }
    if (Object.hasOwn(step, 'continue-on-error')) {
      errors.push(`P03 evidence step ${index + 1} must fail closed`);
    }
    if (typeof step.run === 'string' && step.run.includes('|| true')) {
      errors.push(`P03 evidence step ${index + 1} must not bypass failures`);
    }
  }

  return errors;
};

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
