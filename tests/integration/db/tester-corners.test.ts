import pg from 'pg';
import { afterAll, beforeAll, describe, expect, test } from 'vitest';

import { PrismaClient } from '../../../libs/server/db/generated/index.js';
import {
  type TenantContext,
  type TenantTransactionClient,
  withTenantTransaction,
} from '../../../libs/server/db/src/tenant-context.js';
import { extendTenantClient } from '../../../libs/server/db/src/tenant-scope.js';

const { Client } = pg;
const tenantA = '10000000-0000-4000-8000-000000000001';
const tenantB = '20000000-0000-4000-8000-000000000002';
const userA = '30000000-0000-4000-8000-000000000003';
const userB = '40000000-0000-4000-8000-000000000004';
const appUrl = process.env.P02_APP_DATABASE_URL ?? '';
const adminUrl = process.env.P02_ADMIN_DATABASE_URL ?? '';

let admin: pg.Client;
let appClient: PrismaClient;

const runInTenant = <Result>(
  context: TenantContext,
  callback: (transaction: TenantTransactionClient) => Promise<Result>,
): Promise<Result> =>
  withTenantTransaction(
    (transactionCallback) =>
      appClient.$transaction((transaction) =>
        transactionCallback(transaction as TenantTransactionClient),
      ),
    context,
    callback,
  );

beforeAll(async () => {
  if (!appUrl || !adminUrl) throw new Error('P02 integration URLs are required');
  admin = new Client({ connectionString: adminUrl });
  await admin.connect();
  appClient = new PrismaClient({ datasources: { db: { url: appUrl } } });
});

afterAll(async () => {
  await appClient?.$disconnect();
  await admin?.end();
});

describe.sequential('P02 independent Tester PostgreSQL 17 corner cases', () => {
  test('proves the login role has no inherited owner, superuser, or BYPASSRLS membership', async () => {
    const result = await admin.query(`
      WITH RECURSIVE memberships(roleid) AS (
        SELECT member FROM pg_auth_members WHERE member = (SELECT oid FROM pg_roles WHERE rolname = 'p02_app')
        UNION
        SELECT member.roleid
          FROM pg_auth_members member
          JOIN memberships inherited ON member.member = inherited.roleid
      )
      SELECT role.rolname, role.rolsuper, role.rolbypassrls,
             role.oid = table_class.relowner AS owns_agents
        FROM memberships membership
        JOIN pg_roles role ON role.oid = membership.roleid
        CROSS JOIN pg_class table_class
       WHERE table_class.relname = 'agents'
         AND (role.rolsuper OR role.rolbypassrls OR role.oid = table_class.relowner)
    `);
    expect(result.rows).toEqual([]);
  });

  test('keeps nested and concurrent tenant transactions isolated and rolls back callback errors', async () => {
    const contextA = { tenantId: tenantA, userId: userA };
    const contextB = { tenantId: tenantB, userId: userB };
    const nested = await runInTenant(contextA, async (outer) => {
      const before = await outer.agent.findMany({ select: { tenantId: true } });
      const inner = await runInTenant(contextB, (transaction) =>
        transaction.agent.findMany({ select: { tenantId: true } }),
      );
      const after = await outer.agent.findMany({ select: { tenantId: true } });
      return { before, inner, after };
    });
    expect(nested.before).toEqual([{ tenantId: tenantA }]);
    expect(nested.inner).toEqual([{ tenantId: tenantB }]);
    expect(nested.after).toEqual([{ tenantId: tenantA }]);

    for (let round = 0; round < 8; round += 1) {
      const [a, b] = await Promise.all([
        runInTenant(contextA, (transaction) =>
          transaction.agent.findMany({ select: { tenantId: true } }),
        ),
        runInTenant(contextB, (transaction) =>
          transaction.agent.findMany({ select: { tenantId: true } }),
        ),
      ]);
      expect(a).toEqual([{ tenantId: tenantA }]);
      expect(b).toEqual([{ tenantId: tenantB }]);
    }

    await expect(
      runInTenant(contextA, async (transaction) => {
        await transaction.agent.create({
          data: {
            tenantId: tenantA,
            logicalId: 'tester-rollback',
            name: 'Must Roll Back',
            skillIds: [],
          },
        });
        throw new Error('tester rollback sentinel');
      }),
    ).rejects.toThrow('tester rollback sentinel');
    const rolledBack = await admin.query(
      "SELECT id FROM agents WHERE logical_id = 'tester-rollback'",
    );
    expect(rolledBack.rowCount).toBe(0);
  });

  test('scopes composite-unique spoofing and every bulk/write branch with RLS disabled', async () => {
    await admin.query('ALTER TABLE agents DISABLE ROW LEVEL SECURITY');
    const ownerClient = new PrismaClient({ datasources: { db: { url: adminUrl } } });
    const scopedA = extendTenantClient(ownerClient, tenantA);
    try {
      const bMain = await ownerClient.agent.findUniqueOrThrow({
        where: { tenantId_logicalId: { tenantId: tenantB, logicalId: 'main' } },
      });
      expect(
        await scopedA.agent.findUnique({
          where: { tenantId_logicalId: { tenantId: tenantB, logicalId: 'main' } },
        }),
      ).toBeNull();
      expect(await scopedA.agent.findUnique({ where: { id: bMain.id } })).toBeNull();

      await scopedA.agent.createMany({
        data: [
          {
            tenantId: tenantB,
            logicalId: 'main',
            name: 'Spoofed Duplicate',
            skillIds: [],
          },
          {
            tenantId: tenantB,
            logicalId: 'tester-create-many',
            name: 'Spoofed New',
            skillIds: [],
          },
        ],
        skipDuplicates: true,
      });

      await expect(
        scopedA.agent.upsert({
          where: { tenantId_logicalId: { tenantId: tenantB, logicalId: 'main' } },
          create: {
            tenantId: tenantB,
            logicalId: 'main',
            name: 'Spoofed Upsert Create',
            skillIds: [],
          },
          update: { tenantId: tenantB, name: 'Cross Tenant Upsert Update' },
        }),
      ).rejects.toMatchObject({ code: 'P2002' });
      const upsertCreated = await scopedA.agent.upsert({
        where: {
          tenantId_logicalId: { tenantId: tenantB, logicalId: 'tester-upsert-create' },
        },
        create: {
          tenantId: tenantB,
          logicalId: 'tester-upsert-create',
          name: 'Scoped Upsert Create',
          skillIds: [],
        },
        update: { tenantId: tenantB, name: 'Impossible Update' },
      });
      expect(upsertCreated.tenantId).toBe(tenantA);
      await expect(
        scopedA.agent.update({
          where: { id: bMain.id },
          data: { tenantId: tenantB, name: 'Cross Tenant Update' },
        }),
      ).rejects.toMatchObject({ code: 'P2025' });
      const deleted = await scopedA.agent.deleteMany({
        where: { OR: [{ tenantId: tenantB }, { id: bMain.id }] },
      });
      expect(deleted.count).toBe(0);

      const rows = await admin.query(
        `SELECT tenant_id::text, logical_id, name
           FROM agents
          WHERE logical_id IN ('main', 'tester-create-many', 'tester-upsert-create')
          ORDER BY tenant_id, logical_id`,
      );
      expect(rows.rows).toContainEqual({
        tenant_id: tenantA,
        logical_id: 'tester-create-many',
        name: 'Spoofed New',
      });
      expect(rows.rows).toContainEqual({
        tenant_id: tenantB,
        logical_id: 'main',
        name: 'Main B',
      });
      expect(rows.rows).toContainEqual({
        tenant_id: tenantA,
        logical_id: 'tester-upsert-create',
        name: 'Scoped Upsert Create',
      });
      expect(rows.rows.some((row) => row.tenant_id === tenantB && row.logical_id === 'tester-create-many')).toBe(false);
    } finally {
      await ownerClient.$disconnect();
      await admin.query(
        "DELETE FROM agents WHERE logical_id IN ('tester-create-many', 'tester-upsert-create')",
      );
      await admin.query("UPDATE agents SET name = 'Main A' WHERE tenant_id = $1 AND logical_id = 'main'", [
        tenantA,
      ]);
      await admin.query('ALTER TABLE agents ENABLE ROW LEVEL SECURITY');
      await admin.query('ALTER TABLE agents FORCE ROW LEVEL SECURITY');
    }
  });
});
