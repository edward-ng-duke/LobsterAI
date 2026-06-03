import fs from 'fs';
import path from 'path';
import { afterEach, describe, expect, test, vi } from 'vitest';

const TEST_USER_DATA = `${process.cwd()}\\.test-computer-use-runtime`;

vi.mock('electron', () => ({
  app: {
    getAppPath: vi.fn(() => process.cwd()),
    getPath: vi.fn((name: string) => (name === 'userData' ? TEST_USER_DATA : '')),
    isPackaged: false,
  },
  session: {
    defaultSession: {
      fetch: vi.fn(),
    },
  },
}));

import { resolveComputerUseRuntimePaths, resolvePackageRoot } from './computerUseMcpServer';
import {
  ComputerUseRuntime,
  getComputerUseRuntimeRoot,
  inspectComputerUseRuntime,
} from './computerUseRuntime';

afterEach(() => {
  fs.rmSync(TEST_USER_DATA, { recursive: true, force: true });
  vi.unstubAllEnvs();
});

describe('resolvePackageRoot', () => {
  test('resolves the MCP SDK package root instead of its exported cjs package marker', () => {
    const root = resolvePackageRoot('@modelcontextprotocol/sdk');

    expect(root).toBeTruthy();
    expect(path.basename(root!)).toBe('sdk');
    expect(root).not.toContain(`${path.sep}dist${path.sep}cjs`);
  });
});

describe('resolveComputerUseRuntimePaths', () => {
  test('resolves the installed runtime from userData runtimes directory', () => {
    const rootDir = getComputerUseRuntimeRoot();
    const runtimePackageRoot = path.join(rootDir, 'node_modules', '@oai', 'sky');
    const helperExePath = path.join(runtimePackageRoot, 'bin', 'windows', 'lobster-computer-use.exe');
    const clientPath = path.join(
      runtimePackageRoot,
      'dist',
      'project',
      'cua',
      'sky_js',
      'src',
      'targets',
      'windows',
      'internal',
      'computer_use_client.js',
    );
    fs.mkdirSync(path.dirname(helperExePath), { recursive: true });
    fs.mkdirSync(path.dirname(clientPath), { recursive: true });
    fs.writeFileSync(path.join(rootDir, 'runtime.json'), `\uFEFF${JSON.stringify({
      arch: ComputerUseRuntime.Arch,
      id: ComputerUseRuntime.Id,
      platform: ComputerUseRuntime.Platform,
      version: ComputerUseRuntime.Version,
    })}`);
    fs.writeFileSync(helperExePath, '');
    fs.writeFileSync(clientPath, '');

    const inspection = inspectComputerUseRuntime();
    const paths = resolveComputerUseRuntimePaths();

    expect(inspection.missing).toEqual([]);
    expect(paths).toEqual({ helperExePath, rootDir, runtimePackageRoot });
  });
});
