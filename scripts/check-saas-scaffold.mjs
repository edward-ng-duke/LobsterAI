import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

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

const requiredRootScripts = {
  'build:saas': 'npm run build --workspaces --if-present',
  'lint:saas': 'eslint "apps/*/src/**/*.{ts,tsx}" "libs/*/*/src/**/*.ts" tests/scaffold.test.ts',
  'scaffold:check': 'node scripts/check-saas-scaffold.mjs',
  'test:scaffold': 'vitest run tests/scaffold.test.ts',
  typecheck: 'tsc -b tsconfig.workspace.json --pretty false',
};

const readJson = (relativePath) => JSON.parse(readFileSync(path.join(repositoryRoot, relativePath), 'utf8'));
const normalizeRelativePath = (value) => value.replaceAll(path.sep, '/').replace(/^\.\//, '');

const listSourceFiles = (relativeDirectory) => {
  const absoluteDirectory = path.join(repositoryRoot, relativeDirectory);
  if (!existsSync(absoluteDirectory)) return [];
  return readdirSync(absoluteDirectory, { withFileTypes: true }).flatMap((entry) => {
    const child = path.join(relativeDirectory, entry.name);
    if (entry.isDirectory()) return listSourceFiles(child);
    return /\.(?:ts|tsx)$/.test(entry.name) ? [child] : [];
  });
};

const findImports = (source) => {
  const imports = [];
  const importPattern = /(?:from\s+|import\s*\(|require\s*\()\s*['"]([^'"]+)['"]/g;
  for (const match of source.matchAll(importPattern)) imports.push(match[1]);
  return imports;
};

const loadReferenceGraph = (entryConfig, errors) => {
  const graph = new Map();
  const visit = (configPath) => {
    const normalizedConfig = normalizeRelativePath(configPath);
    if (graph.has(normalizedConfig)) return;
    if (!existsSync(path.join(repositoryRoot, normalizedConfig))) {
      errors.push(`missing TypeScript project reference: ${normalizedConfig}`);
      graph.set(normalizedConfig, []);
      return;
    }
    const config = readJson(normalizedConfig);
    const configDirectory = path.posix.dirname(normalizedConfig);
    const references = (config.references ?? []).map(({ path: referencePath }) => {
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

export const collectScaffoldErrors = () => {
  const errors = [];
  const rootPackage = readJson('package.json');
  if (JSON.stringify(rootPackage.workspaces) !== JSON.stringify(expectedWorkspacePatterns)) {
    errors.push(`root workspaces must be ${JSON.stringify(expectedWorkspacePatterns)}`);
  }
  if (existsSync(path.join(repositoryRoot, 'packages'))) {
    errors.push('packages/ is forbidden; libs/ is the single shared-library root');
  }

  for (const [name, expectedCommand] of Object.entries(requiredRootScripts)) {
    const command = rootPackage.scripts?.[name];
    if (command !== expectedCommand) errors.push(`root script ${name} must be: ${expectedCommand}`);
    if (typeof command === 'string' && /(^|&&|;)\s*(?:echo|true|exit\s+0)\b/.test(command)) {
      errors.push(`root script ${name} is a no-op`);
    }
  }
  if (!rootPackage.scripts?.build?.includes('vite build')) {
    errors.push('legacy renderer build command must retain vite build');
  }
  if (rootPackage.scripts?.['compile:electron'] !== 'tsc --project electron-tsconfig.json') {
    errors.push('legacy Electron compile command changed');
  }
  if (rootPackage.scripts?.test !== 'vitest run') errors.push('legacy Vitest entry point changed');

  const packageNames = new Map();
  const workspaceByPackageName = new Map();
  for (const workspace of expectedWorkspaces) {
    for (const requiredFile of ['README.md', 'package.json', 'src/index.ts', 'tsconfig.json']) {
      const relativeFile = `${workspace}/${requiredFile}`;
      if (!existsSync(path.join(repositoryRoot, relativeFile))) errors.push(`missing ${relativeFile}`);
    }
    if (!existsSync(path.join(repositoryRoot, `${workspace}/package.json`))) continue;
    const workspacePackage = readJson(`${workspace}/package.json`);
    if (workspacePackage.private !== true) errors.push(`${workspace} must remain private`);
    if (!workspacePackage.name?.startsWith('@lobsterai/')) {
      errors.push(`${workspace} must use the @lobsterai package scope`);
    } else if (packageNames.has(workspacePackage.name)) {
      errors.push(`duplicate package name ${workspacePackage.name}`);
    } else {
      packageNames.set(workspacePackage.name, workspace);
      workspaceByPackageName.set(workspacePackage.name, workspace);
    }
    for (const scriptName of ['build', 'typecheck']) {
      const command = workspacePackage.scripts?.[scriptName];
      if (typeof command !== 'string' || /(^|&&|;)\s*(?:echo|true|exit\s+0)\b/.test(command)) {
        errors.push(`${workspace} must define a non-no-op ${scriptName} script`);
      }
    }
    const readme = path.join(repositoryRoot, workspace, 'README.md');
    if (existsSync(readme) && statSync(readme).size < 80) errors.push(`${workspace}/README.md is not substantive`);
  }

  const lockfilePath = path.join(repositoryRoot, 'package-lock.json');
  if (!existsSync(lockfilePath)) {
    errors.push('root package-lock.json is required');
  } else {
    const lockfile = readJson('package-lock.json');
    if (lockfile.lockfileVersion !== 3) errors.push('package-lock.json must use lockfileVersion 3');
    for (const workspace of expectedWorkspaces) {
      if (!lockfile.packages?.[workspace]) errors.push(`lockfile is missing workspace ${workspace}`);
    }
  }

  const graph = loadReferenceGraph('tsconfig.workspace.json', errors);
  const solutionReferences = graph.get('tsconfig.workspace.json') ?? [];
  for (const workspace of expectedWorkspaces) {
    const expectedConfig = `${workspace}/tsconfig.json`;
    if (!solutionReferences.includes(expectedConfig)) errors.push(`solution does not reference ${workspace}`);
  }
  for (const cycle of findReferenceCycles(graph)) errors.push(`cyclic TypeScript project reference: ${cycle}`);

  for (const workspace of expectedWorkspaces) {
    const manifestPath = `${workspace}/package.json`;
    const configPath = `${workspace}/tsconfig.json`;
    if (!existsSync(path.join(repositoryRoot, manifestPath)) || !existsSync(path.join(repositoryRoot, configPath))) {
      continue;
    }
    const manifest = readJson(manifestPath);
    const configReferences = new Set(graph.get(configPath) ?? []);
    const dependencies = { ...manifest.dependencies, ...manifest.devDependencies };
    for (const dependencyName of Object.keys(dependencies)) {
      const dependencyWorkspace = workspaceByPackageName.get(dependencyName);
      if (!dependencyWorkspace) continue;
      if (!configReferences.has(`${dependencyWorkspace}/tsconfig.json`)) {
        errors.push(`${workspace} depends on ${dependencyName} without a matching project reference`);
      }
    }
  }

  for (const sourceFile of listSourceFiles('libs/shared')) {
    for (const importedModule of findImports(readFileSync(path.join(repositoryRoot, sourceFile), 'utf8'))) {
      if (/^(?:react(?:\/|$)|@nestjs\/|electron$|@lobsterai\/(?:api|web|worker|runtime-orchestrator|server-))/.test(importedModule)) {
        errors.push(`${sourceFile} imports forbidden dependency ${importedModule}`);
      }
    }
  }
  for (const sourceFile of listSourceFiles('apps/web')) {
    for (const importedModule of findImports(readFileSync(path.join(repositoryRoot, sourceFile), 'utf8'))) {
      if (/^@lobsterai\/server-/.test(importedModule)) {
        errors.push(`${sourceFile} imports server-only dependency ${importedModule}`);
      }
    }
  }

  const workflowPath = '.github/workflows/saas-scaffold.yml';
  if (!existsSync(path.join(repositoryRoot, workflowPath))) {
    errors.push(`missing ${workflowPath}`);
  } else {
    const workflow = readFileSync(path.join(repositoryRoot, workflowPath), 'utf8');
    for (const command of [
      'npm ci',
      'npm run scaffold:check',
      'npm run lint:saas',
      'npm run typecheck',
      'npm run test:scaffold',
      'npm run build:saas',
      'npm run build',
      'npm run compile:electron',
    ]) {
      if (!workflow.includes(command)) errors.push(`${workflowPath} does not run ${command}`);
    }
  }
  return errors;
};

const isMainModule = process.argv[1] !== undefined && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
if (isMainModule) {
  const errors = collectScaffoldErrors();
  if (errors.length > 0) {
    console.error('[SaaS Scaffold] failed');
    errors.forEach((error) => console.error(`- ${error}`));
    process.exitCode = 1;
  } else {
    console.log('[SaaS Scaffold] SCAF-1 directory boundaries: passed');
    console.log('[SaaS Scaffold] SCAF-2 non-no-op commands and CI: passed');
    console.log('[SaaS Scaffold] SCAF-3 npm workspace and lockfile: passed');
    console.log('[SaaS Scaffold] SCAF-4 single contract source boundary: passed');
    console.log('[SaaS Scaffold] SCAF-5 TypeScript reference graph: passed');
    console.log('[SaaS Scaffold] SCAF-6 legacy build commands retained: passed');
  }
}
