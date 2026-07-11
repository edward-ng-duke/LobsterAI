import { describe, expect, test } from 'vitest';

import { assertTenantContext } from '../../libs/server/db/src/tenant-context.js';
import {
  scopeTenantOperation,
  TenantDatabaseOperation,
} from '../../libs/server/db/src/tenant-scope.js';

const tenantId = '10000000-0000-4000-8000-000000000001';

describe('P02 application-layer tenant scope', () => {
  test.each([
    TenantDatabaseOperation.FindFirst,
    TenantDatabaseOperation.FindFirstOrThrow,
    TenantDatabaseOperation.FindMany,
    TenantDatabaseOperation.FindUnique,
    TenantDatabaseOperation.FindUniqueOrThrow,
    TenantDatabaseOperation.Count,
    TenantDatabaseOperation.Aggregate,
    TenantDatabaseOperation.GroupBy,
    TenantDatabaseOperation.Update,
    TenantDatabaseOperation.UpdateMany,
    TenantDatabaseOperation.Delete,
    TenantDatabaseOperation.DeleteMany,
  ])('overrides spoofed tenant filters for %s', (operation) => {
    expect(
      scopeTenantOperation('Agent', operation, { where: { tenantId: 'spoofed', name: 'x' } }, tenantId),
    ).toMatchObject({ where: { tenantId, name: 'x' } });
  });

  test('injects tenantId into create and every createMany row', () => {
    expect(
      scopeTenantOperation('Agent', TenantDatabaseOperation.Create, { data: { tenantId: 'spoofed' } }, tenantId),
    ).toMatchObject({ data: { tenantId } });
    expect(
      scopeTenantOperation(
        'Agent',
        TenantDatabaseOperation.CreateMany,
        { data: [{ name: 'a' }, { name: 'b', tenantId: 'spoofed' }] },
        tenantId,
      ),
    ).toMatchObject({ data: [{ name: 'a', tenantId }, { name: 'b', tenantId }] });
  });

  test('scopes upsert where/create while preserving update values', () => {
    expect(
      scopeTenantOperation(
        'Agent',
        TenantDatabaseOperation.Upsert,
        {
          where: { tenantId: 'spoofed' },
          create: { tenantId: 'spoofed', name: 'new' },
          update: { name: 'updated' },
        },
        tenantId,
      ),
    ).toEqual({
      where: { tenantId },
      create: { tenantId, name: 'new' },
      update: { tenantId, name: 'updated' },
    });
  });

  test.each([
    TenantDatabaseOperation.Update,
    TenantDatabaseOperation.UpdateMany,
  ])('%s overrides a spoofed tenant migration in data', (operation) => {
    expect(
      scopeTenantOperation(
        'Agent',
        operation,
        { where: { tenantId: 'spoofed' }, data: { tenantId: 'spoofed', name: 'safe' } },
        tenantId,
      ),
    ).toEqual({
      where: { tenantId },
      data: { tenantId, name: 'safe' },
    });
  });

  test('does not scope the non-tenant Tenant isolation root', () => {
    const args = { where: { id: 'root' } };
    expect(scopeTenantOperation('Tenant', TenantDatabaseOperation.FindMany, args, tenantId)).toEqual(args);
  });

  test.each(['', 'not-a-uuid', "x'; SELECT 1; --"])(
    'rejects invalid and injection-shaped tenant context %j before SQL',
    (invalidTenantId) => {
      expect(() =>
        assertTenantContext({
          tenantId: invalidTenantId,
          userId: '30000000-0000-4000-8000-000000000003',
        }),
      ).toThrow('tenantId must be a UUID');
    },
  );
});
