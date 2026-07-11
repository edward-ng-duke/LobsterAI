import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';

import { afterEach, describe, expect, test } from 'vitest';
import { parse as parseYaml } from 'yaml';

import { BridgeRegistry } from '../../libs/shared/contracts/src/registry/bridge.js';
import { ChannelRegistry } from '../../libs/shared/contracts/src/registry/channels.js';
import { CoworkStreamRegistry } from '../../libs/shared/contracts/src/registry/cowork-stream.js';
import { IpcGaInventory } from '../../libs/shared/contracts/src/registry/ipc-ga-inventory.js';
import { RouteRegistry } from '../../libs/shared/contracts/src/registry/routes.js';
import { analyzeBreakingDiff } from '../../scripts/contracts/breaking-diff.mjs';

const repositoryRoot = path.resolve(import.meta.dirname, '../..');
const staleOutput = path.join(
  repositoryRoot,
  'libs/shared/contracts/generated/reviewer-round1-stale.tmp.ts',
);

afterEach(() => rmSync(staleOutput, { force: true }));

describe('Reviewer Round 1 route and schema mutations', () => {
  test('has no generic route DTOs, fake routes, unsecured protected routes, or fixed success statuses', () => {
    const openapi = parseYaml(
      readFileSync(path.join(repositoryRoot, 'libs/shared/contracts/openapi.yaml'), 'utf8'),
    );
    expect(RouteRegistry.filter((route) => route.requestName === 'GenericRequest')).toEqual([]);
    expect(RouteRegistry.filter((route) => route.responseName === 'GenericResponse')).toEqual([]);
    expect(
      RouteRegistry.filter((route) =>
        [
          'POST /api/v1/asr/sessions/{asrSessionId}/stream',
          'POST /api/v1/sessions/{id}',
          'POST /auth/callback',
        ].includes(`${route.method} ${route.path}`),
      ),
    ).toEqual([]);
    for (const route of RouteRegistry) {
      const operation = openapi.paths[route.path][route.method.toLowerCase()];
      expect(operation.responses[String(route.successStatus)]).toBeDefined();
      expect(operation.security ?? []).toEqual(
        route.auth === 'access-token'
          ? [{ accessToken: [] }]
          : route.auth === 'refresh-cookie'
            ? [{ refreshCookie: [] }]
            : [],
      );
    }
  });

  test('maps every GA inventory row through bridge and a real route or channel target', () => {
    const routeIds = new Set(RouteRegistry.map((route) => route.operationId));
    const channelIds = new Set(ChannelRegistry.map((event) => event.messageType));
    const bridgeTargets = new Set(
      BridgeRegistry.flatMap((entry) => entry.targets),
    );
    for (const row of IpcGaInventory) {
      expect(row.bridgePaths.length, row.id).toBeGreaterThan(0);
      for (const target of row.targets) {
        expect(routeIds.has(target) || channelIds.has(target), `${row.id}:${target}`).toBe(true);
        expect(bridgeTargets.has(target), `${row.id}:${target}`).toBe(true);
      }
    }
  });
});

describe('Reviewer Round 1 bridge and Cowork payload mutations', () => {
  test('preserves named bridge imports and gives every GA bridge leaf a target', () => {
    const generated = readFileSync(
      path.join(repositoryRoot, 'libs/client/bridge/src/electronBridge.ts'),
      'utf8',
    );
    expect(generated).not.toMatch(/^type .* = unknown;$/m);
    expect(BridgeRegistry.filter((entry) => entry.disposition === 'ga' && !entry.target)).toEqual([]);
    expect(new Set(BridgeRegistry.map((entry) => entry.propertyPath)).size).toBe(
      BridgeRegistry.length,
    );
  });

  test('accepts the real complete and error bridge payloads', () => {
    const complete = CoworkStreamRegistry.find((event) => event.wireType === 'complete');
    const error = CoworkStreamRegistry.find((event) => event.wireType === 'error');
    expect(complete?.schema.safeParse({ sessionId: 's', claudeSessionId: null }).success).toBe(
      true,
    );
    expect(error?.schema.safeParse({ sessionId: 's', error: 'oops' }).success).toBe(true);
  });
});

describe('Reviewer Round 1 recursive breaking mutations', () => {
  const baseOpenapi = {
    paths: {
      '/api/v1/example': {
        post: {
          security: [{ accessToken: [] }],
          requestBody: {
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Input' } } },
          },
          responses: {
            '202': {
              content: { 'application/json': { schema: { $ref: '#/components/schemas/Output' } } },
            },
          },
        },
      },
    },
    components: {
      schemas: {
        Input: {
          type: 'object',
          properties: {
            nested: {
              type: 'object',
              required: ['value'],
              properties: { value: { type: 'string' } },
            },
          },
        },
        Output: { type: 'object', properties: { ok: { type: 'boolean' } } },
        ErrorEnvelope: { type: 'object', properties: {} },
      },
    },
  };
  const asyncapi = { components: { messages: { complete: { payload: { type: 'object' } } } } };

  test.each([
    ['nested field deletion', (current: typeof baseOpenapi) => {
      delete current.components.schemas.Input.properties.nested.properties.value;
    }],
    ['nested type change', (current: typeof baseOpenapi) => {
      current.components.schemas.Input.properties.nested.type = 'string';
    }],
    ['response ref change', (current: typeof baseOpenapi) => {
      current.paths['/api/v1/example'].post.responses['202'].content['application/json'].schema.$ref =
        '#/components/schemas/ErrorEnvelope';
    }],
  ])('detects %s', (_name, mutate) => {
    const current = structuredClone(baseOpenapi);
    mutate(current);
    expect(analyzeBreakingDiff(baseOpenapi, current, asyncapi, asyncapi)).not.toEqual([]);
  });
});

describe('Reviewer Round 1 atomic generation mutations', () => {
  test('does not remove the published output before atomic replacement', () => {
    const source = readFileSync(
      path.join(repositoryRoot, 'scripts/contracts/generate.mjs'),
      'utf8',
    );
    expect(source).not.toMatch(/rmSync\(absolutePath[\s\S]*renameSync\(temporaryPath/);
  });

  test('rejects an extra stale file in a managed generated directory', () => {
    writeFileSync(staleOutput, '// stale managed output\n');
    const result = spawnSync(process.execPath, ['scripts/contracts/generate.mjs', '--check'], {
      cwd: repositoryRoot,
      encoding: 'utf8',
    });
    expect(result.status, result.stdout + result.stderr).not.toBe(0);
    expect(existsSync(staleOutput)).toBe(true);
  });

  test('keeps the published outputs intact when staging fails closed', () => {
    const publishedOutput = path.join(repositoryRoot, 'libs/shared/contracts/openapi.yaml');
    const before = readFileSync(publishedOutput, 'utf8');
    const result = spawnSync(process.execPath, ['scripts/contracts/generate.mjs'], {
      cwd: repositoryRoot,
      encoding: 'utf8',
      env: { ...process.env, CONTRACT_GENERATE_FAIL_AFTER_STAGE: '1' },
    });
    expect(result.status, result.stdout + result.stderr).not.toBe(0);
    expect(readFileSync(publishedOutput, 'utf8')).toBe(before);
  });
});
