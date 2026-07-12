import {
  cpSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  realpathSync,
  rmSync,
  symlinkSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

const repositoryRoot = path.resolve(import.meta.dirname, '../..');
const canonicalRepositoryRoot = realpathSync(repositoryRoot);
const webProjectConfig = 'apps/web/tsconfig.json';

interface TypeScriptProjectConfig {
  references?: Array<{ path: string }>;
}

interface TypeScriptProject {
  absoluteDirectory: string;
  manifest: { name?: string };
  relativeDirectory: string;
}

export interface WebWorkspaceBuildFixture {
  cleanup: () => void;
  resolveWebDist: (...segments: string[]) => string;
  root: string;
}

const normalizeRelativePath = (value: string): string => value.replaceAll(path.sep, '/');

const assertContainedPath = (root: string, candidate: string, label: string): string => {
  const resolvedRoot = path.resolve(root);
  const resolvedCandidate = path.resolve(candidate);
  const relative = path.relative(resolvedRoot, resolvedCandidate);
  if (relative === '..' || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) {
    throw new Error(`${label} must stay within ${resolvedRoot}: ${resolvedCandidate}`);
  }
  return resolvedCandidate;
};

const assertRepositorySource = (candidate: string, label: string): string => {
  const resolvedCandidate = assertContainedPath(repositoryRoot, candidate, label);
  assertContainedPath(canonicalRepositoryRoot, realpathSync(resolvedCandidate), `${label} canonical path`);
  return resolvedCandidate;
};

const resolveProjectConfig = (configPath: string, referencePath: string): string => {
  const candidate = path.resolve(path.dirname(configPath), referencePath);
  return candidate.endsWith('.json') ? candidate : path.join(candidate, 'tsconfig.json');
};

const collectProjectReferenceClosure = (entryConfig: string): TypeScriptProject[] => {
  const projectConfigs = new Set<string>();
  const visit = (candidateConfig: string): void => {
    const absoluteConfig = assertRepositorySource(candidateConfig, 'TypeScript project config');
    if (projectConfigs.has(absoluteConfig)) return;
    projectConfigs.add(absoluteConfig);

    const config = JSON.parse(
      readFileSync(absoluteConfig, 'utf8'),
    ) as TypeScriptProjectConfig;
    for (const reference of config.references ?? []) {
      if (!reference || typeof reference.path !== 'string' || reference.path.length === 0) {
        throw new Error(`Invalid TypeScript project reference in ${absoluteConfig}`);
      }
      visit(resolveProjectConfig(absoluteConfig, reference.path));
    }
  };

  visit(path.resolve(repositoryRoot, entryConfig));
  return [...projectConfigs]
    .sort()
    .map((absoluteConfig) => {
      const absoluteDirectory = assertRepositorySource(
        path.dirname(absoluteConfig),
        'TypeScript project directory',
      );
      const manifestPath = assertRepositorySource(
        path.join(absoluteDirectory, 'package.json'),
        'TypeScript project manifest',
      );
      const manifest = JSON.parse(readFileSync(manifestPath, 'utf8')) as { name?: string };
      return {
        absoluteDirectory,
        manifest,
        relativeDirectory: normalizeRelativePath(path.relative(repositoryRoot, absoluteDirectory)),
      };
    });
};

const copyProject = (targetRoot: string, project: TypeScriptProject): void => {
  const source = assertRepositorySource(project.absoluteDirectory, 'TypeScript project directory');
  const destination = assertContainedPath(
    targetRoot,
    path.resolve(targetRoot, project.relativeDirectory),
    'Fixture project destination',
  );
  mkdirSync(path.dirname(destination), { recursive: true });
  cpSync(source, destination, {
    recursive: true,
    filter: (candidate) => {
      const relativeCandidate = normalizeRelativePath(path.relative(source, candidate));
      return !/(?:^|\/)(?:dist|dist-types|node_modules)(?:\/|$)/.test(relativeCandidate) &&
        !relativeCandidate.endsWith('.tsbuildinfo');
    },
  });
};

const linkExternalNodeModules = (targetRoot: string, projects: TypeScriptProject[]): void => {
  const sourceNodeModules = path.join(repositoryRoot, 'node_modules');
  const targetNodeModules = path.join(targetRoot, 'node_modules');
  mkdirSync(targetNodeModules, { recursive: true });

  for (const entry of readdirSync(sourceNodeModules)) {
    if (entry === '@lobsterai') continue;
    symlinkSync(
      path.join(sourceNodeModules, entry),
      assertContainedPath(targetNodeModules, path.resolve(targetNodeModules, entry), 'Dependency link'),
    );
  }

  const lobsteraiScope = path.join(targetNodeModules, '@lobsterai');
  mkdirSync(lobsteraiScope, { recursive: true });
  for (const project of projects) {
    const packageName = project.manifest.name?.replace(/^@lobsterai\//, '');
    if (!packageName || project.manifest.name === packageName) continue;
    if (packageName.includes('/') || packageName.includes('\\')) {
      throw new Error(`Invalid @lobsterai package name: ${project.manifest.name}`);
    }
    symlinkSync(
      assertContainedPath(
        targetRoot,
        path.resolve(targetRoot, project.relativeDirectory),
        'Fixture package source',
      ),
      assertContainedPath(
        lobsteraiScope,
        path.resolve(lobsteraiScope, packageName),
        'Fixture package link',
      ),
      process.platform === 'win32' ? 'junction' : 'dir',
    );
  }
};

export const createWebWorkspaceBuildFixture = (): WebWorkspaceBuildFixture => {
  const projects = collectProjectReferenceClosure(webProjectConfig);
  const root = mkdtempSync(path.join(tmpdir(), 'lobsterai-web-build-'));
  try {
    for (const rootFile of ['package.json', 'tsconfig.base.json']) {
      cpSync(path.join(repositoryRoot, rootFile), path.join(root, rootFile));
    }

    projects.forEach((project) => copyProject(root, project));
    linkExternalNodeModules(root, projects);

    return {
      cleanup: () => rmSync(root, { recursive: true, force: true }),
      resolveWebDist: (...segments) => path.join(root, 'apps/web/dist', ...segments),
      root,
    };
  } catch (error) {
    rmSync(root, { recursive: true, force: true });
    throw error;
  }
};
