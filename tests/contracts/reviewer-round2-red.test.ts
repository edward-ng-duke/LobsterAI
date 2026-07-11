import { describe, expect, test } from 'vitest';
import { z } from 'zod';

import { StreamTicketRequestSchema } from '../../libs/shared/contracts/src/envelope.schema.js';
import * as Schemas from '../../libs/shared/contracts/src/index.schemas.js';
import { RouteRegistry } from '../../libs/shared/contracts/src/registry/routes.js';

const schemaCatalog = Schemas as unknown as Record<
  string,
  { safeParse: (value: unknown) => { success: boolean } } | undefined
>;

const route = (operationId: string) => {
  const entry = RouteRegistry.find((candidate) => candidate.operationId === operationId);
  if (!entry) throw new Error(`Missing route ${operationId}`);
  return entry;
};

describe('Reviewer Round 2 field-level route mutations', () => {
  test('does not reuse operation placeholder schemas for any GA route', () => {
    expect(schemaCatalog.OperationRequest).toBeUndefined();
    expect(schemaCatalog.OperationResponse).toBeUndefined();
    expect(RouteRegistry.some((entry) => /Operation(Request|Response)/.test(
      `${entry.requestName}:${entry.responseName}`,
    ))).toBe(false);
    for (const entry of RouteRegistry) {
      const requestProperties = Object.keys(z.toJSONSchema(entry.request).properties ?? {}).sort();
      const responseProperties = Object.keys(z.toJSONSchema(entry.response).properties ?? {}).sort();
      expect(requestProperties, entry.operationId).not.toEqual(['idempotencyKey', 'input']);
      expect(responseProperties, entry.operationId).not.toEqual(['data', 'success']);
    }
  });

  test('accepts canonical domain payloads and list response shapes', () => {
    expect(route('post_api_v1_html_shares').request.safeParse({
      source: 'html',
      clientSourceKey: 'workspace:index.html',
    }).success).toBe(true);
    expect(route('post_api_v1_billing_byok').request.safeParse({
      provider: 'openai',
      secret: 'secret-ref',
    }).success).toBe(true);
    expect(route('get_api_v1_agents').response.safeParse({ agents: [] }).success).toBe(true);
    expect(route('get_api_v1_sessions').response.safeParse({ sessions: [] }).success).toBe(true);
  });

  test.each([
    ['model config', 'put_api_v1_model_config', { provider: 'openai', model: 'gpt', apiKeySecretRef: 'secret:key' }, { provider: 'openai', model: 'gpt', apiKey: 'raw' }],
    ['skill install', 'post_api_v1_skills_install', { source: 'registry:skill' }, { source: '' }],
    ['plugin install', 'post_api_v1_plugins_install', { source: 'registry:plugin' }, { source: '' }],
    ['scheduled task', 'post_api_v1_scheduled_tasks', { name: 'daily', schedule: { kind: 'cron', expr: '0 9 * * *', tz: 'Asia/Shanghai' }, enabled: true }, { name: 'daily', enabled: true }],
    ['runtime restart', 'post_api_v1_runtime_restart', {}, { arbitrary: true }],
  ])('validates %s request fields', (_name, operationId, valid, invalid) => {
    expect(route(operationId).request.safeParse(valid).success).toBe(true);
    expect(route(operationId).request.safeParse(invalid).success).toBe(false);
  });
});

describe('Reviewer Round 2 explicit operation policy mutations', () => {
  test('freezes auth, status, and error sets for high-risk operations', () => {
    expect(route('post_auth_refresh').auth).toBe('refresh-cookie');
    expect(route('post_auth_login').errors).toContain('UNAUTHENTICATED');
    expect(route('post_api_v1_model_proxy').successStatus).toBe(200);
    expect(route('post_api_v1_model_config_check').successStatus).toBe(200);
    expect(route('post_api_v1_model_stream').successStatus).toBe(202);
    expect(route('get_api_v1_sessions_id').errors).not.toEqual(
      expect.arrayContaining(['SESSION_BUSY', 'IN_PROGRESS']),
    );
  });
});

describe('Reviewer Round 2 stream-ticket scope mutations', () => {
  test('rejects duplicate sessions and identical resources but permits distinct paths', () => {
    expect(StreamTicketRequestSchema.safeParse({ sessions: ['s1', 's1'] }).success).toBe(false);
    expect(StreamTicketRequestSchema.safeParse({
      resourceSubscriptions: [
        { channel: 'files:changed', params: { workspaceId: 'w1', path: 'a' } },
        { channel: 'files:changed', params: { workspaceId: 'w1', path: 'a' } },
      ],
    }).success).toBe(false);
    expect(StreamTicketRequestSchema.safeParse({
      resourceSubscriptions: [
        { channel: 'files:changed', params: { workspaceId: 'w1', path: 'a' } },
        { channel: 'files:changed', params: { workspaceId: 'w1', path: 'b' } },
      ],
    }).success).toBe(true);
  });
});

describe('Reviewer Round 2 D12 billing mutations', () => {
  test('uses daily, monthly, granted, and topup balances with account compatibility fields', () => {
    expect(Schemas.QuotaBuckets.safeParse({
      daily: 1,
      monthly: 2,
      granted: 3,
      topup: 4,
    }).success).toBe(true);
    expect(Schemas.QuotaBuckets.safeParse({
      subscription: 1,
      purchased: 2,
      promotional: 3,
      overdraft: 0,
    }).success).toBe(false);
    expect('BillingAccountResponse' in Schemas).toBe(true);
    expect(schemaCatalog.BillingAccountResponse?.safeParse({
      creditsRemaining: 10,
      creditsLimit: 24,
      creditsUsed: 14,
      breakdown: {
        daily: { balance: 1, limit: 5 },
        monthly: { balance: 2, limit: 10 },
        granted: { balance: 3, total: 5 },
        topup: { balance: 4 },
      },
    }).success).toBe(true);
  });

  test('requires signed bucket deltas to have one sign and sum to ledger credits', () => {
    expect(Schemas.BillingLedgerEntry.safeParse({
      requestId: 'r1',
      entryType: 'settle',
      reason: 'model_usage',
      credits: -10,
      bucketDeltas: { daily: -1, monthly: -2, granted: -3, topup: -4 },
    }).success).toBe(true);
    expect(Schemas.BillingLedgerEntry.safeParse({
      requestId: 'r1',
      entryType: 'settle',
      reason: 'model_usage',
      credits: -10,
      bucketDeltas: { daily: 1, monthly: -2, granted: -3, topup: -6 },
    }).success).toBe(false);
  });
});
