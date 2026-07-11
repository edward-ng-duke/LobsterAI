import { spawnSync } from 'node:child_process';
import {
  cpSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { afterEach, describe, expect, test } from 'vitest';

const repositoryRoot = path.resolve(import.meta.dirname, '../..');
const temporaryRoots: string[] = [];

const createCheckerCopy = (): string => {
  const root = mkdtempSync(path.join(tmpdir(), 'lobsterai-p01-reviewer-round7-'));
  temporaryRoots.push(root);
  for (const relativePath of [
    'libs/shared/contracts',
    'scripts/contracts',
    'src/renderer/types/electron.d.ts',
    '改造计划/附录A-IPC通道与接口映射.md',
  ]) {
    const source = path.join(repositoryRoot, relativePath);
    const destination = path.join(root, relativePath);
    mkdirSync(path.dirname(destination), { recursive: true });
    cpSync(source, destination, { recursive: true });
  }
  symlinkSync(path.join(repositoryRoot, 'node_modules'), path.join(root, 'node_modules'), 'dir');
  return root;
};

afterEach(() => {
  temporaryRoots.splice(0).forEach((root) => rmSync(root, { recursive: true, force: true }));
});

describe('Reviewer Round 7 formal route grammar mutations', () => {
  test('rejects every non-grammar static or parameter segment', () => {
    const maliciousPaths = [
      '/api/v1/runtime/ restart',
      '/api/v1/runtime/\trestart',
      '/api/v1/runtime/;restart',
      '/api/v1/runtime/@restart',
      '/api/v1/runtime/restart!',
      '/api/v1/runtime/re+start',
      '/api/v1/runtime/{id',
      '/api/v1/runtime/id}',
      '/api/v1/runtime/{id}{x}',
      '/api/v1/runtime/{../x}',
      '/api/v1/runtime/{_id}',
      '/api/v1/runtime/{id-name}',
      '/api/v1/runtime/运行',
      '/api/v1/runtime/Restart',
      '/api/v1/runtime/-restart',
      '/api/v1/runtime/restart-',
      '/api/v1/runtime/run--now',
    ];
    const root = createCheckerCopy();
    const routesFile = path.join(root, 'libs/shared/contracts/dist/registry/routes.js');
    const original = readFileSync(routesFile, 'utf8');

    for (const maliciousPath of maliciousPaths) {
      writeFileSync(
        routesFile,
        original.replace("'/api/v1/runtime/restart'", `'${maliciousPath}'`),
      );
      const result = spawnSync(process.execPath, ['scripts/contracts/check.mjs', '--only', 'routes'], {
        cwd: root,
        encoding: 'utf8',
      });
      expect(result.status, `${maliciousPath}\n${result.stdout}${result.stderr}`).not.toBe(0);
    }
  }, 60_000);

  test('accepts the existing static, well-known, and complete parameter grammar', () => {
    const result = spawnSync(process.execPath, ['scripts/contracts/check.mjs', '--only', 'routes'], {
      cwd: repositoryRoot,
      encoding: 'utf8',
    });
    expect(result.status, result.stdout + result.stderr).toBe(0);
  });
});
