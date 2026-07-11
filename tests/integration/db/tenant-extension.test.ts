import pg from 'pg';
import { afterAll, beforeAll, describe, expect, test } from 'vitest';

import { PrismaClient } from '../../../libs/server/db/generated/index.js';
import { createDatabaseFactory } from '../../../libs/server/db/src/client.js';
import { extendTenantClient } from '../../../libs/server/db/src/tenant-scope.js';

const { Client } = pg;
const tenantA = '10000000-0000-4000-8000-000000000001';
const tenantB = '20000000-0000-4000-8000-000000000002';
const userId = '30000000-0000-4000-8000-000000000003';
const appUrl = process.env.P02_APP_DATABASE_URL ?? '';
const adminUrl = process.env.P02_ADMIN_DATABASE_URL ?? '';
const bOnlyId = 'b2000000-0000-4000-8000-000000000022';

let adminSql: pg.Client;
let rawOwner: PrismaClient;
let scopedOwner: ReturnType<typeof extendTenantClient>;
let factory: ReturnType<typeof createDatabaseFactory>;

beforeAll(async () => {
  if (!appUrl || !adminUrl) throw new Error('P02 integration URLs are required');
  adminSql = new Client({ connectionString: adminUrl });
  await adminSql.connect();
  await adminSql.query('ALTER TABLE agents DISABLE ROW LEVEL SECURITY');
  await adminSql.query(
    `INSERT INTO agents (id, tenant_id, logical_id, name, updated_at)
     VALUES ($1, $2, 'b-only', 'B Only', now())
     ON CONFLICT (tenant_id, logical_id) DO UPDATE SET name = EXCLUDED.name`,
    [bOnlyId, tenantB],
  );
  rawOwner = new PrismaClient({ datasources: { db: { url: adminUrl } } });
  scopedOwner = extendTenantClient(rawOwner, tenantA);
  factory = createDatabaseFactory(appUrl);
});

afterAll(async () => {
  if (adminSql) {
    await adminSql.query(
      "DELETE FROM agents WHERE logical_id LIKE 'extension-%' OR logical_id = 'b-only'",
    );
    await adminSql.query('ALTER TABLE agents ENABLE ROW LEVEL SECURITY');
    await adminSql.query('ALTER TABLE agents FORCE ROW LEVEL SECURITY');
  }
  await factory?.disconnect();
  await rawOwner?.$disconnect();
  await adminSql?.end();
});

describe.sequential('P02 real tenant extension with RLS disabled in an isolated test container', () => {
  test('safe factory application path still isolates find/create/update/delete', async () => {
    const database = factory.createTenantDatabase({ tenantId: tenantA, userId });
    const list = await database.agents.list();
    expect(list.map((agent) => agent.name)).not.toContain('B Only');
    expect(await database.agents.find('b-only')).toBeNull();

    const created = await database.agents.create('extension-facade', {
      name: 'Extension Facade',
      skillIds: [],
    });
    expect(created.id).toBe('extension-facade');
    const persisted = await adminSql.query(
      "SELECT tenant_id::text FROM agents WHERE logical_id = 'extension-facade'",
    );
    expect(persisted.rows).toEqual([{ tenant_id: tenantA }]);

    await expect(database.agents.update('b-only', { name: 'Moved by A' })).rejects.toMatchObject({
      code: 'P2025',
    });
    expect(await database.agents.delete('b-only')).toBe(false);
    const untouched = await adminSql.query('SELECT tenant_id::text, name FROM agents WHERE id = $1', [
      bOnlyId,
    ]);
    expect(untouched.rows).toEqual([{ tenant_id: tenantB, name: 'B Only' }]);
  });

  test('findMany/count/aggregate/groupBy expose only tenant A', async () => {
    const rows = await scopedOwner.agent.findMany({ orderBy: { logicalId: 'asc' } });
    const count = await scopedOwner.agent.count();
    const aggregate = await scopedOwner.agent.aggregate({ _count: { _all: true } });
    const groups = await scopedOwner.agent.groupBy({
      by: ['tenantId'],
      _count: { _all: true },
    });

    expect(rows.every((row) => row.tenantId === tenantA)).toBe(true);
    expect(count).toBe(rows.length);
    expect(aggregate._count._all).toBe(rows.length);
    expect(groups).toEqual([{ tenantId: tenantA, _count: { _all: rows.length } }]);
  });

  test('create and createMany override spoofed tenant data', async () => {
    await scopedOwner.agent.create({
      data: {
        tenantId: tenantB,
        logicalId: 'extension-create',
        name: 'Create',
        skillIds: [],
      },
    });
    await scopedOwner.agent.createMany({
      data: [
        {
          tenantId: tenantB,
          logicalId: 'extension-create-many-a',
          name: 'Create Many A',
          skillIds: [],
        },
        {
          tenantId: tenantB,
          logicalId: 'extension-create-many-b',
          name: 'Create Many B',
          skillIds: [],
        },
      ],
    });
    const persisted = await adminSql.query(
      "SELECT DISTINCT tenant_id::text FROM agents WHERE logical_id LIKE 'extension-create%'",
    );
    expect(persisted.rows).toEqual([{ tenant_id: tenantA }]);
  });

  test('upsert/update/updateMany cannot migrate rows to a spoofed tenant', async () => {
    const existing = await scopedOwner.agent.findFirstOrThrow({
      where: { logicalId: 'extension-create' },
    });
    await scopedOwner.agent.upsert({
      where: { id: existing.id },
      create: {
        tenantId: tenantB,
        logicalId: 'extension-upsert-impossible',
        name: 'Impossible',
        skillIds: [],
      },
      update: { tenantId: tenantB, name: 'Upserted' },
    });
    await scopedOwner.agent.update({
      where: { id: existing.id },
      data: { tenantId: tenantB, name: 'Updated' },
    });
    await scopedOwner.agent.updateMany({
      where: { logicalId: { startsWith: 'extension-create-many' } },
      data: { tenantId: tenantB, name: 'Updated Many' },
    });

    const persisted = await adminSql.query(
      "SELECT DISTINCT tenant_id::text FROM agents WHERE logical_id LIKE 'extension-create%'",
    );
    expect(persisted.rows).toEqual([{ tenant_id: tenantA }]);
  });

  test('delete and deleteMany cannot remove tenant B rows', async () => {
    await expect(scopedOwner.agent.delete({ where: { id: bOnlyId } })).rejects.toMatchObject({
      code: 'P2025',
    });
    const deleted = await scopedOwner.agent.deleteMany({
      where: { tenantId: tenantB, logicalId: 'b-only' },
    });
    expect(deleted.count).toBe(0);
    const untouched = await adminSql.query('SELECT tenant_id::text FROM agents WHERE id = $1', [bOnlyId]);
    expect(untouched.rows).toEqual([{ tenant_id: tenantB }]);
  });
});
