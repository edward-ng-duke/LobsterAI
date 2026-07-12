import { spawnSync } from 'node:child_process';
import {
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  utimesSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { afterEach, describe, expect, test } from 'vitest';

const repositoryRoot = path.resolve(import.meta.dirname, '..');
const temporaryRoots: string[] = [];

interface WorkspaceRegistry {
  schemaVersion: number;
  stage: string;
  workspaces: Record<
    string,
    {
      kind: string;
      planReference: string;
      build: string;
      typecheck: string;
      artifacts: string[];
    }
  >;
}

const createRepositoryCopy = (): string => {
  const target = mkdtempSync(path.join(tmpdir(), 'lobsterai-p00-artifacts-'));
  temporaryRoots.push(target);
  for (const relativePath of [
    '.github/workflows/saas-scaffold.yml',
    'apps',
    'charts',
    'docker',
    'docs/poc',
    'docs/supply-chain',
    'libs',
    'package-lock.json',
    'package.json',
    'prisma',
    'scripts',
    'tests',
    'tsconfig.base.json',
    'tsconfig.workspace.json',
  ]) {
    const source = path.join(repositoryRoot, relativePath);
    const destination = path.join(target, relativePath);
    mkdirSync(path.dirname(destination), { recursive: true });
    cpSync(source, destination, {
      recursive: true,
      filter: (candidate) => !/(?:^|\/)(?:dist|dist-types|node_modules)(?:\/|$)/.test(candidate),
    });
  }
  return target;
};

const readRegistry = (root: string): WorkspaceRegistry =>
  JSON.parse(readFileSync(path.join(root, 'scripts/saas-workspace-registry.json'), 'utf8')) as WorkspaceRegistry;

const writeRegistry = (root: string, registry: WorkspaceRegistry): void => {
  writeFileSync(
    path.join(root, 'scripts/saas-workspace-registry.json'),
    `${JSON.stringify(registry, null, 2)}\n`,
  );
};

const runScript = (root: string, relativePath: string) =>
  spawnSync(process.execPath, [relativePath], { cwd: root, encoding: 'utf8' });

const writeArtifact = (root: string, relativePath: string, modifiedAt = new Date()): void => {
  const absolutePath = path.join(root, relativePath);
  mkdirSync(path.dirname(absolutePath), { recursive: true });
  writeFileSync(absolutePath, 'generated artifact\n');
  utimesSync(absolutePath, modifiedAt, modifiedAt);
};

const expectedArtifacts = (workspace: string): string[] =>
  workspace === 'apps/web'
    ? [`${workspace}/dist/index.html`, `${workspace}/dist/assets/app.js`]
    : [`${workspace}/dist/index.js`, `${workspace}/dist/index.d.ts`];

afterEach(() => {
  temporaryRoots.splice(0).forEach((root) => rmSync(root, { recursive: true, force: true }));
});

describe('P00 build artifact authenticity', () => {
  test('rejects registry downgrade to pre-existing package.json inputs', () => {
    const root = createRepositoryCopy();
    const registry = readRegistry(root);
    for (const definition of Object.values(registry.workspaces)) definition.artifacts = ['package.json'];
    writeRegistry(root, registry);

    for (const workspace of Object.keys(registry.workspaces)) {
      rmSync(path.join(root, workspace, 'dist'), { recursive: true, force: true });
      rmSync(path.join(root, workspace, 'dist-types'), { recursive: true, force: true });
      rmSync(path.join(root, workspace, 'tsconfig.tsbuildinfo'), { force: true });
    }

    const checker = runScript(root, 'scripts/check-saas-scaffold.mjs');
    const validator = runScript(root, 'scripts/check-saas-build-artifacts.mjs');
    expect(checker.status).not.toBe(0);
    expect(checker.stderr).toContain('[SCAF-2]');
    expect(validator.status).not.toBe(0);
  });

  test.each([
    ['schemaVersion', (registry: WorkspaceRegistry) => (registry.schemaVersion = 0)],
    ['stage', (registry: WorkspaceRegistry) => (registry.stage = 'P99')],
    ['kind', (registry: WorkspaceRegistry) => (registry.workspaces['apps/api'].kind = 'library')],
    [
      'planReference',
      (registry: WorkspaceRegistry) => (registry.workspaces['apps/api'].planReference = 'README.md'),
    ],
  ])('rejects invalid registry %s', (_label, mutate) => {
    const root = createRepositoryCopy();
    const registry = readRegistry(root);
    mutate(registry);
    writeRegistry(root, registry);
    expect(runScript(root, 'scripts/check-saas-scaffold.mjs').status).not.toBe(0);
  });

  test('rejects missing and stale artifacts even when their paths are registered', () => {
    const missingRoot = createRepositoryCopy();
    expect(runScript(missingRoot, 'scripts/check-saas-build-artifacts.mjs').status).not.toBe(0);

    const staleRoot = createRepositoryCopy();
    const registry = readRegistry(staleRoot);
    for (const workspace of Object.keys(registry.workspaces)) {
      expectedArtifacts(workspace).forEach((artifact) =>
        writeArtifact(staleRoot, artifact, new Date('2000-01-01T00:00:00.000Z')),
      );
    }
    const reportDirectory = path.join(staleRoot, '.reports/saas-build');
    mkdirSync(reportDirectory, { recursive: true });
    writeFileSync(
      path.join(reportDirectory, 'build-start.json'),
      JSON.stringify({ invocationId: 'fresh-build', startedAtEpochMs: Date.now() }),
    );
    expect(runScript(staleRoot, 'scripts/check-saas-build-artifacts.mjs').status).not.toBe(0);
  });

  test('rejects a registered output that is not a regular file', () => {
    const root = createRepositoryCopy();
    const registry = readRegistry(root);
    expect(runScript(root, 'scripts/clean-saas-build.mjs').status).toBe(0);
    for (const workspace of Object.keys(registry.workspaces)) {
      expectedArtifacts(workspace).forEach((artifact) => writeArtifact(root, artifact));
    }
    const nonRegularOutput = path.join(root, 'apps/api/dist/index.js');
    rmSync(nonRegularOutput);
    mkdirSync(nonRegularOutput);

    expect(runScript(root, 'scripts/check-saas-build-artifacts.mjs').status).not.toBe(0);
  });

  test('clean build preflight removes outputs and incremental state together', () => {
    const root = createRepositoryCopy();
    const registry = readRegistry(root);
    for (const workspace of Object.keys(registry.workspaces)) {
      writeArtifact(root, `${workspace}/dist/index.js`);
      writeArtifact(root, `${workspace}/dist-types/index.js`);
      writeArtifact(root, `${workspace}/tsconfig.tsbuildinfo`);
    }

    const result = runScript(root, 'scripts/clean-saas-build.mjs');
    expect(result.status, `${result.stdout}\n${result.stderr}`).toBe(0);
    for (const workspace of Object.keys(registry.workspaces)) {
      expect(existsSync(path.join(root, workspace, 'dist'))).toBe(false);
      expect(existsSync(path.join(root, workspace, 'dist-types'))).toBe(false);
      expect(existsSync(path.join(root, workspace, 'tsconfig.tsbuildinfo'))).toBe(false);
    }
    expect(existsSync(path.join(root, '.reports/saas-build/build-start.json'))).toBe(true);
  });
});
