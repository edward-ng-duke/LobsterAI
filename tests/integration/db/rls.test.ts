import pg from 'pg';
import { afterAll, beforeAll, describe, expect, test } from 'vitest';

import { createDatabaseFactory } from '../../../libs/server/db/src/client.js';

const { Client, Pool } = pg;
const tenantA = '10000000-0000-4000-8000-000000000001';
const tenantB = '20000000-0000-4000-8000-000000000002';
const userId = '30000000-0000-4000-8000-000000000003';
const appUrl = process.env.P02_APP_DATABASE_URL ?? '';
const adminUrl = process.env.P02_ADMIN_DATABASE_URL ?? '';
let pool: pg.Pool;

const inTenant = async <Result>(
  tenantId: string,
  callback: (client: pg.PoolClient) => Promise<Result>,
): Promise<Result> => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query("SELECT set_config('app.tenant_id', $1, true)", [tenantId]);
    await client.query("SELECT set_config('app.user_id', $1, true)", [userId]);
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

beforeAll(() => {
  if (!appUrl || !adminUrl) throw new Error('P02 integration URLs are required');
  pool = new Pool({ connectionString: appUrl, max: 4 });
});

afterAll(async () => {
  await pool.end();
});

describe('P02 live RLS catalog and non-privileged role boundary', () => {
  test('proves rolsuper=false, rolbypassrls=false, and tableOwner differs from current_user', async () => {
    const client = new Client({ connectionString: appUrl });
    await client.connect();
    const result = await client.query(`
      SELECT current_user,
             r.rolsuper,
             r.rolbypassrls,
             pg_get_userbyid(c.relowner) AS table_owner
        FROM pg_roles r
        JOIN pg_class c ON c.relname = 'agents'
       WHERE r.rolname = current_user
    `);
    await client.end();
    const tableOwner = result.rows[0].table_owner;
    expect(result.rows[0]).toMatchObject({ rolsuper: false, rolbypassrls: false });
    expect(tableOwner).not.toBe(result.rows[0].current_user);
  });

  test('catalog has ENABLE + FORCE and symmetric USING/WITH CHECK policy', async () => {
    const client = new Client({ connectionString: appUrl });
    await client.connect();
    const result = await client.query(`
      SELECT c.relrowsecurity, c.relforcerowsecurity, p.policyname, p.qual, p.with_check
        FROM pg_class c
        JOIN pg_policies p ON p.tablename = c.relname AND p.schemaname = 'public'
       WHERE c.relname = 'agents'
    `);
    await client.end();
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0]).toMatchObject({
      relrowsecurity: true,
      relforcerowsecurity: true,
      policyname: 'agents_tenant_isolation',
    });
    expect(result.rows[0].qual).toBe(result.rows[0].with_check);
    expect(result.rows[0].qual).toContain("current_setting('app.tenant_id'::text)");
  });

  test('missing context fails closed before returning any row', async () => {
    const client = new Client({ connectionString: appUrl });
    await client.connect();
    await expect(client.query('SELECT id FROM agents')).rejects.toMatchObject({ code: '42704' });
    await client.end();
  });
});

describe('P02 cross-tenant CRUD enforced by RLS without the Prisma extension', () => {
  test('select exposes only the active tenant and ignores a spoofed tenant filter', async () => {
    const rows = await inTenant(tenantA, async (client) =>
      client.query('SELECT tenant_id::text, logical_id FROM agents ORDER BY logical_id'),
    );
    expect(rows.rows).toEqual([{ tenant_id: tenantA, logical_id: 'main' }]);

    const spoofed = await inTenant(tenantA, async (client) =>
      client.query('SELECT id FROM agents WHERE tenant_id = $1', [tenantB]),
    );
    expect(spoofed.rowCount).toBe(0);
  });

  test('insert/update/delete cannot cross the active tenant', async () => {
    await expect(
      inTenant(tenantA, async (client) =>
        client.query(
          "INSERT INTO agents (tenant_id, logical_id, name, updated_at) VALUES ($1, 'foreign', 'bad', now())",
          [tenantB],
        ),
      ),
    ).rejects.toMatchObject({ code: '42501' });

    const update = await inTenant(tenantA, async (client) =>
      client.query("UPDATE agents SET name = 'bad' WHERE tenant_id = $1", [tenantB]),
    );
    const deletion = await inTenant(tenantA, async (client) =>
      client.query('DELETE FROM agents WHERE tenant_id = $1', [tenantB]),
    );
    expect(update.rowCount).toBe(0);
    expect(deletion.rowCount).toBe(0);
  });

  test('same-tenant Unicode logical IDs round-trip and remain writable', async () => {
    await inTenant(tenantA, async (client) => {
      await client.query(
        'INSERT INTO agents (tenant_id, logical_id, name, updated_at) VALUES ($1, $2, $3, now())',
        [tenantA, 'ｍain-海', 'Unicode agent'],
      );
      const selected = await client.query(
        'SELECT logical_id, name FROM agents WHERE tenant_id = $1 AND logical_id = $2',
        [tenantA, 'ｍain-海'],
      );
      expect(selected.rows).toEqual([{ logical_id: 'ｍain-海', name: 'Unicode agent' }]);
      await client.query('DELETE FROM agents WHERE tenant_id = $1 AND logical_id = $2', [
        tenantA,
        'ｍain-海',
      ]);
    });
  });
});

describe('P02 migration, extensions, and dual key invariants', () => {
  test('records one completed migration and installs citext with a working UUID function', async () => {
    const admin = new Client({ connectionString: adminUrl });
    await admin.connect();
    const migrations = await admin.query(
      'SELECT migration_name, finished_at IS NOT NULL AS finished FROM _prisma_migrations',
    );
    const extension = await admin.query(
      "SELECT extversion FROM pg_extension WHERE extname = 'citext'",
    );
    const uuid = await admin.query('SELECT gen_random_uuid()::text AS value');
    await admin.end();
    expect(migrations.rows).toEqual([
      { migration_name: '20260711000000_init_prisma_rls_scaffold', finished: true },
    ]);
    expect(extension.rowCount).toBe(1);
    expect(uuid.rows[0].value).toMatch(/^[0-9a-f-]{36}$/);
  });

  test('allows tenant-local main but rejects a duplicate inside one tenant', async () => {
    const admin = new Client({ connectionString: adminUrl });
    await admin.connect();
    const mains = await admin.query(
      "SELECT tenant_id::text, logical_id, id::text FROM agents WHERE logical_id = 'main' ORDER BY tenant_id",
    );
    expect(mains.rows).toHaveLength(2);
    expect(mains.rows.map((row) => row.tenant_id)).toEqual([tenantA, tenantB]);
    expect(new Set(mains.rows.map((row) => row.id)).size).toBe(2);
    await expect(
      admin.query(
        "INSERT INTO agents (tenant_id, logical_id, name, updated_at) VALUES ($1, 'main', 'duplicate', now())",
        [tenantA],
      ),
    ).rejects.toMatchObject({ code: '23505' });
    await admin.end();
  });

  test('safe facade maps internal UUID back to the accepted AgentDto logical id', async () => {
    const factory = createDatabaseFactory(appUrl);
    const database = factory.createTenantDatabase({ tenantId: tenantA, userId });
    const agent = await database.agents.find('main');
    await factory.disconnect();
    expect(agent).toMatchObject({ id: 'main', name: 'Main A', skillIds: [] });
    expect(agent?.id).not.toMatch(/^[0-9a-f]{8}-/);
  });

  test.each(['', '\0'])('rejects empty or NUL logical IDs %j', async (logicalId) => {
    const admin = new Client({ connectionString: adminUrl });
    await admin.connect();
    await expect(
      admin.query(
        'INSERT INTO agents (tenant_id, logical_id, name, updated_at) VALUES ($1, $2, $3, now())',
        [tenantA, logicalId, 'invalid'],
      ),
    ).rejects.toBeDefined();
    await admin.end();
  });
});
