import { readFileSync } from 'node:fs';
import path from 'node:path';

import { describe, expect, test } from 'vitest';
import { parse as parseYaml } from 'yaml';

import * as Schemas from '../../libs/shared/contracts/src/index.schemas.js';
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
const parameterNames = (operationId: string, location: 'path' | 'query') => {
  for (const pathItem of Object.values(openapi.paths) as Array<Record<string, unknown>>) {
    for (const operation of Object.values(pathItem) as Array<Record<string, unknown>>) {
      if (operation.operationId !== operationId) continue;
      return (operation.parameters as Array<{ in: string; name: string }> ?? [])
        .filter((parameter) => parameter.in === location)
        .map((parameter) => parameter.name)
        .sort();
    }
  }
  throw new Error(`Missing OpenAPI operation ${operationId}`);
};

describe('Reviewer Round 3 parameter contract mutations', () => {
  test.each([
    ['get_api_v1_sessions', ['cursor', 'limit', 'pinned']],
    ['get_api_v1_sessions_id_messages', ['cursor', 'direction', 'limit']],
    ['get_api_v1_html_shares', ['clientSourceKey', 'source']],
    ['get_api_v1_scheduled_tasks_runs', ['cursor', 'limit', 'status']],
    ['get_api_v1_workspaces_wid_files_tree', ['cursor', 'depth', 'path', 'sort']],
    ['get_api_v1_workspaces_wid_files_download', ['as', 'path']],
  ])('emits %s query parameters', (operationId, expected) => {
    expect(parameterNames(operationId, 'query')).toEqual(expected);
  });

  test('keeps path, query, and body schemas separate in route metadata', () => {
    const entry = route('post_api_v1_sessions_id_permissions_requestId_respond') as unknown as {
      pathSchema?: unknown;
      querySchema?: unknown;
      bodySchema?: unknown;
    };
    expect(entry.pathSchema).toBeDefined();
    expect(entry.bodySchema).toBeDefined();
    expect(entry.querySchema).toBeUndefined();
    expect(parameterNames('post_api_v1_sessions_id_permissions_requestId_respond', 'path')).toEqual([
      'id',
      'requestId',
    ]);
  });
});

describe('Reviewer Round 3 authoritative error policy mutations', () => {
  test.each([
    ['get_api_v1_billing_account', ['INTERNAL_ERROR', 'PERMISSION_DENIED', 'RATE_LIMITED', 'UNAUTHENTICATED', 'VALIDATION_FAILED']],
    ['get_api_v1_workspaces_wid_files_stat', ['INTERNAL_ERROR', 'NOT_FOUND', 'PERMISSION_DENIED', 'RATE_LIMITED', 'UNAUTHENTICATED', 'VALIDATION_FAILED']],
    ['get_api_v1_scheduled_tasks', ['INTERNAL_ERROR', 'PERMISSION_DENIED', 'RATE_LIMITED', 'UNAUTHENTICATED', 'VALIDATION_FAILED']],
    ['post_oauth_token', ['INTERNAL_ERROR', 'RATE_LIMITED', 'UNAUTHENTICATED', 'VALIDATION_FAILED']],
  ])('matches independent %s errors', (operationId, expected) => {
    expect([...route(operationId).errors].sort()).toEqual(expected);
  });
});

describe('Reviewer Round 3 D11 auth mutations', () => {
  const passwordPkce = {
    email: 'user@example.com',
    password: 'password123',
    codeChallenge: 'c'.repeat(43),
    redirectUri: 'https://app.example/callback',
    state: 's'.repeat(16),
  };

  test('binds password login to PKCE, redirect URI, and CSRF state', () => {
    expect(Schemas.LoginRequest.safeParse(passwordPkce).success).toBe(true);
    expect(Schemas.LoginRequest.safeParse({ email: passwordPkce.email, password: passwordPkce.password }).success).toBe(false);
    for (const field of ['codeChallenge', 'redirectUri', 'state'] as const) {
      const invalid: Partial<typeof passwordPkce> = { ...passwordPkce };
      delete invalid[field];
      expect(Schemas.LoginRequest.safeParse(invalid).success, field).toBe(false);
    }
  });

  test('keeps browser refresh empty and mobile refresh in a discriminated OAuth grant', () => {
    expect(Schemas.RefreshRequest.safeParse({}).success).toBe(true);
    expect(Schemas.RefreshRequest.safeParse({ refreshToken: 'raw-mobile-token' }).success).toBe(false);
    expect(Schemas.OAuthTokenRequest.safeParse({
      grantType: 'refresh_token',
      refreshToken: 'raw-mobile-token',
    }).success).toBe(true);
  });
});

describe('Reviewer Round 3 canonical bridge-shape mutations', () => {
  test('uses Appendix A html share source values', () => {
    const schema = route('post_api_v1_html_shares').request;
    expect(schema.safeParse({ source: 'html', clientSourceKey: 'workspace:index.html' }).success).toBe(true);
    expect(schema.safeParse({ source: 'artifact', clientSourceKey: 'artifact:a' }).success).toBe(true);
    expect(schema.safeParse({ source: 'html-file', clientSourceKey: 'workspace:index.html' }).success).toBe(false);
  });

  test('preserves structured plugin configuration values', () => {
    expect(route('put_api_v1_plugins_id_config').request.safeParse({
      config: { enabled: true, retries: 3, nested: { x: 1 } },
    }).success).toBe(true);
  });

  test.each([
    { kind: 'at', at: '2026-07-12T09:00:00.000Z' },
    { kind: 'every', intervalMs: 60_000 },
    { kind: 'cron', expression: '0 9 * * *', timezone: 'Asia/Shanghai' },
  ])('accepts scheduled task schedule $kind', (schedule) => {
    expect(route('post_api_v1_scheduled_tasks').request.safeParse({
      name: 'task',
      schedule,
      enabled: true,
    }).success).toBe(true);
  });
});

describe('Reviewer Round 3 generated ticket uniqueness mutation', () => {
  test('emits array uniqueness into OpenAPI', () => {
    const schema = openapi.components.schemas.StreamTicketRequest;
    expect(schema.properties.sessions.uniqueItems).toBe(true);
    expect(schema.properties.resourceSubscriptions.uniqueItems).toBe(true);
    expect(schema['x-lobster-resource-uniqueness']).toBe('channel+workspaceId+path');
  });
});

describe('Reviewer Round 3 D12 derived account mutations', () => {
  const account = {
    creditsRemaining: 10,
    creditsLimit: 24,
    creditsUsed: 14,
    breakdown: {
      daily: { balance: 1, limit: 5 },
      monthly: { balance: 2, limit: 10 },
      granted: { balance: 3, total: 5 },
      topup: { balance: 4 },
    },
  };

  test('derives remaining, limit, and used from structured bucket breakdown', () => {
    expect(Schemas.BillingAccountResponse.safeParse(account).success).toBe(true);
    expect(Schemas.BillingAccountResponse.safeParse({
      ...account,
      creditsLimit: 1_000_000,
      creditsUsed: 999_990,
    }).success).toBe(false);
    expect(Schemas.BillingAccountResponse.safeParse({ ...account, creditsUsed: 13 }).success).toBe(false);
  });
});
