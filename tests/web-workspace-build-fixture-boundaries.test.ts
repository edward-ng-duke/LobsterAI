import {
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

import { afterEach, describe, expect, test } from 'vitest';

import type { WebWorkspaceBuildFixture } from './helpers/web-workspace-build-fixture';

const repositoryRoot = path.resolve(import.meta.dirname, '..');
const fixturePrefix = 'lobsterai-web-build-';
const temporaryPaths: string[] = [];

interface FixtureModule {
  createWebWorkspaceBuildFixture: () => WebWorkspaceBuildFixture;
}

const listFixtureRoots = (temporaryDirectory = tmpdir()): Set<string> =>
  new Set(
    readdirSync(temporaryDirectory)
      .filter((entry) => entry.startsWith(fixturePrefix))
      .map((entry) => path.join(temporaryDirectory, entry)),
  );

const writeJson = (filePath: string, value: unknown): void => {
  mkdirSync(path.dirname(filePath), { recursive: true });
  writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
};

const createRepository = (): string => {
  const sourceRoot = mkdtempSync(path.join(tmpdir(), 'lobsterai-web-fixture-source-'));
  temporaryPaths.push(sourceRoot);
  const root = path.join(sourceRoot, 'repository');
  mkdirSync(path.join(root, 'tests/helpers'), { recursive: true });
  cpSync(
    path.join(repositoryRoot, 'tests/helpers/web-workspace-build-fixture.ts'),
    path.join(root, 'tests/helpers/web-workspace-build-fixture.ts'),
  );
  writeJson(path.join(root, 'package.json'), { private: true });
  writeJson(path.join(root, 'tsconfig.base.json'), { compilerOptions: {} });
  symlinkSync(
    path.join(repositoryRoot, 'node_modules'),
    path.join(root, 'node_modules'),
    process.platform === 'win32' ? 'junction' : 'dir',
  );
  return root;
};

const writeProject = (
  root: string,
  relativeDirectory: string,
  name: string | undefined,
  references: string[] = [],
): void => {
  writeJson(path.join(root, relativeDirectory, 'tsconfig.json'), {
    references: references.map((reference) => ({ path: reference })),
  });
  writeFileSync(path.join(root, relativeDirectory, 'index.ts'), 'export {};\n');
  if (name) writeJson(path.join(root, relativeDirectory, 'package.json'), { name });
};

const loadFixtureModule = async (root: string): Promise<FixtureModule> =>
  import(pathToFileURL(path.join(root, 'tests/helpers/web-workspace-build-fixture.ts')).href) as Promise<FixtureModule>;

const fixtureTemporaryDirectory = (root: string): string => {
  const directory = path.join(path.dirname(root), 'fixture-tmp');
  mkdirSync(directory);
  return directory;
};

const withTemporaryDirectory = <T>(temporaryDirectory: string, run: () => T): T => {
  const original = process.env.TMPDIR;
  process.env.TMPDIR = temporaryDirectory;
  try {
    return run();
  } finally {
    if (original === undefined) delete process.env.TMPDIR;
    else process.env.TMPDIR = original;
  }
};

const expectNoNewFixtureRoots = (temporaryDirectory: string, before: Set<string>): void => {
  expect([...listFixtureRoots(temporaryDirectory)].filter((entry) => !before.has(entry))).toEqual([]);
};

afterEach(() => {
  temporaryPaths.splice(0).forEach((entry) => rmSync(entry, { recursive: true, force: true }));
});

describe('Web workspace build fixture boundaries', () => {
  test('rejects an out-of-repository reference without leaving an escaped copy', async () => {
    const root = createRepository();
    const externalName = `lobsterai-web-fixture-external-${path.basename(path.dirname(root))}`;
    const externalSource = path.join(path.dirname(root), externalName);
    const temporaryDirectory = fixtureTemporaryDirectory(root);
    const escapedDestination = path.join(temporaryDirectory, externalName);
    temporaryPaths.push(escapedDestination);
    writeProject(externalSource, '.', undefined);
    writeProject(root, 'apps/web', '@lobsterai/web', [`../../../${externalName}`]);
    const before = listFixtureRoots(temporaryDirectory);
    const fixtureModule = await loadFixtureModule(root);

    expect(() => withTemporaryDirectory(temporaryDirectory, fixtureModule.createWebWorkspaceBuildFixture)).toThrow();
    expect(existsSync(escapedDestination)).toBe(false);
    expectNoNewFixtureRoots(temporaryDirectory, before);
  });

  test('rejects a referenced project without a package manifest and removes its fixture', async () => {
    const root = createRepository();
    const temporaryDirectory = fixtureTemporaryDirectory(root);
    writeProject(root, 'apps/web', '@lobsterai/web', ['../../libs/missing-package']);
    writeProject(root, 'libs/missing-package', undefined);
    const before = listFixtureRoots(temporaryDirectory);
    const fixtureModule = await loadFixtureModule(root);

    expect(() =>
      withTemporaryDirectory(temporaryDirectory, fixtureModule.createWebWorkspaceBuildFixture),
    ).toThrow(/package\.json|manifest/i);
    expectNoNewFixtureRoots(temporaryDirectory, before);
  });

  test('collects a cyclic in-repository project-reference graph once', async () => {
    const root = createRepository();
    const temporaryDirectory = fixtureTemporaryDirectory(root);
    writeProject(root, 'apps/web', '@lobsterai/web', ['../../libs/cycle']);
    writeProject(root, 'libs/cycle', '@lobsterai/cycle', ['../../apps/web']);
    const before = listFixtureRoots(temporaryDirectory);
    const fixtureModule = await loadFixtureModule(root);

    const fixture = withTemporaryDirectory(temporaryDirectory, fixtureModule.createWebWorkspaceBuildFixture);
    try {
      expect(existsSync(path.join(fixture.root, 'apps/web/tsconfig.json'))).toBe(true);
      expect(existsSync(path.join(fixture.root, 'libs/cycle/tsconfig.json'))).toBe(true);
    } finally {
      fixture.cleanup();
      fixture.cleanup();
    }
    expectNoNewFixtureRoots(temporaryDirectory, before);
  });
});
