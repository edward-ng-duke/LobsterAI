import { readFileSync } from 'node:fs';
import path from 'node:path';

import { describe, expect, test } from 'vitest';

import { RoutePolicyExpectations } from '../../libs/shared/contracts/src/registry/route-policy-expectations.js';
import { RouteRegistry } from '../../libs/shared/contracts/src/registry/routes.js';

const repositoryRoot = path.resolve(import.meta.dirname, '../..');
const policySource = readFileSync(
  path.join(repositoryRoot, 'libs/shared/contracts/src/registry/route-policy-expectations.ts'),
  'utf8',
);
const route = (operationId: string) => {
  const entry = RouteRegistry.find((candidate) => candidate.operationId === operationId);
  if (!entry) throw new Error(`Missing route ${operationId}`);
  return entry;
};

describe('Reviewer Round 5 explicit policy assignment mutations', () => {
  test('has no default or nullish policy fallback', () => {
    expect(policySource).not.toMatch(/\?\?\s*[A-Za-z_$]/);
    expect(policySource).not.toMatch(/default(?:Policy|Profile)/i);
    expect(Object.keys(RoutePolicyExpectations).sort()).toEqual(
      RouteRegistry.map((entry) => entry.operationId).sort(),
    );
  });

  test('removes item-only NOT_FOUND from every global or collection GET', () => {
    expect(RouteRegistry.filter(
      (entry) => entry.method === 'GET' && !entry.path.includes('{') && entry.errors.includes('NOT_FOUND'),
    ).map((entry) => entry.operationId)).toEqual([]);
  });

  test('removes VALIDATION_FAILED from routes with no path, query, or body input', () => {
    expect(RouteRegistry.filter((entry) => {
      const pathInput = Object.keys(entry.pathSchema.shape).length > 0;
      return !pathInput && !entry.querySchema && !entry.bodySchema && entry.errors.includes('VALIDATION_FAILED');
    }).map((entry) => entry.operationId)).toEqual([]);
  });

  test('preserves item existence semantics for parameterized resources', () => {
    const itemReads = RouteRegistry.filter(
      (entry) => entry.method === 'GET' && entry.path.includes('{'),
    );
    expect(itemReads.length).toBeGreaterThan(0);
    for (const entry of itemReads) expect(entry.errors, entry.operationId).toContain('NOT_FOUND');
  });
});

describe('Reviewer Round 5 semantic policy samples', () => {
  const tenantRead = ['RATE_LIMITED', 'INTERNAL_ERROR', 'UNAUTHENTICATED', 'PERMISSION_DENIED'];
  const itemRead = [...tenantRead, 'VALIDATION_FAILED', 'NOT_FOUND'];

  test.each([
    'get_api_v1_config_app_info',
    'get_api_v1_runtime_status',
    'get_api_v1_scheduled_tasks_channels',
  ])('uses no-input global/status policy for %s', (operationId) => {
    expect([...route(operationId).errors].sort()).toEqual([...tenantRead].sort());
  });

  test.each([
    'get_api_v1_agents',
    'get_api_v1_plugins',
    'get_api_v1_workspaces',
    'get_api_v1_scheduled_tasks_runs',
  ])('uses collection empty-list semantics for %s', (operationId) => {
    expect([...route(operationId).errors].sort()).toEqual([...tenantRead].sort());
  });

  test.each([
    'get_api_v1_agents_id',
    'get_api_v1_models_id',
    'get_api_v1_scheduled_tasks_id',
  ])('uses item existence policy for %s', (operationId) => {
    expect([...route(operationId).errors].sort()).toEqual([...itemRead].sort());
  });

  test('keeps domain-specific action errors explicit', () => {
    expect(route('post_api_v1_scheduled_tasks_id_stop').errors).toEqual(expect.arrayContaining([
      'NO_RUNNING_TASK_RUN',
      'CANCEL_NOT_OWNED',
      'CANCEL_FAILED',
    ]));
    expect(route('post_api_v1_model_proxy').errors).toContain('QUOTA_EXCEEDED');
    expect(route('post_api_v1_workspaces_wid_files_upload').errors).toEqual(expect.arrayContaining([
      'PAYLOAD_TOO_LARGE',
      'STORAGE_QUOTA_EXCEEDED',
    ]));
  });
});
