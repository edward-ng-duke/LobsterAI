import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import {
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  symlinkSync,
  utimesSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { afterEach, describe, expect, test } from 'vitest';

const repositoryRoot = path.resolve(import.meta.dirname, '..');
const temporaryRoots: string[] = [];

interface WorkspaceRegistry {
  workspaces: Record<string, { artifacts: string[] }>;
}

const createRepositoryCopy = (): string => {
  const target = mkdtempSync(path.join(tmpdir(), 'lobsterai-p00-tester-'));
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

const runNodeScript = (root: string, script: string, argument?: string) =>
  spawnSync(process.execPath, argument ? [script, argument] : [script], {
    cwd: root,
    encoding: 'utf8',
  });

const readRegistry = (root: string): WorkspaceRegistry =>
  JSON.parse(
    readFileSync(path.join(root, 'scripts/saas-workspace-registry.json'), 'utf8'),
  ) as WorkspaceRegistry;

const artifactPaths = (registry: WorkspaceRegistry): string[] =>
  Object.entries(registry.workspaces).flatMap(([workspace, definition]) =>
    definition.artifacts.map((artifact) =>
      artifact.endsWith('/*.js')
        ? `${workspace}/${artifact.slice(0, -4)}/tester.js`
        : `${workspace}/${artifact}`,
    ),
  );

const writeArtifacts = (root: string, paths: string[], modifiedAt = new Date()): void => {
  for (const relativePath of paths) {
    const absolutePath = path.join(root, relativePath);
    mkdirSync(path.dirname(absolutePath), { recursive: true });
    writeFileSync(absolutePath, `artifact:${relativePath}\n`);
    utimesSync(absolutePath, modifiedAt, modifiedAt);
  }
};

afterEach(() => {
  temporaryRoots.splice(0).forEach((root) => rmSync(root, { recursive: true, force: true }));
});

describe('P00 independent tester corner cases', () => {
  test.skipIf(process.platform === 'win32')(
    'rejects a registered artifact that is a symlink escaping the repository',
    () => {
      const root = createRepositoryCopy();
      const registry = readRegistry(root);
      expect(runNodeScript(root, 'scripts/clean-saas-build.mjs').status).toBe(0);
      writeArtifacts(root, artifactPaths(registry));

      const outsideRoot = mkdtempSync(path.join(tmpdir(), 'lobsterai-p00-outside-'));
      temporaryRoots.push(outsideRoot);
      const outsideArtifact = path.join(outsideRoot, 'index.js');
      writeFileSync(outsideArtifact, 'untrusted external artifact\n');
      const registeredArtifact = path.join(root, 'apps/api/dist/index.js');
      rmSync(registeredArtifact);
      symlinkSync(outsideArtifact, registeredArtifact);

      const result = runNodeScript(root, 'scripts/check-saas-build-artifacts.mjs');
      expect(result.status, `${result.stdout}\n${result.stderr}`).not.toBe(0);
    },
  );

  test('rejects artifacts dated materially in the future', () => {
    const root = createRepositoryCopy();
    const registry = readRegistry(root);
    expect(runNodeScript(root, 'scripts/clean-saas-build.mjs').status).toBe(0);
    writeArtifacts(root, artifactPaths(registry), new Date(Date.now() + 24 * 60 * 60 * 1_000));

    const result = runNodeScript(root, 'scripts/check-saas-build-artifacts.mjs');
    expect(result.status, `${result.stdout}\n${result.stderr}`).not.toBe(0);
  });

  test('rejects duplicate raw workspace keys instead of silently accepting the last value', () => {
    const root = createRepositoryCopy();
    const registryPath = path.join(root, 'scripts/saas-workspace-registry.json');
    const source = readFileSync(registryPath, 'utf8');
    const registry = JSON.parse(source) as WorkspaceRegistry;
    const duplicate = `\"apps/api\": ${JSON.stringify(registry.workspaces['apps/api'])},`;
    writeFileSync(registryPath, source.replace('"workspaces": {', `"workspaces": {${duplicate}`));

    const result = runNodeScript(root, 'scripts/check-saas-scaffold.mjs');
    expect(result.status, `${result.stdout}\n${result.stderr}`).not.toBe(0);
  });

  test('stage reports use a new nonce and leave no temporary report after replayed invocation', () => {
    const root = createRepositoryCopy();
    const gate = 'contracts:check';
    const reportDirectory = path.join(root, '.reports/saas-gates');
    const reportPath = path.join(reportDirectory, 'contracts-check.json');

    const first = runNodeScript(root, 'scripts/run-saas-stage-gate.mjs', gate);
    expect(first.status).toBe(78);
    const firstReport = JSON.parse(readFileSync(reportPath, 'utf8')) as { invocationId: string };
    const second = runNodeScript(root, 'scripts/run-saas-stage-gate.mjs', gate);
    expect(second.status).toBe(78);
    const secondReport = JSON.parse(readFileSync(reportPath, 'utf8')) as { invocationId: string };

    expect(secondReport.invocationId).not.toBe(firstReport.invocationId);
    expect(readdirSync(reportDirectory).filter((file) => file.endsWith('.tmp'))).toEqual([]);
  });

  test('Web production HTML references only assets present in the emitted bundle', () => {
    const webDist = path.join(repositoryRoot, 'apps/web/dist');
    rmSync(webDist, { recursive: true, force: true });
    const build = spawnSync('npm', ['run', 'build', '--workspace', '@lobsterai/web'], {
      cwd: repositoryRoot,
      encoding: 'utf8',
    });
    expect(build.status, `${build.stdout}\n${build.stderr}`).toBe(0);

    const html = readFileSync(path.join(webDist, 'index.html'), 'utf8');
    const references = [...html.matchAll(/(?:src|href)="([^"]+)"/g)].map((match) => match[1]);
    expect(references.length).toBeGreaterThan(0);
    for (const reference of references) {
      expect(reference).not.toMatch(/^(?:https?:|data:|\/src\/)/);
      const emittedPath = path.join(webDist, reference.replace(/^\//, ''));
      expect(existsSync(emittedPath), reference).toBe(true);
      expect(createHash('sha256').update(readFileSync(emittedPath)).digest('hex')).toMatch(/^[a-f0-9]{64}$/);
    }
  }, 30_000);
});
