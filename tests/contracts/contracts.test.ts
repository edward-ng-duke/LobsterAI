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
import { parse as parseYaml,stringify as stringifyYaml } from 'yaml';

import { analyzeBreakingDiff } from '../../scripts/contracts/breaking-diff.mjs';

const repositoryRoot = path.resolve(import.meta.dirname, '../..');
const temporaryRoots: string[] = [];

const createContractCopy = (): string => {
  const root = mkdtempSync(path.join(tmpdir(), 'lobsterai-p01-contracts-'));
  temporaryRoots.push(root);
  for (const relativePath of [
    'apps/api/src/generated',
    'apps/web/src/generated',
    'libs/client/bridge/src',
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

const runCheck = (root: string, check: string) =>
  spawnSync(process.execPath, ['scripts/contracts/check.mjs', '--only', check], {
    cwd: root,
    encoding: 'utf8',
  });

afterEach(() => {
  temporaryRoots.splice(0).forEach((root) => rmSync(root, { recursive: true, force: true }));
});
describe('P01 contract mutation gates', () => {
  test('detects an Appendix A GA row removed from the inventory denominator', () => {
    const root = createContractCopy();
    const inventory = path.join(root, 'libs/shared/contracts/dist/registry/ipc-ga-inventory.js');
    writeFileSync(
      inventory,
      readFileSync(inventory, 'utf8').replace(/^\s*\{ "id": "A-099".*\n/m, ''),
    );
    const result = runCheck(root, 'appendix-a-coverage');
    expect(result.status, result.stdout + result.stderr).not.toBe(0);
    expect(result.stderr).toContain('denominator mismatch');
  });

  test('detects a missing goal message in AsyncAPI', () => {
    const root = createContractCopy();
    const file = path.join(root, 'libs/shared/contracts/asyncapi.yaml');
    const document = parseYaml(readFileSync(file, 'utf8'));
    delete document.components.messages.goal;
    writeFileSync(file, stringifyYaml(document));
    const result = runCheck(root, 'cowork-stream');
    expect(result.status, result.stdout + result.stderr).not.toBe(0);
    expect(result.stderr).toContain('AsyncAPI messages');
  });

  test('detects a formal colon-action path', () => {
    const root = createContractCopy();
    const file = path.join(root, 'libs/shared/contracts/dist/registry/routes.js');
    writeFileSync(
      file,
      readFileSync(file, 'utf8').replace("'/api/v1/runtime/restart'", "'/api/v1/runtime:restart'"),
    );
    const result = runCheck(root, 'routes');
    expect(result.status, result.stdout + result.stderr).not.toBe(0);
    expect(result.stderr).toContain('colon parameter/action');
  });

  test(
    'detects a hand-edited generated consumer',
    () => {
      const root = createContractCopy();
      const file = path.join(root, 'apps/web/src/generated/api-client.ts');
      writeFileSync(file, `${readFileSync(file, 'utf8')}\n// hand edit\n`);
      const result = runCheck(root, 'generated-consumers');
      expect(result.status, result.stdout + result.stderr).not.toBe(0);
      expect(result.stderr).toContain('stale or edited');
    },
    15_000,
  );

  test('reports a missing breaking base ref as BLOCKED rather than PASS', () => {
    const result = spawnSync(process.execPath, ['scripts/contracts/breaking-diff.mjs'], {
      cwd: repositoryRoot,
      encoding: 'utf8',
      env: { ...process.env, CONTRACT_BASE_REF: 'refs/heads/definitely-missing-p01-base' },
    });
    expect(result.status).toBe(2);
    expect(result.stderr).toContain('BLOCKED');
  });
});

describe('P01 breaking classification', () => {
  const baseOpenapi = {
    paths: { '/api/v1/example': { get: {} } },
    components: {
      schemas: {
        Example: {
          type: 'object',
          required: ['id'],
          properties: { id: { type: 'string' }, state: { type: 'string', enum: ['a', 'b'] } },
        },
        ErrorEnvelope: {
          properties: { error: { properties: { code: { enum: ['NOT_FOUND', 'INTERNAL_ERROR'] } } } },
        },
      },
    },
  };
  const baseAsyncapi = { components: { messages: { message: {}, goal: {} } } };

  test('allows additive optional fields and enum values', () => {
    const current = structuredClone(baseOpenapi);
    current.components.schemas.Example.properties.optional = { type: 'string' };
    current.components.schemas.Example.properties.state.enum.push('c');
    expect(analyzeBreakingDiff(baseOpenapi, current, baseAsyncapi, baseAsyncapi)).toEqual([]);
  });

  test('flags removed fields, narrowed enums, new required fields, errors, events, and routes', () => {
    const current = structuredClone(baseOpenapi);
    current.paths = {};
    delete current.components.schemas.Example.properties.id;
    current.components.schemas.Example.required.push('state');
    current.components.schemas.Example.properties.state.enum = ['a'];
    current.components.schemas.ErrorEnvelope.properties.error.properties.code.enum = ['NOT_FOUND'];
    const currentAsyncapi = { components: { messages: { message: {} } } };
    const breaking = analyzeBreakingDiff(baseOpenapi, current, baseAsyncapi, currentAsyncapi);
    expect(breaking).toEqual(expect.arrayContaining([
      expect.stringContaining('removed operation'),
      expect.stringContaining('removed field'),
      expect.stringContaining('new required field'),
      expect.stringContaining('narrowed enum'),
      expect.stringContaining('removed error code'),
      expect.stringContaining('removed event'),
    ]));
  });
});
