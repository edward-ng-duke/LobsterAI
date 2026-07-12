import { spawn, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import {
  cpSync,
  existsSync,
  lstatSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  readlinkSync,
  realpathSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

import { afterEach, describe, expect, test } from 'vitest';

import {
  createWebWorkspaceBuildFixture,
  type WebWorkspaceBuildFixture,
} from './helpers/web-workspace-build-fixture';

const repositoryRoot = path.resolve(import.meta.dirname, '..');
const fixturePrefix = 'lobsterai-web-build-';
const temporaryRoots: string[] = [];

interface FixtureModule {
  createWebWorkspaceBuildFixture: () => WebWorkspaceBuildFixture;
}

const writeJson = (filePath: string, value: unknown): void => {
  mkdirSync(path.dirname(filePath), { recursive: true });
  writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
};

const createRepository = (): string => {
  const sourceRoot = mkdtempSync(path.join(tmpdir(), 'lobsterai-b00-3c-fixture-source-'));
  temporaryRoots.push(sourceRoot);
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
  name: string,
  references: unknown = [],
): void => {
  writeJson(path.join(root, relativeDirectory, 'tsconfig.json'), { references });
  writeJson(path.join(root, relativeDirectory, 'package.json'), { name });
  writeFileSync(path.join(root, relativeDirectory, 'index.ts'), 'export {};\n');
};

const loadFixtureModule = async (root: string): Promise<FixtureModule> =>
  import(pathToFileURL(path.join(root, 'tests/helpers/web-workspace-build-fixture.ts')).href) as Promise<FixtureModule>;

const fixtureTemporaryDirectory = (root: string): string => {
  const directory = path.join(path.dirname(root), 'fixture-tmp');
  mkdirSync(directory);
  return directory;
};

const listFixtureRoots = (directory: string): string[] =>
  readdirSync(directory)
    .filter((entry) => entry.startsWith(fixturePrefix))
    .map((entry) => path.join(directory, entry))
    .sort();

const withTemporaryDirectory = <T>(directory: string, run: () => T): T => {
  const original = process.env.TMPDIR;
  process.env.TMPDIR = directory;
  try {
    return run();
  } finally {
    if (original === undefined) delete process.env.TMPDIR;
    else process.env.TMPDIR = original;
  }
};

const createWithFailureCapture = (
  module: FixtureModule,
  temporaryDirectory: string,
): { failure: unknown; fixture: WebWorkspaceBuildFixture | undefined } => {
  let failure: unknown;
  let fixture: WebWorkspaceBuildFixture | undefined;
  try {
    fixture = withTemporaryDirectory(temporaryDirectory, module.createWebWorkspaceBuildFixture);
  } catch (error) {
    failure = error;
  }
  return { failure, fixture };
};

const snapshotPath = (absolutePath: string): string[] => {
  if (!existsSync(absolutePath)) return ['ABSENT'];
  const entries: string[] = [];
  const visit = (candidate: string): void => {
    const relative = path.relative(absolutePath, candidate) || '.';
    const stat = lstatSync(candidate);
    if (stat.isSymbolicLink()) {
      entries.push(`${relative}:link:${readlinkSync(candidate)}`);
      return;
    }
    if (stat.isDirectory()) {
      entries.push(`${relative}:directory`);
      readdirSync(candidate).sort().forEach((entry) => visit(path.join(candidate, entry)));
      return;
    }
    const digest = createHash('sha256').update(readFileSync(candidate)).digest('hex');
    entries.push(`${relative}:file:${stat.mode}:${stat.size}:${digest}`);
  };
  visit(absolutePath);
  return entries;
};

const authoritativeOutputPaths = [
  'apps/web/dist',
  'apps/web/dist-types',
  'apps/web/tsconfig.tsbuildinfo',
  'libs/client/bridge/dist',
  'libs/client/bridge/tsconfig.tsbuildinfo',
  'libs/shared/contracts/dist',
  'libs/shared/contracts/tsconfig.tsbuildinfo',
  'libs/shared/types/dist',
  'libs/shared/types/tsconfig.tsbuildinfo',
];

const snapshotAuthoritativeOutputs = (): Record<string, string[]> =>
  Object.fromEntries(
    authoritativeOutputPaths.map((relativePath) => [
      relativePath,
      snapshotPath(path.join(repositoryRoot, relativePath)),
    ]),
  );

const runWebBuild = async (fixture: WebWorkspaceBuildFixture): Promise<{ output: string; status: number | null }> =>
  new Promise((resolve, reject) => {
    const child = spawn('npm', ['run', 'build', '--workspace', '@lobsterai/web'], {
      cwd: fixture.root,
      env: process.env,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let output = '';
    child.stdout.on('data', (chunk) => { output += String(chunk); });
    child.stderr.on('data', (chunk) => { output += String(chunk); });
    child.on('error', reject);
    child.on('close', (status) => resolve({ output, status }));
  });

afterEach(() => {
  temporaryRoots.splice(0).forEach((root) => rmSync(root, { recursive: true, force: true }));
});

describe('B00-3C independent Web fixture parser boundaries', () => {
  test('rejects malformed project JSON before creating a fixture root', async () => {
    const root = createRepository();
    const temporaryDirectory = fixtureTemporaryDirectory(root);
    writeProject(root, 'apps/web', '@lobsterai/web');
    writeFileSync(path.join(root, 'apps/web/tsconfig.json'), '{ invalid json');
    const module = await loadFixtureModule(root);
    const before = listFixtureRoots(temporaryDirectory);

    const result = createWithFailureCapture(module, temporaryDirectory);
    result.fixture?.cleanup();

    expect(result.failure).toBeDefined();
    expect(listFixtureRoots(temporaryDirectory)).toEqual(before);
  });

  test('accepts a minimal project without extends while preserving an empty reference closure', async () => {
    const root = createRepository();
    const temporaryDirectory = fixtureTemporaryDirectory(root);
    writeProject(root, 'apps/web', '@lobsterai/web');
    const module = await loadFixtureModule(root);
    const fixture = withTemporaryDirectory(temporaryDirectory, module.createWebWorkspaceBuildFixture);

    try {
      expect(existsSync(path.join(fixture.root, 'apps/web/tsconfig.json'))).toBe(true);
      expect(existsSync(path.join(fixture.root, 'apps/web/index.ts'))).toBe(true);
    } finally {
      fixture.cleanup();
      fixture.cleanup();
    }
    expect(listFixtureRoots(temporaryDirectory)).toEqual([]);
  });

  test.each([
    ['object', { path: '../../libs/dep' }],
    ['missing path', [{}]],
    ['numeric path', [{ path: 42 }]],
    ['empty path', [{ path: '' }]],
  ])('rejects a malformed %s project-reference shape without residue', async (_name, references) => {
    const root = createRepository();
    const temporaryDirectory = fixtureTemporaryDirectory(root);
    writeProject(root, 'apps/web', '@lobsterai/web', references);
    const module = await loadFixtureModule(root);

    const result = createWithFailureCapture(module, temporaryDirectory);
    result.fixture?.cleanup();

    expect(result.failure).toBeDefined();
    expect(listFixtureRoots(temporaryDirectory)).toEqual([]);
  });

  test('materializes relative and absolute aliases as isolated copies with one stable package link', async () => {
    const root = createRepository();
    const temporaryDirectory = fixtureTemporaryDirectory(root);
    writeProject(root, 'libs/real', '@lobsterai/real');
    symlinkSync('real', path.join(root, 'libs/alias-a'), 'dir');
    symlinkSync('real', path.join(root, 'libs/alias-b'), 'dir');
    writeProject(root, 'apps/web', '@lobsterai/web', [
      { path: '../../libs/alias-b' },
      { path: path.join(root, 'libs/alias-a/tsconfig.json') },
    ]);
    const module = await loadFixtureModule(root);
    const fixture = withTemporaryDirectory(temporaryDirectory, module.createWebWorkspaceBuildFixture);

    try {
      const aliasA = path.join(fixture.root, 'libs/alias-a');
      const aliasB = path.join(fixture.root, 'libs/alias-b');
      writeFileSync(path.join(aliasA, 'only-a.txt'), 'a\n');
      expect(lstatSync(aliasA).isSymbolicLink()).toBe(false);
      expect(lstatSync(aliasB).isSymbolicLink()).toBe(false);
      expect(existsSync(path.join(aliasB, 'only-a.txt'))).toBe(false);
      expect(existsSync(path.join(root, 'libs/real/only-a.txt'))).toBe(false);
      expect(realpathSync(path.join(fixture.root, 'node_modules/@lobsterai/real'))).toBe(realpathSync(aliasA));
    } finally {
      fixture.cleanup();
    }
    expect(listFixtureRoots(temporaryDirectory)).toEqual([]);
  });

  test('cleans a partially constructed fixture after duplicate package names make dependency linking fail', async () => {
    const root = createRepository();
    const temporaryDirectory = fixtureTemporaryDirectory(root);
    writeProject(root, 'apps/web', '@lobsterai/web', [
      { path: '../../libs/one' },
      { path: '../../libs/two' },
    ]);
    writeProject(root, 'libs/one', '@lobsterai/duplicate');
    writeProject(root, 'libs/two', '@lobsterai/duplicate');
    const module = await loadFixtureModule(root);

    const result = createWithFailureCapture(module, temporaryDirectory);
    result.fixture?.cleanup();

    expect(String(result.failure)).toMatch(/exist|link|duplicate/i);
    expect(listFixtureRoots(temporaryDirectory)).toEqual([]);
  });

  test.skipIf(process.platform !== 'linux')(
    'cleans a partially constructed fixture when copying a FIFO fails',
    async () => {
      const root = createRepository();
      const temporaryDirectory = fixtureTemporaryDirectory(root);
      writeProject(root, 'apps/web', '@lobsterai/web');
      const fifo = path.join(root, 'apps/web/unsupported.pipe');
      const mkfifo = spawnSync('mkfifo', [fifo], { encoding: 'utf8' });
      expect(mkfifo.status, mkfifo.stderr).toBe(0);
      const module = await loadFixtureModule(root);

      const result = createWithFailureCapture(module, temporaryDirectory);
      result.fixture?.cleanup();

      expect(String(result.failure)).toMatch(/fifo|pipe|copy|operation|internal assertion|unreachable/i);
      expect(listFixtureRoots(temporaryDirectory)).toEqual([]);
    },
  );

  test('does not copy excluded output symlinks but still rejects nested source symlinks', async () => {
    const root = createRepository();
    const temporaryDirectory = fixtureTemporaryDirectory(root);
    writeProject(root, 'apps/web', '@lobsterai/web');
    mkdirSync(path.join(root, 'apps/web/dist'), { recursive: true });
    symlinkSync('../index.ts', path.join(root, 'apps/web/dist/excluded-link.ts'));
    const module = await loadFixtureModule(root);
    const first = withTemporaryDirectory(temporaryDirectory, module.createWebWorkspaceBuildFixture);
    try {
      expect(existsSync(path.join(first.root, 'apps/web/dist'))).toBe(false);
    } finally {
      first.cleanup();
    }

    symlinkSync('index.ts', path.join(root, 'apps/web/nested-link.ts'));
    const second = createWithFailureCapture(module, temporaryDirectory);
    second.fixture?.cleanup();

    expect(String(second.failure)).toMatch(/symlink|symbolic/i);
    expect(listFixtureRoots(temporaryDirectory)).toEqual([]);
  });
});

describe('B00-3C independent Web fixture execution isolation', () => {
  test('supports concurrent builds and a second build without changing authoritative checkout outputs', async () => {
    const beforeOutputs = snapshotAuthoritativeOutputs();
    const beforeFixtureRoots = readdirSync(tmpdir()).filter((entry) => entry.startsWith(fixturePrefix)).sort();
    const first = createWebWorkspaceBuildFixture();
    const second = createWebWorkspaceBuildFixture();

    try {
      const [firstBuild, secondBuild] = await Promise.all([runWebBuild(first), runWebBuild(second)]);
      expect(firstBuild.status, firstBuild.output).toBe(0);
      expect(secondBuild.status, secondBuild.output).toBe(0);
      expect(existsSync(first.resolveWebDist('index.html'))).toBe(true);
      expect(existsSync(second.resolveWebDist('index.html'))).toBe(true);

      const repeated = spawnSync('npm', ['run', 'build', '--workspace', '@lobsterai/web'], {
        cwd: first.root,
        encoding: 'utf8',
      });
      expect(repeated.status, `${repeated.stdout}\n${repeated.stderr}`).toBe(0);
      expect(snapshotAuthoritativeOutputs()).toEqual(beforeOutputs);
    } finally {
      first.cleanup();
      first.cleanup();
      second.cleanup();
      second.cleanup();
    }

    expect(snapshotAuthoritativeOutputs()).toEqual(beforeOutputs);
    expect(readdirSync(tmpdir()).filter((entry) => entry.startsWith(fixturePrefix)).sort()).toEqual(
      beforeFixtureRoots,
    );
  }, 60_000);
});
