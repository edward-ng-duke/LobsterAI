import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  loadWorkspaceRegistry,
  validateWorkspaceRegistry,
} from './saas-workspace-policy.mjs';

const defaultRepositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const expectedWorkspacePatterns = ['apps/*', 'libs/*/*'];
const expectedWorkspaces = [
  'apps/api',
  'apps/runtime-orchestrator',
  'apps/web',
  'apps/worker',
  'libs/client/bridge',
  'libs/server/auth',
  'libs/server/db',
  'libs/shared/contracts',
  'libs/shared/types',
];
const allStageGates = [
  'test:e2e',
  'contracts:check',
  'prisma:validate',
  'supply-chain:check',
  'docker:build:check',
  'helm:lint',
  'poc:v1:check',
];
const activeGates = new Set([
  'contracts:check',
  'prisma:validate',
  'supply-chain:check',
  'docker:build:check',
  'helm:lint',
]);
const deferredGates = allStageGates.filter(gate => !activeGates.has(gate));
const requiredRootScripts = {
  'build:saas':
    'node scripts/clean-saas-build.mjs && npm run build --workspaces && node scripts/check-saas-build-artifacts.mjs',
  'contracts:check': 'node scripts/run-saas-stage-gate.mjs contracts:check',
  'docker:build:check': 'node scripts/run-saas-stage-gate.mjs docker:build:check',
  'docker:build:validate': 'node scripts/check-docker-build.mjs',
  'docker:static': 'node scripts/check-docker-build.mjs --static',
  'helm:lint': 'node scripts/run-saas-stage-gate.mjs helm:lint',
  'helm:static': 'node scripts/check-helm.mjs --static',
  'helm:validate': 'node scripts/check-helm.mjs',
  'lint:saas':
    'eslint "apps/*/src/**/*.{ts,tsx}" "libs/*/*/src/**/*.ts" "tests/scaffold*.test.ts" "tests/contracts/**/*.test.ts" "tests/db/**/*.test.ts" "tests/integration/db/**/*.ts" "tests/deploy-*.test.ts"',
  'poc:v1:check': 'node scripts/run-saas-stage-gate.mjs poc:v1:check',
  'prisma:validate': 'node scripts/run-saas-stage-gate.mjs prisma:validate',
  'prisma:validate:active': 'node scripts/db/validate.mjs',
  'scaffold:check': 'node scripts/check-saas-scaffold.mjs',
  'supply-chain:check': 'node scripts/run-saas-stage-gate.mjs supply-chain:check',
  'supply-chain:validate': 'node scripts/check-supply-chain.mjs',
  'test:db:integration': 'node scripts/db/run-integration.mjs',
  'test:db:preflight': 'node scripts/db/preflight.mjs',
  'test:db:unit': 'vitest run tests/db',
  'test:e2e': 'node scripts/run-saas-stage-gate.mjs test:e2e',
  'test:scaffold':
    'vitest run tests/scaffold.test.ts tests/scaffold-checker.test.ts tests/scaffold-apps.test.ts tests/scaffold-web-build.test.ts tests/scaffold-stage-gates.test.ts tests/scaffold-build-artifacts.test.ts tests/scaffold-tester-corners.test.ts tests/scaffold-json-duplicate-keys.test.ts',
  typecheck: 'tsc -b tsconfig.workspace.json --pretty false',
};
const requiredScaffoldFiles = [
  'apps/runtime-orchestrator/poc/README.md',
  'apps/runtime-orchestrator/poc/poc-manifest.json',
  'charts/lobsterai/Chart.yaml',
  'charts/lobsterai/README.md',
  'charts/lobsterai/templates/sandbox-pod.yaml',
  'charts/lobsterai/values.yaml',
  'docker/README.md',
  'docker/api/README.md',
  'docker/openclaw-runtime/README.md',
  'docker/runtime-orchestrator/README.md',
  'docker/web/README.md',
  'docker/worker/README.md',
  'docs/poc/20260711_V1_OpenClaw沙箱PoC证据包/README.md',
  'docs/poc/README.md',
  'docs/supply-chain/README.md',
  'docs/supply-chain/skills-and-plugins.manifest.json',
  'libs/server/db/generated/README.md',
  'libs/shared/contracts/assets/supply-chain-inventory.schema.json',
  'prisma/README.md',
  'prisma/migrations/README.md',
  'prisma/rls/README.md',
  'prisma/schema.prisma',
  'prisma/seed/README.md',
  'scripts/expect-saas-stage-gate.mjs',
  'scripts/json-without-duplicate-keys.mjs',
  'scripts/check-saas-build-artifacts.mjs',
  'scripts/clean-saas-build.mjs',
  'scripts/run-saas-stage-gate.mjs',
  'scripts/saas-stage-gates.json',
  'scripts/saas-workspace-registry.json',
  'scripts/saas-workspace-policy.mjs',
];

const normalizeRelativePath = (value) => value.replaceAll(path.sep, '/').replace(/^\.\//, '');
const taggedError = (gate, message) => `[${gate}] ${message}`;
const stableObject = (value = {}) =>
  Object.fromEntries(Object.entries(value).sort(([left], [right]) => left.localeCompare(right)));

const readJson = (repositoryRoot, relativePath, errors, gate) => {
  try {
    return JSON.parse(readFileSync(path.join(repositoryRoot, relativePath), 'utf8'));
  } catch (error) {
    errors.push(taggedError(gate, `cannot read ${relativePath}: ${error.message}`));
    return undefined;
  }
};

const listFiles = (repositoryRoot, relativeDirectory, predicate = () => true) => {
  const absoluteDirectory = path.join(repositoryRoot, relativeDirectory);
  if (!existsSync(absoluteDirectory)) return [];
  return readdirSync(absoluteDirectory, { withFileTypes: true }).flatMap((entry) => {
    const child = normalizeRelativePath(path.join(relativeDirectory, entry.name));
    if (entry.isDirectory()) {
      if (entry.name === 'dist' || entry.name === 'dist-types' || entry.name === 'node_modules') return [];
      return listFiles(repositoryRoot, child, predicate);
    }
    return predicate(entry.name) ? [child] : [];
  });
};

const findImports = (source) => {
  const imports = [];
  const importPattern = /(?:from\s+|import\s*\(|require\s*\()\s*['"]([^'"]+)['"]/g;
  for (const match of source.matchAll(importPattern)) imports.push(match[1]);
  return imports;
};

const discoverWorkspaces = (repositoryRoot) => {
  const workspaces = [];
  const appsRoot = path.join(repositoryRoot, 'apps');
  if (existsSync(appsRoot)) {
    for (const entry of readdirSync(appsRoot, { withFileTypes: true })) {
      if (entry.isDirectory() && existsSync(path.join(appsRoot, entry.name, 'package.json'))) {
        workspaces.push(`apps/${entry.name}`);
      }
    }
  }
  const libsRoot = path.join(repositoryRoot, 'libs');
  if (existsSync(libsRoot)) {
    for (const group of readdirSync(libsRoot, { withFileTypes: true })) {
      if (!group.isDirectory()) continue;
      for (const entry of readdirSync(path.join(libsRoot, group.name), { withFileTypes: true })) {
        if (entry.isDirectory() && existsSync(path.join(libsRoot, group.name, entry.name, 'package.json'))) {
          workspaces.push(`libs/${group.name}/${entry.name}`);
        }
      }
    }
  }
  return workspaces.sort();
};

const loadReferenceGraph = (repositoryRoot, entryConfig, errors) => {
  const graph = new Map();
  const visit = (configPath) => {
    const normalizedConfig = normalizeRelativePath(configPath);
    if (graph.has(normalizedConfig)) return;
    if (!existsSync(path.join(repositoryRoot, normalizedConfig))) {
      errors.push(taggedError('SCAF-3', `missing TypeScript project reference: ${normalizedConfig}`));
      graph.set(normalizedConfig, []);
      return;
    }
    const config = readJson(repositoryRoot, normalizedConfig, errors, 'SCAF-3');
    const configDirectory = path.posix.dirname(normalizedConfig);
    const references = (config?.references ?? []).map(({ path: referencePath }) => {
      const candidate = path.posix.normalize(path.posix.join(configDirectory, referencePath));
      return candidate.endsWith('.json') ? candidate : `${candidate}/tsconfig.json`;
    });
    graph.set(normalizedConfig, references);
    references.forEach(visit);
  };
  visit(entryConfig);
  return graph;
};

const findReferenceCycles = (graph) => {
  const cycles = [];
  const visited = new Set();
  const active = [];
  const walk = (node) => {
    const activeIndex = active.indexOf(node);
    if (activeIndex >= 0) {
      cycles.push([...active.slice(activeIndex), node].join(' -> '));
      return;
    }
    if (visited.has(node)) return;
    active.push(node);
    for (const dependency of graph.get(node) ?? []) walk(dependency);
    active.pop();
    visited.add(node);
  };
  for (const node of graph.keys()) walk(node);
  return cycles;
};

const isNoOpCommand = (repositoryRoot, command, rootScripts, seen = new Set()) => {
  if (typeof command !== 'string' || command.trim() === '') return true;
  const normalized = command.trim();
  if (/--if-present\b/.test(normalized)) return true;
  if (/^(?::|true|exit\s+0|(?:echo|printf)\b.*)$/.test(normalized)) return true;
  if (/\bnode\s+(?:-e|-p)\b/.test(normalized)) {
    return !/(?:readFile|existsSync|spawn|exec|assert|throw|process\.exit\((?!0\)))/.test(normalized);
  }
  const npmRunMatch = normalized.match(/^npm\s+run\s+([^\s;&]+)/);
  if (npmRunMatch) {
    const target = npmRunMatch[1];
    if (seen.has(target)) return true;
    seen.add(target);
    return isNoOpCommand(repositoryRoot, rootScripts[target], rootScripts, seen);
  }
  const nodeScriptMatch = normalized.match(/^node\s+([^\s;&]+)(?:\s|$)/);
  if (nodeScriptMatch && !nodeScriptMatch[1].startsWith('-')) {
    const scriptPath = path.join(repositoryRoot, nodeScriptMatch[1]);
    if (!existsSync(scriptPath)) return true;
    const source = readFileSync(scriptPath, 'utf8');
    return (
      /process\.exit\(0\)/.test(source) &&
      !/(?:readFile|writeFile|existsSync|statSync|spawn|exec|assert|throw|process\.exit\((?!0\)))/.test(source)
    );
  }
  return false;
};

const validateDirectories = (repositoryRoot, discoveredWorkspaces, errors) => {
  for (const workspace of expectedWorkspaces) {
    for (const requiredFile of ['README.md', 'package.json', 'src/index.ts', 'tsconfig.json']) {
      const relativePath = `${workspace}/${requiredFile}`;
      if (!existsSync(path.join(repositoryRoot, relativePath))) {
        errors.push(taggedError('SCAF-1', `missing ${relativePath}`));
      }
    }
  }
  for (const relativePath of requiredScaffoldFiles) {
    const absolutePath = path.join(repositoryRoot, relativePath);
    if (!existsSync(absolutePath)) {
      errors.push(taggedError('SCAF-1', `missing ${relativePath}`));
    } else if (statSync(absolutePath).isFile() && statSync(absolutePath).size === 0) {
      errors.push(taggedError('SCAF-1', `empty fixture ${relativePath}`));
    }
  }
  let registry;
  try {
    ({ registry } = loadWorkspaceRegistry(repositoryRoot));
  } catch (error) {
    errors.push(taggedError('SCAF-2', `cannot parse workspace registry: ${error.message}`));
  }
  const registeredWorkspaces = new Set(Object.keys(registry?.workspaces ?? {}));
  for (const registryError of validateWorkspaceRegistry(registry)) {
    errors.push(taggedError('SCAF-2', `invalid workspace registry: ${registryError}`));
  }
  for (const workspace of discoveredWorkspaces) {
    if (!registeredWorkspaces.has(workspace)) {
      errors.push(
        taggedError(
          'SCAF-1',
          `unapproved physical deployable ${workspace}; update the registry and authoritative plan/RFC`,
        ),
      );
    }
  }
  for (const workspace of registeredWorkspaces) {
    if (!discoveredWorkspaces.includes(workspace)) {
      errors.push(taggedError('SCAF-1', `registered workspace is missing: ${workspace}`));
    }
  }
  return registry;
};

const validateCommandsAndCi = (
  repositoryRoot,
  rootPackage,
  discoveredWorkspaces,
  workspaceRegistry,
  errors,
) => {
  for (const [name, expectedCommand] of Object.entries(requiredRootScripts)) {
    const command = rootPackage.scripts?.[name];
    if (command !== expectedCommand) {
      errors.push(taggedError('SCAF-2', `root script ${name} must be: ${expectedCommand}`));
    }
    if (isNoOpCommand(repositoryRoot, command, rootPackage.scripts ?? {})) {
      errors.push(taggedError('SCAF-2', `root script ${name} is missing or a no-op`));
    }
  }
  for (const workspace of discoveredWorkspaces) {
    const manifest = readJson(repositoryRoot, `${workspace}/package.json`, errors, 'SCAF-2');
    const registered = workspaceRegistry?.workspaces?.[workspace];
    if (!registered) {
      errors.push(
        taggedError(
          'SCAF-2',
          `${workspace} must use its registered build command, typecheck command, and artifacts`,
        ),
      );
      continue;
    }
    if (
      typeof registered.planReference !== 'string' ||
      registered.planReference.length === 0 ||
      !Array.isArray(registered.artifacts) ||
      registered.artifacts.length === 0
    ) {
      errors.push(taggedError('SCAF-2', `${workspace} has an incomplete workspace registry entry`));
    }
    for (const scriptName of ['build', 'typecheck']) {
      if (manifest?.scripts?.[scriptName] !== registered[scriptName]) {
        errors.push(
          taggedError(
            'SCAF-2',
            `${workspace} must use its registered ${scriptName} command: ${registered[scriptName]} (no-op wrappers are forbidden)`,
          ),
        );
      }
    }
  }
  const stageManifest = readJson(
    repositoryRoot,
    'scripts/saas-stage-gates.json',
    errors,
    'SCAF-2',
  );
  if (
    stageManifest?.currentStage !== 'P03' ||
    stageManifest?.statuses?.NOT_APPLICABLE !== 78 ||
    stageManifest?.statuses?.PASS !== 0
  ) {
    errors.push(taggedError('SCAF-2', 'stage gate manifest must activate P01/P02/P03 PASS while preserving deferred exit 78'));
  }
  const runnerPath = path.join(repositoryRoot, 'scripts/run-saas-stage-gate.mjs');
  if (existsSync(runnerPath)) {
    const runnerSha256 = createHash('sha256').update(readFileSync(runnerPath)).digest('hex');
    if (stageManifest?.runnerSha256 !== runnerSha256) {
      errors.push(taggedError('SCAF-2', 'stage runner integrity does not match its frozen SHA-256'));
    }
  }
  for (const gateName of allStageGates) {
    const gate = stageManifest?.gates?.[gateName];
    const expectedStatus = activeGates.has(gateName) ? 'PASS' : 'NOT_APPLICABLE';
    if (
      gate?.status !== expectedStatus ||
      typeof gate?.activationTask !== 'string' ||
      gate.activationTask.length === 0 ||
      typeof gate?.reason !== 'string' ||
      gate.reason.length === 0 ||
      !Array.isArray(gate?.fixtures) ||
      gate.fixtures.length === 0
    ) {
      errors.push(taggedError('SCAF-2', `${gateName} lacks an honest P03 stage declaration`));
    }
  }
  const workflowPath = '.github/workflows/saas-scaffold.yml';
  if (!existsSync(path.join(repositoryRoot, workflowPath))) {
    errors.push(taggedError('SCAF-2', `missing ${workflowPath}`));
    return;
  }
  const workflow = readFileSync(path.join(repositoryRoot, workflowPath), 'utf8');
  for (const command of [
    'npm ci',
    'npm run scaffold:check',
    'npm run contracts:generate',
    'npm run contracts:check',
    'npm run prisma:validate',
    'npm run test:db:integration',
    'npm run supply-chain:check',
    'npm run docker:build:check',
    'npm run helm:lint',
    'npm run lint:saas',
    'npm run typecheck',
    'npm run test:scaffold',
    'npm run build:saas',
    'npm test',
    'npm run build',
    'npm run compile:electron',
    ...deferredGates.map((gate) => `node scripts/expect-saas-stage-gate.mjs ${gate}`),
  ]) {
    if (!workflow.includes(command)) {
      errors.push(taggedError('SCAF-2', `${workflowPath} does not execute ${command}`));
    }
  }
};

const validateWorkspaceDependencies = (
  repositoryRoot,
  rootPackage,
  discoveredWorkspaces,
  errors,
) => {
  if (JSON.stringify(rootPackage.workspaces) !== JSON.stringify(expectedWorkspacePatterns)) {
    errors.push(taggedError('SCAF-3', `root workspaces must be ${JSON.stringify(expectedWorkspacePatterns)}`));
  }
  if (existsSync(path.join(repositoryRoot, 'packages'))) {
    errors.push(taggedError('SCAF-3', 'packages/ is forbidden; libs/ is the shared-library root'));
  }
  const manifests = new Map();
  const workspaceByPackageName = new Map();
  for (const workspace of discoveredWorkspaces) {
    const manifest = readJson(repositoryRoot, `${workspace}/package.json`, errors, 'SCAF-3');
    if (!manifest) continue;
    manifests.set(workspace, manifest);
    if (manifest.private !== true) errors.push(taggedError('SCAF-3', `${workspace} must remain private`));
    if (!manifest.name?.startsWith('@lobsterai/')) {
      errors.push(taggedError('SCAF-3', `${workspace} must use the @lobsterai package scope`));
    } else if (workspaceByPackageName.has(manifest.name)) {
      errors.push(taggedError('SCAF-3', `duplicate package name ${manifest.name}`));
    } else {
      workspaceByPackageName.set(manifest.name, workspace);
    }
  }

  const graph = loadReferenceGraph(repositoryRoot, 'tsconfig.workspace.json', errors);
  const solutionReferences = new Set(graph.get('tsconfig.workspace.json') ?? []);
  for (const workspace of discoveredWorkspaces) {
    if (!solutionReferences.has(`${workspace}/tsconfig.json`)) {
      errors.push(taggedError('SCAF-3', `${workspace} is missing its solution reference`));
    }
  }
  for (const cycle of findReferenceCycles(graph)) {
    errors.push(taggedError('SCAF-3', `cyclic TypeScript project reference: ${cycle}`));
  }

  const lockfile = readJson(repositoryRoot, 'package-lock.json', errors, 'SCAF-3');
  if (lockfile?.lockfileVersion !== 3) {
    errors.push(taggedError('SCAF-3', 'package-lock.json must use lockfileVersion 3'));
  }
  if (JSON.stringify(lockfile?.packages?.['']?.workspaces) !== JSON.stringify(rootPackage.workspaces)) {
    errors.push(taggedError('SCAF-3', 'lockfile root workspace patterns drifted from package.json'));
  }
  for (const workspace of discoveredWorkspaces) {
    const lockEntry = lockfile?.packages?.[workspace];
    const manifest = manifests.get(workspace);
    if (!lockEntry) {
      errors.push(taggedError('SCAF-3', `lockfile is missing workspace ${workspace}`));
      continue;
    }
    for (const field of ['name', 'version']) {
      if (lockEntry[field] !== manifest?.[field]) {
        errors.push(taggedError('SCAF-3', `lockfile ${workspace} ${field} drifted from package.json`));
      }
    }
    for (const field of ['dependencies', 'devDependencies']) {
      if (JSON.stringify(stableObject(lockEntry[field])) !== JSON.stringify(stableObject(manifest?.[field]))) {
        errors.push(taggedError('SCAF-3', `lockfile ${workspace} ${field} drifted from package.json`));
      }
    }
    const configReferences = new Set(graph.get(`${workspace}/tsconfig.json`) ?? []);
    const dependencies = { ...manifest?.dependencies, ...manifest?.devDependencies };
    for (const dependencyName of Object.keys(dependencies)) {
      const dependencyWorkspace = workspaceByPackageName.get(dependencyName);
      if (dependencyWorkspace && !configReferences.has(`${dependencyWorkspace}/tsconfig.json`)) {
        errors.push(
          taggedError(
            'SCAF-3',
            `${workspace} depends on ${dependencyName} without a matching project reference`,
          ),
        );
      }
    }
  }
  return { graph, manifests };
};

const validateContractBoundary = (repositoryRoot, graph, manifests, errors) => {
  const forbiddenSharedDependency = /^(?:react(?:\/|$)|@nestjs\/|electron$|@lobsterai\/(?:api|web|worker|runtime-orchestrator|server-|client-))/;
  for (const [workspace, manifest] of manifests.entries()) {
    if (!workspace.startsWith('libs/shared/')) continue;
    for (const dependencyName of Object.keys({ ...manifest.dependencies, ...manifest.devDependencies })) {
      if (forbiddenSharedDependency.test(dependencyName)) {
        errors.push(
          taggedError('SCAF-4', `${workspace} declares forbidden manifest dependency ${dependencyName}`),
        );
      }
    }
    for (const reference of graph.get(`${workspace}/tsconfig.json`) ?? []) {
      if (!reference.startsWith('libs/shared/')) {
        errors.push(
          taggedError(
            'SCAF-4',
            `${workspace} has forbidden project reference ${reference.replace(/\/tsconfig\.json$/, '')}`,
          ),
        );
      }
    }
  }
  for (const sourceFile of listFiles(repositoryRoot, 'libs/shared', (name) => /\.(?:ts|tsx)$/.test(name))) {
    for (const importedModule of findImports(readFileSync(path.join(repositoryRoot, sourceFile), 'utf8'))) {
      if (forbiddenSharedDependency.test(importedModule)) {
        errors.push(taggedError('SCAF-4', `${sourceFile} imports forbidden dependency ${importedModule}`));
      }
    }
  }
  const webManifest = manifests.get('apps/web');
  for (const dependencyName of Object.keys({ ...webManifest?.dependencies, ...webManifest?.devDependencies })) {
    if (/^@lobsterai\/server-/.test(dependencyName)) {
      errors.push(taggedError('SCAF-4', `apps/web declares server-only dependency ${dependencyName}`));
    }
  }
  for (const sourceFile of listFiles(repositoryRoot, 'apps/web', (name) => /\.(?:ts|tsx)$/.test(name))) {
    for (const importedModule of findImports(readFileSync(path.join(repositoryRoot, sourceFile), 'utf8'))) {
      if (/^@lobsterai\/server-/.test(importedModule)) {
        errors.push(taggedError('SCAF-4', `${sourceFile} imports server-only dependency ${importedModule}`));
      }
    }
  }
  const contractDirectories = [];
  for (const topLevel of ['apps', 'libs']) {
    for (const relativeFile of listFiles(repositoryRoot, topLevel)) {
      const segments = path.posix.dirname(relativeFile).split('/');
      const contractIndex = segments.indexOf('contracts');
      if (contractIndex >= 0) contractDirectories.push(segments.slice(0, contractIndex + 1).join('/'));
    }
  }
  for (const directory of new Set(contractDirectories)) {
    if (directory !== 'libs/shared/contracts') {
      errors.push(taggedError('SCAF-4', `parallel contract source is forbidden: ${directory}`));
    }
  }
};

const validateGenerationPolicy = (repositoryRoot, errors) => {
  const policyPath = 'libs/shared/contracts/codegen-policy.json';
  if (!existsSync(path.join(repositoryRoot, policyPath))) {
    errors.push(taggedError('SCAF-5', `missing ${policyPath}`));
    return;
  }
  const policy = readJson(repositoryRoot, policyPath, errors, 'SCAF-5');
  if (policy?.requiredHeader !== 'Generated file. Do not edit.') {
    errors.push(taggedError('SCAF-5', 'codegen policy must freeze the generated-file header'));
  }
  if (policy?.status !== 'PASS' || policy?.activationTask !== 'P01-PR1契约') {
    errors.push(taggedError('SCAF-5', 'codegen policy must honestly declare active P01 stage status'));
  }
  for (const directory of [
    ...(policy?.sourceDirectories ?? []),
    policy?.fixtureDirectory,
    ...(policy?.generatedDirectories ?? []),
  ].filter(Boolean)) {
    const relativeDirectory = `libs/shared/contracts/${directory}`;
    if (!existsSync(path.join(repositoryRoot, relativeDirectory))) {
      errors.push(taggedError('SCAF-5', `missing codegen directory ${relativeDirectory}`));
    }
  }
  for (const directory of policy?.generatedDirectories ?? []) {
    for (const sourceFile of listFiles(repositoryRoot, `libs/shared/contracts/${directory}`, (name) =>
      /\.(?:ts|tsx)$/.test(name),
    )) {
      if (
        !readFileSync(path.join(repositoryRoot, sourceFile), 'utf8')
          .split(/\r?\n/, 1)[0]
          .includes(policy.requiredHeader)
      ) {
        errors.push(taggedError('SCAF-5', `${sourceFile} is missing the generated-file header`));
      }
    }
  }
  const workflowPath = '.github/workflows/saas-scaffold.yml';
  if (
    !existsSync(path.join(repositoryRoot, workflowPath)) ||
    !readFileSync(path.join(repositoryRoot, workflowPath), 'utf8').includes('git diff --exit-code')
  ) {
    errors.push(taggedError('SCAF-5', `${workflowPath} must enforce a clean generated-output diff`));
  }
};

const validateLegacyCompatibility = (rootPackage, errors) => {
  if (!rootPackage.scripts?.build?.includes('vite build')) {
    errors.push(taggedError('SCAF-6', 'legacy renderer build command must retain vite build'));
  }
  if (rootPackage.scripts?.['compile:electron'] !== 'tsc --project electron-tsconfig.json') {
    errors.push(taggedError('SCAF-6', 'legacy Electron compile command changed'));
  }
  if (rootPackage.scripts?.test !== 'vitest run') {
    errors.push(taggedError('SCAF-6', 'legacy Vitest entry point changed'));
  }
};

export const collectScaffoldErrors = (repositoryRoot = defaultRepositoryRoot) => {
  const errors = [];
  const rootPackage = readJson(repositoryRoot, 'package.json', errors, 'SCAF-3') ?? {};
  const discoveredWorkspaces = discoverWorkspaces(repositoryRoot);
  const workspaceRegistry = validateDirectories(repositoryRoot, discoveredWorkspaces, errors);
  validateCommandsAndCi(
    repositoryRoot,
    rootPackage,
    discoveredWorkspaces,
    workspaceRegistry,
    errors,
  );
  const { graph, manifests } = validateWorkspaceDependencies(
    repositoryRoot,
    rootPackage,
    discoveredWorkspaces,
    errors,
  );
  validateContractBoundary(repositoryRoot, graph, manifests, errors);
  validateGenerationPolicy(repositoryRoot, errors);
  validateLegacyCompatibility(rootPackage, errors);
  return errors;
};

const isMainModule =
  process.argv[1] !== undefined && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
if (isMainModule) {
  const errors = collectScaffoldErrors();
  if (errors.length > 0) {
    console.error('[SaaS Scaffold] failed');
    errors.forEach((error) => console.error(`- ${error}`));
    process.exitCode = 1;
  } else {
    console.log('[SaaS Scaffold] SCAF-1 directory and responsibility fixtures: passed');
    console.log('[SaaS Scaffold] SCAF-2 executable commands, stage gates, and CI: passed');
    console.log('[SaaS Scaffold] SCAF-3 npm workspace, lockfile, and reference graph: passed');
    console.log('[SaaS Scaffold] SCAF-4 single contract source and dependency direction: passed');
    console.log('[SaaS Scaffold] SCAF-5 codegen policy, headers, and CI clean-output enforcement: passed');
    console.log('[SaaS Scaffold] SCAF-6 legacy build commands retained: passed');
  }
}
