import {
  cpSync,
  lstatSync,
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
  canonicalDirectory: string;
  manifest: { name?: string };
  relativeDirectories: string[];
}

interface MutableTypeScriptProject {
  canonicalDirectory: string;
  manifest: { name?: string };
  relativeDirectories: Set<string>;
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

const assertStrictSubpath = (root: string, candidate: string, label: string): string => {
  const resolvedCandidate = assertContainedPath(root, candidate, label);
  if (path.relative(path.resolve(root), resolvedCandidate) === '') {
    throw new Error(`${label} must be a non-empty strict subpath of ${path.resolve(root)}`);
  }
  return resolvedCandidate;
};

const resolveCanonicalRepositorySource = (candidate: string, label: string): string => {
  const lexicalCandidate = assertContainedPath(repositoryRoot, candidate, label);
  return assertContainedPath(
    canonicalRepositoryRoot,
    realpathSync(lexicalCandidate),
    `${label} canonical path`,
  );
};

const projectRelativeDirectory = (candidate: string, label: string): string => {
  const strictDirectory = assertStrictSubpath(repositoryRoot, candidate, label);
  return normalizeRelativePath(path.relative(repositoryRoot, strictDirectory));
};

const resolveProjectConfig = (configPath: string, referencePath: string): string => {
  const candidate = path.resolve(path.dirname(configPath), referencePath);
  return candidate.endsWith('.json') ? candidate : path.join(candidate, 'tsconfig.json');
};

const collectProjectReferenceClosure = (entryConfig: string): TypeScriptProject[] => {
  const projects = new Map<string, MutableTypeScriptProject>();
  const visit = (candidateConfig: string): void => {
    const lexicalConfig = assertContainedPath(repositoryRoot, candidateConfig, 'TypeScript project config');
    const relativeDirectory = projectRelativeDirectory(
      path.dirname(lexicalConfig),
      'TypeScript project destination',
    );
    const canonicalConfig = resolveCanonicalRepositorySource(
      lexicalConfig,
      'TypeScript project config',
    );
    const existingProject = projects.get(canonicalConfig);
    if (existingProject) {
      existingProject.relativeDirectories.add(relativeDirectory);
      return;
    }

    const canonicalDirectory = assertStrictSubpath(
      canonicalRepositoryRoot,
      realpathSync(path.dirname(canonicalConfig)),
      'Canonical TypeScript project directory',
    );
    const manifestPath = resolveCanonicalRepositorySource(
      path.join(canonicalDirectory, 'package.json'),
      'TypeScript project manifest',
    );
    const project: MutableTypeScriptProject = {
      canonicalDirectory,
      manifest: JSON.parse(readFileSync(manifestPath, 'utf8')) as { name?: string },
      relativeDirectories: new Set([relativeDirectory]),
    };
    projects.set(canonicalConfig, project);

    const config = JSON.parse(
      readFileSync(canonicalConfig, 'utf8'),
    ) as TypeScriptProjectConfig;
    for (const reference of config.references ?? []) {
      if (!reference || typeof reference.path !== 'string' || reference.path.length === 0) {
        throw new Error(`Invalid TypeScript project reference in ${canonicalConfig}`);
      }
      visit(resolveProjectConfig(canonicalConfig, reference.path));
    }
  };

  visit(path.resolve(repositoryRoot, entryConfig));
  return [...projects.values()]
    .map((project) => ({
      canonicalDirectory: project.canonicalDirectory,
      manifest: project.manifest,
      relativeDirectories: [...project.relativeDirectories].sort(),
    }))
    .sort((left, right) => left.canonicalDirectory.localeCompare(right.canonicalDirectory));
};

const isExcludedProjectPath = (relativePath: string): boolean =>
  /(?:^|\/)(?:dist|dist-types|node_modules)(?:\/|$)/.test(relativePath) ||
  relativePath.endsWith('.tsbuildinfo');

const assertProjectTreeHasNoSymlinks = (source: string): void => {
  const visit = (directory: string): void => {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const candidate = path.join(directory, entry.name);
      const relativeCandidate = normalizeRelativePath(path.relative(source, candidate));
      if (isExcludedProjectPath(relativeCandidate)) continue;
      if (entry.isSymbolicLink() || lstatSync(candidate).isSymbolicLink()) {
        throw new Error(`TypeScript project source must not contain symlinks: ${candidate}`);
      }
      if (entry.isDirectory()) visit(candidate);
    }
  };
  visit(source);
};

const copyProject = (
  targetRoot: string,
  project: TypeScriptProject,
  relativeDirectory: string,
): void => {
  const source = assertStrictSubpath(
    canonicalRepositoryRoot,
    project.canonicalDirectory,
    'Canonical TypeScript project directory',
  );
  const destination = assertStrictSubpath(
    targetRoot,
    path.resolve(targetRoot, relativeDirectory),
    'Fixture project destination',
  );
  mkdirSync(path.dirname(destination), { recursive: true });
  cpSync(source, destination, {
    recursive: true,
    filter: (candidate) => {
      const relativeCandidate = normalizeRelativePath(path.relative(source, candidate));
      if (isExcludedProjectPath(relativeCandidate)) return false;
      if (lstatSync(candidate).isSymbolicLink()) {
        throw new Error(`TypeScript project source must not contain symlinks: ${candidate}`);
      }
      return true;
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
    const packageDirectory = project.relativeDirectories[0];
    if (!packageDirectory) throw new Error(`Missing fixture destination for ${project.manifest.name}`);
    symlinkSync(
      assertStrictSubpath(
        targetRoot,
        path.resolve(targetRoot, packageDirectory),
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
  projects.forEach((project) => assertProjectTreeHasNoSymlinks(project.canonicalDirectory));
  const root = mkdtempSync(path.join(tmpdir(), 'lobsterai-web-build-'));
  try {
    for (const rootFile of ['package.json', 'tsconfig.base.json']) {
      cpSync(path.join(repositoryRoot, rootFile), path.join(root, rootFile));
    }

    projects.forEach((project) =>
      project.relativeDirectories.forEach((relativeDirectory) =>
        copyProject(root, project, relativeDirectory),
      ),
    );
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
