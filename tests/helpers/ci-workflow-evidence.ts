export interface WorkflowStep {
  'continue-on-error'?: boolean;
  if?: string;
  run?: string;
  uses?: string;
  with?: Record<string, unknown>;
}

export interface WorkflowJob {
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

  const pullRequest = workflow.on?.pull_request;
  if (pullRequest === undefined) errors.push('pull_request trigger must exist');
  if (pullRequest && typeof pullRequest === 'object' && Object.hasOwn(pullRequest, 'paths')) {
    errors.push('pull_request trigger must not filter paths');
  }

  const checkout = steps.find((step) => step.uses === 'actions/checkout@v4');
  if (checkout?.with?.['fetch-depth'] !== 0) errors.push('checkout must fetch full history');

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
  if (steps.some((step) => step['continue-on-error'] === true)) {
    errors.push('test job must not continue on error');
  }

  return errors;
};
