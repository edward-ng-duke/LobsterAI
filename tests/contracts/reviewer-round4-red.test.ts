import { readFileSync } from 'node:fs';
import path from 'node:path';

import { describe, expect, test } from 'vitest';
import { parse as parseYaml } from 'yaml';

import { ErrorRegistry } from '../../libs/shared/contracts/src/errors.js';
import { RoutePolicyExpectations } from '../../libs/shared/contracts/src/registry/route-policy-expectations.js';
import { RouteRegistry } from '../../libs/shared/contracts/src/registry/routes.js';

const repositoryRoot = path.resolve(import.meta.dirname, '../..');
const openapi = parseYaml(
  readFileSync(path.join(repositoryRoot, 'libs/shared/contracts/openapi.yaml'), 'utf8'),
);

const route = (operationId: string) => {
  const entry = RouteRegistry.find((candidate) => candidate.operationId === operationId);
  if (!entry) throw new Error(`Missing route ${operationId}`);
  return entry;
};

const queryNames = (operationId: string): string[] => {
  for (const pathItem of Object.values(openapi.paths) as Array<Record<string, unknown>>) {
    for (const operation of Object.values(pathItem) as Array<Record<string, unknown>>) {
      if (operation.operationId !== operationId) continue;
      return (operation.parameters as Array<{ in: string; name: string }> ?? [])
        .filter((parameter) => parameter.in === 'query')
        .map((parameter) => parameter.name)
        .sort();
    }
  }
  throw new Error(`Missing OpenAPI operation ${operationId}`);
};

describe('Reviewer Round 4 scheduled-run query mutations', () => {
  test.each([
    'get_api_v1_scheduled_tasks_id_runs',
    'get_api_v1_scheduled_tasks_runs',
  ])('freezes all authoritative query fields for %s', (operationId) => {
    expect(queryNames(operationId)).toEqual(['cursor', 'endDate', 'limit', 'startDate', 'status']);
    expect(route(operationId).querySchema).toBeDefined();
  });
});

describe('Reviewer Round 4 canonical schedule mutations', () => {
  const request = route('post_api_v1_scheduled_tasks').request;

  test.each([
    { kind: 'at', at: '2026-07-12T09:00:00.000Z' },
    { kind: 'every', everyMs: 60_000 },
    { kind: 'every', everyMs: 60_000, anchorMs: 0 },
    { kind: 'cron', expr: '0 9 * * *' },
    { kind: 'cron', expr: '0 9 * * *', tz: 'Asia/Shanghai', staggerMs: 1_000 },
  ])('accepts the real bridge schedule $kind', (schedule) => {
    expect(request.safeParse({ name: 'task', schedule, enabled: true }).success).toBe(true);
  });

  test.each([
    { kind: 'every', intervalMs: 60_000 },
    { kind: 'cron', expression: '0 9 * * *', timezone: 'Asia/Shanghai' },
  ])('rejects invented schedule fields for $kind', (schedule) => {
    expect(request.safeParse({ name: 'task', schedule, enabled: true }).success).toBe(false);
  });
});

describe('Reviewer Round 4 complete independent error policy mutations', () => {
  test('covers all 158 operations bidirectionally with exact error sets', () => {
    const routeIds = RouteRegistry.map((entry) => entry.operationId).sort();
    const expectationIds = Object.keys(RoutePolicyExpectations).sort();
    expect(expectationIds).toEqual(routeIds);

    for (const entry of RouteRegistry) {
      const expectation = RoutePolicyExpectations[entry.operationId as keyof typeof RoutePolicyExpectations];
      expect(expectation, entry.operationId).toBeDefined();
      expect([...entry.errors].sort(), entry.operationId).toEqual([...expectation.errors].sort());

      const removed = expectation.errors.slice(1);
      expect([...removed].sort(), `${entry.operationId}:removed`).not.toEqual([...expectation.errors].sort());
      const added = Object.keys(ErrorRegistry).find((code) => !expectation.errors.includes(code as never));
      if (added) {
        expect([...expectation.errors, added].sort(), `${entry.operationId}:added`).not.toEqual(
          [...expectation.errors].sort(),
        );
      }
    }
  });

  test('removes read/delete quota and write-only errors across the registry', () => {
    const impossible = new Set([
      'QUOTA_EXCEEDED',
      'TASK_LIMIT_EXCEEDED',
      'PAYLOAD_TOO_LARGE',
      'STORAGE_QUOTA_EXCEEDED',
    ]);
    expect(RouteRegistry.filter(
      (entry) => ['GET', 'DELETE'].includes(entry.method) && entry.errors.some((code) => impossible.has(code)),
    ).map((entry) => entry.operationId)).toEqual([]);
  });

  test('freezes the task stop cancellation errors and excludes limit/session errors', () => {
    const errors = route('post_api_v1_scheduled_tasks_id_stop').errors;
    expect(errors).toEqual(expect.arrayContaining([
      'NO_RUNNING_TASK_RUN',
      'CANCEL_NOT_OWNED',
      'CANCEL_FAILED',
    ]));
    expect(errors).not.toEqual(expect.arrayContaining([
      'TASK_LIMIT_EXCEEDED',
      'SESSION_BUSY',
      'IN_PROGRESS',
    ]));
  });
});
