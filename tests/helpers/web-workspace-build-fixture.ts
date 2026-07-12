import {
  cpSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  symlinkSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

const repositoryRoot = path.resolve(import.meta.dirname, '../..');
const webProjectConfig = 'apps/web/tsconfig.json';

interface TypeScriptProjectConfig {
  references?: Array<{ path: string }>;
}

export interface WebWorkspaceBuildFixture {
  cleanup: () => void;
  resolveWebDist: (...segments: string[]) => string;
  root: string;
}

const normalizeRelativePath = (value: string): string => value.replaceAll(path.sep, '/');

const resolveProjectConfig = (configPath: string, referencePath: string): string => {
  const candidate = path.resolve(path.dirname(configPath), referencePath);
  return candidate.endsWith('.json') ? candidate : path.join(candidate, 'tsconfig.json');
};

const collectProjectReferenceClosure = (entryConfig: string): string[] => {
  const projects = new Set<string>();
  const visit = (relativeConfig: string): void => {
    const normalizedConfig = normalizeRelativePath(relativeConfig);
    if (projects.has(normalizedConfig)) return;
    projects.add(normalizedConfig);

    const config = JSON.parse(
      readFileSync(path.join(repositoryRoot, normalizedConfig), 'utf8'),
    ) as TypeScriptProjectConfig;
    for (const reference of config.references ?? []) {
      const absoluteReference = resolveProjectConfig(
        path.join(repositoryRoot, normalizedConfig),
        reference.path,
      );
      visit(path.relative(repositoryRoot, absoluteReference));
    }
  };

  visit(entryConfig);
  return [...projects].sort();
};

const copyProject = (targetRoot: string, relativeConfig: string): void => {
  const projectDirectory = path.dirname(relativeConfig);
  const source = path.join(repositoryRoot, projectDirectory);
  const destination = path.join(targetRoot, projectDirectory);
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

const linkExternalNodeModules = (targetRoot: string, projectConfigs: string[]): void => {
  const sourceNodeModules = path.join(repositoryRoot, 'node_modules');
  const targetNodeModules = path.join(targetRoot, 'node_modules');
  mkdirSync(targetNodeModules, { recursive: true });

  for (const entry of readdirSync(sourceNodeModules)) {
    if (entry === '@lobsterai') continue;
    symlinkSync(path.join(sourceNodeModules, entry), path.join(targetNodeModules, entry));
  }

  const lobsteraiScope = path.join(targetNodeModules, '@lobsterai');
  mkdirSync(lobsteraiScope, { recursive: true });
  for (const relativeConfig of projectConfigs) {
    const projectDirectory = path.dirname(relativeConfig);
    const manifest = JSON.parse(
      readFileSync(path.join(targetRoot, projectDirectory, 'package.json'), 'utf8'),
    ) as { name?: string };
    const packageName = manifest.name?.replace(/^@lobsterai\//, '');
    if (!packageName || manifest.name === packageName) continue;
    symlinkSync(
      path.join(targetRoot, projectDirectory),
      path.join(lobsteraiScope, packageName),
      process.platform === 'win32' ? 'junction' : 'dir',
    );
  }
};

export const createWebWorkspaceBuildFixture = (): WebWorkspaceBuildFixture => {
  const root = mkdtempSync(path.join(tmpdir(), 'lobsterai-web-build-'));
  try {
    for (const rootFile of ['package.json', 'tsconfig.base.json']) {
      cpSync(path.join(repositoryRoot, rootFile), path.join(root, rootFile));
    }

    const projectConfigs = collectProjectReferenceClosure(webProjectConfig);
    projectConfigs.forEach((config) => copyProject(root, config));
    linkExternalNodeModules(root, projectConfigs);

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
