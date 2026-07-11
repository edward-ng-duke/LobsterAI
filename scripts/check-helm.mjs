import { randomUUID } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  renameSync,
  writeFileSync,
} from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import yaml from 'js-yaml';

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const chartRelativePath = 'charts/lobsterai';
const requiredComponents = ['web', 'api', 'worker', 'runtimeOrchestrator'];
const digestPattern = /^sha256:[a-f0-9]{64}$/;
const repositoryPattern = /^(?!.*(?:debug|xvfb|novnc|:latest))[a-z0-9.-]+(?::[0-9]+)?\/[a-z0-9._/-]+$/;
const quantityPattern = /^[1-9][0-9]*(?:m|Ki|Mi|Gi|Ti)?$/;
const forbiddenRenderedPattern = /(?:0\.0\.0\.0\/0|169\.254\.169\.254|xvfb|x11vnc|novnc|:latest|cluster-admin)/i;

const asRecord = (value) => value && typeof value === 'object' && !Array.isArray(value) ? value : {};

const rejectUnknown = (value, allowed, label, errors) => {
  for (const key of Object.keys(asRecord(value))) {
    if (!allowed.includes(key)) errors.push(`${label}: unknown field ${key}`);
  }
};

const validateResourcePair = (value, label, errors) => {
  const resource = asRecord(value);
  rejectUnknown(resource, ['cpu', 'memory'], label, errors);
  for (const key of ['cpu', 'memory']) {
    if (!quantityPattern.test(String(resource[key] ?? ''))) errors.push(`${label}.${key}: invalid or empty quantity`);
  }
};

const validateResources = (value, label, errors) => {
  const resources = asRecord(value);
  rejectUnknown(resources, ['requests', 'limits'], label, errors);
  validateResourcePair(resources.requests, `${label}.requests`, errors);
  validateResourcePair(resources.limits, `${label}.limits`, errors);
};

export const validateValues = (values) => {
  const errors = [];
  rejectUnknown(values, ['global', 'images', 'components', 'config', 'security', 'networkPolicy', 'quota', 'sandbox'], 'values', errors);
  if (values.global?.profile !== 'production') errors.push('global.profile must be production');
  if (values.global?.productionNetwork !== 'offline') errors.push('global.productionNetwork must be offline');
  rejectUnknown(values.images, requiredComponents, 'images', errors);
  for (const component of requiredComponents) {
    const image = asRecord(values.images?.[component]);
    rejectUnknown(image, ['repository', 'digest'], `images.${component}`, errors);
    if (!repositoryPattern.test(String(image.repository ?? ''))) errors.push(`images.${component}.repository is not production-safe`);
    if (!digestPattern.test(String(image.digest ?? ''))) errors.push(`images.${component}.digest must be sha256:<64hex>`);
  }
  rejectUnknown(values.components, requiredComponents, 'components', errors);
  for (const component of requiredComponents) {
    const config = asRecord(values.components?.[component]);
    const allowed = component === 'worker' ? ['replicas', 'resources', 'probe'] : ['replicas', 'port', 'resources', 'probe'];
    rejectUnknown(config, allowed, `components.${component}`, errors);
    if (!Number.isInteger(config.replicas) || config.replicas < 1) errors.push(`components.${component}.replicas must be >= 1`);
    validateResources(config.resources, `components.${component}.resources`, errors);
    if (Object.keys(asRecord(config.probe)).length === 0) errors.push(`components.${component}.probe is required`);
  }
  if (values.networkPolicy?.enabled !== true) errors.push('networkPolicy.enabled must remain true');
  if (values.sandbox?.enabled) {
    if (!values.sandbox.runtimeClassName) errors.push('sandbox.runtimeClassName is required when enabled');
    if (!values.sandbox.serviceAccountName) errors.push('sandbox.serviceAccountName is required when enabled');
  }
  const sandboxImage = asRecord(values.sandbox?.image);
  if (!repositoryPattern.test(String(sandboxImage.repository ?? ''))) errors.push('sandbox.image.repository is not production-safe');
  if (!digestPattern.test(String(sandboxImage.digest ?? ''))) errors.push('sandbox.image.digest must be sha256:<64hex>');
  validateResources(values.sandbox?.resources, 'sandbox.resources', errors);
  return errors;
};

const collectTemplateSources = (chartRoot) => {
  const templatesRoot = path.join(chartRoot, 'templates');
  return readdirSync(templatesRoot, { recursive: true })
    .filter((entry) => typeof entry === 'string' && /\.(?:yaml|yml|tpl)$/.test(entry))
    .map((entry) => readFileSync(path.join(templatesRoot, entry), 'utf8'))
    .join('\n---\n');
};

export const checkHelmStatic = (root = repositoryRoot) => {
  const chartRoot = path.join(root, chartRelativePath);
  const errors = [];
  for (const relativePath of ['Chart.yaml', 'values.yaml', 'values.schema.json', 'templates/sandbox-pod.yaml']) {
    if (!existsSync(path.join(chartRoot, relativePath))) errors.push(`missing chart file: ${relativePath}`);
  }
  if (errors.length > 0) return errors;
  const values = yaml.load(readFileSync(path.join(chartRoot, 'values.yaml'), 'utf8'));
  errors.push(...validateValues(values));
  const schema = JSON.parse(readFileSync(path.join(chartRoot, 'values.schema.json'), 'utf8'));
  if (schema.additionalProperties !== false) errors.push('values schema root must reject unknown properties');
  if (!schema.$defs?.image || !schema.$defs?.resources || !schema.$defs?.probe) {
    errors.push('values schema is missing image/resources/probe definitions');
  }
  const sources = collectTemplateSources(chartRoot);
  for (const kind of ['Deployment', 'Service', 'ConfigMap', 'ServiceAccount', 'Role', 'RoleBinding', 'NetworkPolicy', 'ResourceQuota']) {
    if (!new RegExp(`kind:\\s*${kind}\\b`).test(sources)) errors.push(`templates are missing ${kind}`);
  }
  for (const component of ['web', 'api', 'worker', 'runtime-orchestrator']) {
    if (!sources.includes(`app.kubernetes.io/component: ${component}`)) errors.push(`templates are missing ${component} workload labels`);
  }
  for (const baseline of [
    'automountServiceAccountToken: false',
    'runAsNonRoot: true',
    'allowPrivilegeEscalation: false',
    'readOnlyRootFilesystem: true',
    'type: RuntimeDefault',
    'required "sandbox.runtimeClassName',
    'required "sandbox.serviceAccountName',
  ]) {
    if (!sources.includes(baseline)) errors.push(`templates are missing security baseline: ${baseline}`);
  }
  if (forbiddenRenderedPattern.test(sources)) errors.push('templates contain forbidden public egress/debug/latest content');
  if (/resources:\s*\n\s*-\s*["']?\*["']?/.test(sources) || /verbs:\s*\[[^\]]*["']\*["']/.test(sources)) {
    errors.push('RBAC wildcard is forbidden');
  }
  if (!sources.includes('name: {{ include "lobsterai.fullname" . }}-default-deny')) {
    errors.push('default-deny NetworkPolicy is missing');
  }
  if (!sources.includes('secretKeyRef:')) errors.push('workloads must reference secrets by name and key');
  if (/kind:\s*Secret\b/.test(sources)) errors.push('chart must not materialize secret values');
  return errors;
};

const containerSecurityErrors = (deployment) => {
  const errors = [];
  const name = deployment.metadata?.name ?? '<unnamed>';
  const podSpec = deployment.spec?.template?.spec ?? {};
  if (podSpec.automountServiceAccountToken !== false) errors.push(`${name}: service account token must not automount`);
  const podSecurity = podSpec.securityContext ?? {};
  if (podSecurity.runAsNonRoot !== true || podSecurity.seccompProfile?.type !== 'RuntimeDefault') {
    errors.push(`${name}: pod securityContext is incomplete`);
  }
  for (const container of podSpec.containers ?? []) {
    const security = container.securityContext ?? {};
    if (security.allowPrivilegeEscalation !== false || security.readOnlyRootFilesystem !== true
      || security.runAsNonRoot !== true || security.seccompProfile?.type !== 'RuntimeDefault') {
      errors.push(`${name}/${container.name}: container securityContext is incomplete`);
    }
    if (!security.capabilities?.drop?.includes('ALL')) errors.push(`${name}/${container.name}: capabilities ALL must be dropped`);
    if (!container.resources?.requests || !container.resources?.limits) errors.push(`${name}/${container.name}: resources are required`);
    if (!container.readinessProbe || !container.livenessProbe) errors.push(`${name}/${container.name}: readiness/liveness probes are required`);
    if (!String(container.image).includes('@sha256:')) errors.push(`${name}/${container.name}: image must use a digest`);
  }
  return errors;
};

export const scanRenderedManifests = (rendered) => {
  const errors = [];
  if (forbiddenRenderedPattern.test(rendered)) errors.push('rendered chart contains forbidden public egress/debug/latest content');
  const documents = [];
  yaml.loadAll(rendered, document => { if (document) documents.push(document); });
  const deployments = documents.filter(document => document.kind === 'Deployment');
  if (deployments.length !== 4) errors.push(`expected 4 Deployments, found ${deployments.length}`);
  deployments.forEach(deployment => errors.push(...containerSecurityErrors(deployment)));
  const services = documents.filter(document => document.kind === 'Service');
  for (const component of ['web', 'api']) {
    if (!services.some(service => service.spec?.selector?.['app.kubernetes.io/component'] === component)) {
      errors.push(`${component} Service selector is missing or incorrect`);
    }
  }
  const policies = documents.filter(document => document.kind === 'NetworkPolicy');
  if (!policies.some(policy => policy.spec?.podSelector
    && Object.keys(policy.spec.podSelector).length === 0
    && policy.spec.policyTypes?.includes('Ingress')
    && policy.spec.policyTypes?.includes('Egress')
    && !policy.spec.ingress && !policy.spec.egress)) {
    errors.push('rendered default-deny ingress/egress policy is missing');
  }
  if (!documents.some(document => document.kind === 'ResourceQuota')) errors.push('rendered ResourceQuota is missing');
  const expectedEdges = [
    ['web-to-api', 'web', 'api'],
    ['worker-to-api', 'worker', 'api'],
    ['orchestrator-to-api', 'runtime-orchestrator', 'api'],
  ];
  for (const [suffix, source, destination] of expectedEdges) {
    const policy = policies.find(candidate => candidate.metadata?.name?.endsWith(suffix));
    const rule = policy?.spec?.egress?.[0];
    if (policy?.spec?.podSelector?.matchLabels?.['app.kubernetes.io/component'] !== source
      || rule?.to?.[0]?.podSelector?.matchLabels?.['app.kubernetes.io/component'] !== destination
      || rule?.ports?.[0]?.protocol !== 'TCP'
      || !Number.isInteger(rule?.ports?.[0]?.port)) {
      errors.push(`${suffix}: component selectors and explicit TCP port are required`);
    }
  }
  if (policies.some(policy => policy.metadata?.name?.endsWith('allow-service-plane'))) {
    errors.push('broad allow-service-plane NetworkPolicy is forbidden');
  }
  const roles = documents.filter(document => document.kind === 'Role');
  for (const role of roles) {
    for (const rule of role.rules ?? []) {
      if (rule.resources?.includes('*') || rule.verbs?.includes('*')) errors.push(`${role.metadata?.name}: RBAC wildcard is forbidden`);
    }
  }
  return errors;
};

const runHelm = (args) => spawnSync('helm', args, { cwd: repositoryRoot, encoding: 'utf8' });

const readGitState = () => {
  const sourceSha = spawnSync('git', ['rev-parse', 'HEAD'], {
    cwd: repositoryRoot,
    encoding: 'utf8',
  });
  const status = spawnSync('git', ['status', '--porcelain', '--untracked-files=all'], {
    cwd: repositoryRoot,
    encoding: 'utf8',
  });
  if (sourceSha.status !== 0 || !/^[a-f0-9]{40}$/.test(sourceSha.stdout.trim())) {
    throw new Error('unable to resolve the source Git SHA');
  }
  if (status.status !== 0 || status.stdout.trim() !== '') {
    throw new Error('Helm evidence requires a clean Git worktree');
  }
  return sourceSha.stdout.trim();
};

const writeReport = (report) => {
  const directory = path.join(repositoryRoot, '.reports/supply-chain/20260711_PR3部署供应链证据');
  mkdirSync(directory, { recursive: true });
  const destination = path.join(directory, 'helm-lint.json');
  const temporary = `${destination}.${report.invocationId}.tmp`;
  writeFileSync(temporary, `${JSON.stringify(report, null, 2)}\n`, { mode: 0o600 });
  renameSync(temporary, destination);
  return destination;
};

const main = () => {
  const staticErrors = checkHelmStatic();
  if (staticErrors.length > 0) {
    console.error(JSON.stringify({ status: 'FAILED', check: 'helm', errors: staticErrors }, null, 2));
    process.exitCode = 1;
    return;
  }
  if (process.argv.includes('--static')) {
    console.log(JSON.stringify({ status: 'PASSED', check: 'helm-static', chart: chartRelativePath }));
    return;
  }
  const sourceSha = readGitState();
  const version = runHelm(['version', '--short']);
  if (version.status !== 0) {
    console.error(JSON.stringify({ status: 'BLOCKED', check: 'helm', reason: 'missing or unusable helm binary' }));
    process.exitCode = 2;
    return;
  }
  const lint = runHelm(['lint', chartRelativePath, '--strict']);
  if (lint.status !== 0) throw new Error(`helm lint failed: ${lint.stdout}\n${lint.stderr}`);
  const template = runHelm(['template', 'p03', chartRelativePath, '--namespace', 'lobster-svc']);
  if (template.status !== 0) throw new Error(`helm template failed: ${template.stderr}`);
  const renderedErrors = scanRenderedManifests(template.stdout);
  if (renderedErrors.length > 0) throw new Error(renderedErrors.join('\n'));
  for (const mutation of [
    ['--set', 'images.api.digest=latest'],
    ['--set', 'unexpectedField=true'],
    ['--set', 'sandbox.enabled=true'],
  ]) {
    const negative = runHelm(['lint', chartRelativePath, '--strict', ...mutation]);
    if (negative.status === 0) throw new Error(`negative Helm mutation was accepted: ${mutation.join(' ')}`);
  }
  const report = {
    schemaVersion: 1,
    status: 'PASSED',
    invocationId: randomUUID(),
    generatedAt: new Date().toISOString(),
    sourceSha,
    helmVersion: version.stdout.trim(),
    chart: chartRelativePath,
    renderedDocuments: template.stdout.split(/^---$/m).length,
    negativeMutations: 3,
  };
  const reportPath = writeReport(report);
  console.log(JSON.stringify({ ...report, reportPath }));
};

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    main();
  } catch (error) {
    console.error(JSON.stringify({ status: 'FAILED', check: 'helm', reason: String(error) }));
    process.exitCode = 1;
  }
}
