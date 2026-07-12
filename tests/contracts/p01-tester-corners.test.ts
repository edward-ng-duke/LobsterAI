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

import {
  StreamTicketRequestSchema,
  WsClientControlSchema,
} from '../../libs/shared/contracts/src/envelope.schema.js';
import * as Schemas from '../../libs/shared/contracts/src/index.schemas.js';
import { BridgeRegistry } from '../../libs/shared/contracts/src/registry/bridge.js';
import { ChannelRegistry } from '../../libs/shared/contracts/src/registry/channels.js';
import { IpcGaInventory } from '../../libs/shared/contracts/src/registry/ipc-ga-inventory.js';
import { RouteRegistry } from '../../libs/shared/contracts/src/registry/routes.js';

const repositoryRoot = path.resolve(import.meta.dirname, '../..');
const temporaryRoots: string[] = [];

const createCheckerCopy = (): string => {
  const root = mkdtempSync(path.join(tmpdir(), 'lobsterai-p01-tester-'));
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

const runNode = (
  args: string[],
  options: { cwd?: string; env?: NodeJS.ProcessEnv } = {},
) => spawnSync(process.execPath, args, {
  cwd: options.cwd ?? repositoryRoot,
  encoding: 'utf8',
  env: options.env ?? process.env,
  maxBuffer: 4 * 1024 * 1024,
});

afterEach(() => {
  temporaryRoots.splice(0).forEach((root) => rmSync(root, { recursive: true, force: true }));
});

describe('P01 Tester property and schema boundaries', () => {
  test('holds ticket uniqueness and cardinality for a deterministic generated corpus', () => {
    for (let size = 0; size <= 100; size += 7) {
      const sessions = Array.from({ length: size }, (_, index) => `session-${index}`);
      expect(StreamTicketRequestSchema.safeParse({ sessions }).success, `unique size=${size}`).toBe(true);
      if (sessions.length > 0) {
        const duplicate = [...sessions, sessions.at(-1)];
        expect(StreamTicketRequestSchema.safeParse({ sessions: duplicate }).success, `duplicate size=${size}`).toBe(false);
      }
    }
    expect(StreamTicketRequestSchema.safeParse({
      sessions: Array.from({ length: 101 }, (_, index) => `session-${index}`),
    }).success).toBe(false);
  });

  test('rejects non-finite and off-by-one numeric protocol boundaries', () => {
    for (const everyMs of [Number.NaN, Number.POSITIVE_INFINITY, 0, -1, 1.5]) {
      expect(Schemas.TaskSchedule.safeParse({ kind: 'every', everyMs }).success, String(everyMs)).toBe(false);
    }
    expect(Schemas.TaskSchedule.safeParse({ kind: 'every', everyMs: 1 }).success).toBe(true);
    expect(Schemas.TaskRunQuerySchema.safeParse({ limit: 0 }).success).toBe(false);
    expect(Schemas.TaskRunQuerySchema.safeParse({ limit: 1 }).success).toBe(true);
    expect(Schemas.TaskRunQuerySchema.safeParse({ limit: 100 }).success).toBe(true);
    expect(Schemas.TaskRunQuerySchema.safeParse({ limit: 101 }).success).toBe(false);
    expect(WsClientControlSchema.safeParse({ type: 'ping', ts: 1.5 }).success).toBe(false);
  });
});

describe('P01 Tester malicious formal route mutations', () => {
  test.each([
    ['/api/v1/runtime/../auth/login', 'dot segment'],
    ['/api/v1/runtime/%2e%2e/auth/login', 'encoded dot segment'],
    ['/api/v1//runtime/restart', 'repeated slash'],
  ])('rejects %s (%s)', (maliciousPath) => {
    const root = createCheckerCopy();
    const routesFile = path.join(root, 'libs/shared/contracts/dist/registry/routes.js');
    const original = readFileSync(routesFile, 'utf8');
    writeFileSync(
      routesFile,
      original.replace("'/api/v1/runtime/restart'", `'${maliciousPath}'`),
    );
    const result = runNode(['scripts/contracts/check.mjs', '--only', 'routes'], { cwd: root });
    expect(result.status, result.stdout + result.stderr).not.toBe(0);
  });
});

describe('P01 Tester codegen determinism and breaking baseline states', () => {
  test.each([
    ['UTC', 'C'],
    ['Asia/Shanghai', 'tr_TR.UTF-8'],
  ])('is byte-stable under TZ=%s and locale=%s', (timezone, locale) => {
    const result = runNode(['scripts/contracts/generate.mjs', '--check'], {
      env: {
        ...process.env,
        TZ: timezone,
        LANG: locale,
        LC_ALL: locale,
      },
    });
    expect(result.status, result.stdout + result.stderr).toBe(0);
  }, 30_000);

  test('blocks when the breaking base is absent', () => {
    const env = { ...process.env };
    delete env.CONTRACT_BASE_REF;
    const result = runNode(['scripts/contracts/breaking-diff.mjs'], { env });
    expect(result.status).toBe(2);
    expect(result.stderr).toContain('BLOCKED');
  });

  test('uses the frozen bootstrap for the valid pre-contract baseline', () => {
    const result = runNode(['scripts/contracts/breaking-diff.mjs'], {
      env: { ...process.env, CONTRACT_BASE_REF: 'cde584c0' },
    });
    expect(result.status, result.stdout + result.stderr).toBe(0);
    expect(result.stdout).toContain('"openapiBaseMode": "bootstrap"');
    expect(result.stdout).toContain('"asyncapiBaseMode": "bootstrap"');
  });
});

describe('P01 Tester bidirectional registry edges', () => {
  test('has exact inventory-to-bridge target sets with no duplicate edges', () => {
    const routeTargets = new Set(RouteRegistry.map((entry) => entry.operationId));
    const channelTargets = new Set(ChannelRegistry.map((entry) => entry.channelId));

    for (const row of IpcGaInventory) {
      expect(new Set(row.routeTargets).size, `${row.id}:route duplicate`).toBe(row.routeTargets.length);
      expect(new Set(row.channelTargets).size, `${row.id}:channel duplicate`).toBe(row.channelTargets.length);
      for (const target of row.routeTargets) expect(routeTargets.has(target), `${row.id}:${target}`).toBe(true);
      for (const target of row.channelTargets) expect(channelTargets.has(target), `${row.id}:${target}`).toBe(true);
    }

    for (const bridge of BridgeRegistry) {
      expect(new Set(bridge.targets).size, `${bridge.propertyPath}:duplicate`).toBe(bridge.targets.length);
      const expected = new Set(IpcGaInventory
        .filter((row) => row.bridgePaths.includes(bridge.propertyPath))
        .flatMap((row) => [...row.routeTargets, ...row.channelTargets]));
      expect(new Set(bridge.targets), bridge.propertyPath).toEqual(expected);
    }
  });
});
