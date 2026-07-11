import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
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
import { parse as parseYaml } from 'yaml';

const repositoryRoot = path.resolve(import.meta.dirname, '../..');
const temporaryRoots: string[] = [];

const runNode = (
  args: string[],
  options: { cwd?: string; env?: NodeJS.ProcessEnv } = {},
) => spawnSync(process.execPath, args, {
  cwd: options.cwd ?? repositoryRoot,
  encoding: 'utf8',
  env: options.env ?? process.env,
  maxBuffer: 4 * 1024 * 1024,
});

const runBreakingDiff = (baseRef: string) => runNode(
  ['scripts/contracts/breaking-diff.mjs'],
  { env: { ...process.env, CONTRACT_BASE_REF: baseRef } },
);

const createCheckerCopy = (): string => {
  const root = mkdtempSync(path.join(tmpdir(), 'lobsterai-p01-tester-round2-'));
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

describe('P01 Tester Round 2 formal grammar boundaries', () => {
  test('rejects non-first well-known, Unicode whitespace, punctuation, and invalid parameters', () => {
    const maliciousPaths = [
      '/api/v1/runtime/.well-known',
      '/api/v1/runtime/restart\u00a0',
      '/api/v1/runtime/restart.',
      '/api/v1/runtime/re_start',
      '/api/v1/runtime/{1id}',
      '/api/v1/runtime/{}',
      '/api/v1/runtime/{id_}',
      '/api/v1/runtime/{ id}',
    ];
    const root = createCheckerCopy();
    const routesFile = path.join(root, 'libs/shared/contracts/dist/registry/routes.js');
    const original = readFileSync(routesFile, 'utf8');

    for (const maliciousPath of maliciousPaths) {
      writeFileSync(
        routesFile,
        original.replace("'/api/v1/runtime/restart'", `'${maliciousPath}'`),
      );
      const result = runNode(['scripts/contracts/check.mjs', '--only', 'routes'], { cwd: root });
      expect(result.status, `${JSON.stringify(maliciousPath)}\n${result.stdout}${result.stderr}`).toBe(1);
      expect(result.stderr).toContain('non-canonical formal route');
    }
  }, 60_000);

  test('accepts legal kebab paths, the first-segment well-known exception, and the full registry', () => {
    const root = createCheckerCopy();
    const routesFile = path.join(root, 'libs/shared/contracts/dist/registry/routes.js');
    const original = readFileSync(routesFile, 'utf8');
    const legalMutations = [
      original.replace("'/api/v1/runtime/restart'", "'/api/v1/foo-1/bar-2'"),
      original.replace("'/.well-known/openid-configuration'", "'/.well-known/test-1'"),
    ];

    for (const mutation of legalMutations) {
      writeFileSync(routesFile, mutation);
      const result = runNode(['scripts/contracts/check.mjs', '--only', 'routes'], { cwd: root });
      expect(result.status, result.stdout + result.stderr).toBe(0);
    }

    const current = runNode(['scripts/contracts/check.mjs', '--only', 'routes']);
    expect(current.status, current.stdout + current.stderr).toBe(0);
  }, 30_000);
});

describe('P01 Tester Round 2 bootstrap and breaking states', () => {
  test('freezes the exact pre-contract allowlist and canonical empty artifacts', () => {
    const baselineRoot = path.join(repositoryRoot, 'libs/shared/contracts/baselines/bootstrap');
    const policy = JSON.parse(readFileSync(path.join(baselineRoot, 'policy.json'), 'utf8'));
    const openapiBytes = readFileSync(path.join(baselineRoot, 'pre-contract-openapi.yaml'));
    const asyncapiBytes = readFileSync(path.join(baselineRoot, 'pre-contract-asyncapi.yaml'));
    const openapi = parseYaml(openapiBytes.toString('utf8'));
    const asyncapi = parseYaml(asyncapiBytes.toString('utf8'));

    expect(policy.preContractRefs).toEqual(['cde584c0']);
    expect(policy.openapi).toBe('libs/shared/contracts/baselines/bootstrap/pre-contract-openapi.yaml');
    expect(policy.asyncapi).toBe('libs/shared/contracts/baselines/bootstrap/pre-contract-asyncapi.yaml');
    expect(createHash('sha256').update(openapiBytes).digest('hex'))
      .toBe('ca80c435e945146f50bc7a3cf5cd47644be9360cd14ecf4a94e26176cb782a68');
    expect(createHash('sha256').update(asyncapiBytes).digest('hex'))
      .toBe('aa0cb2259de6bb53050f093d52c6a48b154a9f9c88016b32a5cf7b24a122957b');
    expect(openapi).toMatchObject({ openapi: '3.1.0', paths: {}, components: { schemas: {} } });
    expect(asyncapi).toMatchObject({ asyncapi: '2.6.0', channels: {}, components: { messages: {} } });
  });

  test('uses bootstrap only for the allowlisted pre-contract commit', () => {
    const result = runBreakingDiff('cde584c0');
    expect(result.status, result.stdout + result.stderr).toBe(0);
    expect(JSON.parse(result.stdout)).toMatchObject({
      status: 'PASS',
      baseRef: 'cde584c0',
      openapiBaseMode: 'bootstrap',
      asyncapiBaseMode: 'bootstrap',
    });
  });

  test('blocks a valid but unallowlisted pre-contract ref without artifacts', () => {
    const result = runBreakingDiff('cde584c0^');
    expect(result.status).toBe(2);
    expect(JSON.parse(result.stderr)).toMatchObject({ status: 'BLOCKED' });
    expect(result.stderr).toContain('base contract unavailable');
  });

  test('blocks a nonexistent git ref instead of treating it as bootstrap or pass', () => {
    const result = runBreakingDiff('p01-tester-missing-ref');
    expect(result.status).toBe(2);
    expect(JSON.parse(result.stderr)).toMatchObject({ status: 'BLOCKED' });
    expect(result.stderr).toContain('base ref unavailable');
  });

  test('reports a real historical contract incompatibility as breaking', () => {
    const result = runBreakingDiff('53bb7553');
    expect(result.status).toBe(1);
    const report = JSON.parse(result.stderr);
    expect(report).toMatchObject({ status: 'BREAKING', baseRef: '53bb7553' });
    expect(report.breaking.length).toBeGreaterThan(0);
  });

  test('accepts a compatible real contract base in git mode', () => {
    const result = runBreakingDiff('7f4a1520');
    expect(result.status, result.stdout + result.stderr).toBe(0);
    expect(JSON.parse(result.stdout)).toMatchObject({
      status: 'PASS',
      baseRef: '7f4a1520',
      openapiBaseMode: 'git',
      asyncapiBaseMode: 'git',
    });
  });
});
