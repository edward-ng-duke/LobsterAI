import pg from 'pg';
import { afterAll, beforeAll, describe, expect, test } from 'vitest';

import { TenantContextSql } from '../../../libs/server/db/src/tenant-context.js';

const { Pool } = pg;
const tenantA = '10000000-0000-4000-8000-000000000001';
const tenantB = '20000000-0000-4000-8000-000000000002';
const userId = '30000000-0000-4000-8000-000000000003';
const appUrl = process.env.P02_APP_DATABASE_URL ?? '';
let pool: pg.Pool;

const withContext = async <Result>(
  tenantId: string,
  callback: (client: pg.PoolClient) => Promise<Result>,
): Promise<Result> => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(TenantContextSql.Tenant, [tenantId]);
    await client.query(TenantContextSql.User, [userId]);
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

const currentTenantOutsideTransaction = async (): Promise<string> => {
  const client = await pool.connect();
  try {
    const value = await client.query("SELECT current_setting('app.tenant_id', true) AS tenant_id");
    return value.rows[0].tenant_id;
  } finally {
    client.release();
  }
};

beforeAll(() => {
  if (!appUrl) throw new Error('P02_APP_DATABASE_URL is required');
  pool = new Pool({ connectionString: appUrl, max: 2 });
});

afterAll(async () => {
  await pool.end();
});

describe('P02 transaction-local context prevents pool leakage', () => {
  test('commit clears context on same connection reuse', async () => {
    const visible = await withContext(tenantA, async (client) =>
      client.query('SELECT tenant_id::text FROM agents'),
    );
    expect(visible.rows).toEqual([{ tenant_id: tenantA }]);
    expect(await currentTenantOutsideTransaction()).toBe('');
  });

  test('rollback clears context on same connection reuse', async () => {
    const client = await pool.connect();
    await client.query('BEGIN');
    await client.query(TenantContextSql.Tenant, [tenantA]);
    await client.query(TenantContextSql.User, [userId]);
    await client.query('ROLLBACK');
    client.release();
    expect(await currentTenantOutsideTransaction()).toBe('');
  });

  test('throw rolls back and clears context on same connection reuse', async () => {
    await expect(
      withContext(tenantA, async () => {
        throw new Error('synthetic callback failure');
      }),
    ).rejects.toThrow('synthetic callback failure');
    expect(await currentTenantOutsideTransaction()).toBe('');
  });

  test('interleaved A/B transactions remain isolated for repeated concurrent rounds', async () => {
    for (let round = 0; round < 12; round += 1) {
      const [a, b] = await Promise.all([
        withContext(tenantA, async (client) =>
          client.query('SELECT tenant_id::text, logical_id FROM agents'),
        ),
        withContext(tenantB, async (client) =>
          client.query('SELECT tenant_id::text, logical_id FROM agents'),
        ),
      ]);
      expect(a.rows).toEqual([{ tenant_id: tenantA, logical_id: 'main' }]);
      expect(b.rows).toEqual([{ tenant_id: tenantB, logical_id: 'main' }]);
    }
  });

  test('set_config third argument false mutation demonstrably leaks until reset', async () => {
    const mutationPool = new Pool({ connectionString: appUrl, max: 1 });
    const client = await mutationPool.connect();
    await client.query('BEGIN');
    await client.query("SELECT set_config('app.tenant_id', $1, false)", [tenantA]);
    await client.query('COMMIT');
    client.release();

    const reused = await mutationPool.connect();
    const leaked = await reused.query("SELECT current_setting('app.tenant_id') AS tenant_id");
    expect(leaked.rows[0].tenant_id).toBe(tenantA);
    await reused.query('RESET app.tenant_id');
    reused.release();
    await mutationPool.end();
  });
});
