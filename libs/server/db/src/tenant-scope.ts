import { Prisma, type PrismaClient } from '../generated/index.js';

export const TenantDatabaseOperation = {
  FindFirst: 'findFirst',
  FindFirstOrThrow: 'findFirstOrThrow',
  FindMany: 'findMany',
  FindUnique: 'findUnique',
  FindUniqueOrThrow: 'findUniqueOrThrow',
  Count: 'count',
  Aggregate: 'aggregate',
  GroupBy: 'groupBy',
  Create: 'create',
  CreateMany: 'createMany',
  Upsert: 'upsert',
  Update: 'update',
  UpdateMany: 'updateMany',
  Delete: 'delete',
  DeleteMany: 'deleteMany',
} as const;

type TenantDatabaseOperation =
  (typeof TenantDatabaseOperation)[keyof typeof TenantDatabaseOperation];
type QueryArguments = Record<string, unknown>;

const filterOperations = new Set<TenantDatabaseOperation>([
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
]);

const asArguments = (value: unknown): QueryArguments =>
  value && typeof value === 'object' && !Array.isArray(value)
    ? { ...(value as QueryArguments) }
    : {};

const withTenant = (value: unknown, tenantId: string): QueryArguments => ({
  ...asArguments(value),
  tenantId,
});

export const scopeTenantOperation = (
  model: string,
  operation: string,
  input: QueryArguments,
  tenantId: string,
): QueryArguments => {
  if (model !== 'Agent') return { ...input };

  const args = { ...input };
  if (filterOperations.has(operation as TenantDatabaseOperation)) {
    args.where = withTenant(args.where, tenantId);
  }
  if (operation === TenantDatabaseOperation.Create) {
    args.data = withTenant(args.data, tenantId);
  }
  if (operation === TenantDatabaseOperation.CreateMany) {
    const rows = Array.isArray(args.data) ? args.data : [args.data];
    args.data = rows.map((row) => withTenant(row, tenantId));
  }
  if (operation === TenantDatabaseOperation.Upsert) {
    args.where = withTenant(args.where, tenantId);
    args.create = withTenant(args.create, tenantId);
    args.update = asArguments(args.update);
  }
  return args;
};

export const createTenantScopeExtension = (tenantId: string) =>
  Prisma.defineExtension({
    name: 'lobsterai-tenant-scope',
    query: {
      agent: {
        async $allOperations({ operation, args, query }) {
          const scoped = scopeTenantOperation(
            'Agent',
            operation,
            args as QueryArguments,
            tenantId,
          );
          return query(scoped as typeof args);
        },
      },
    },
  });

export const extendTenantClient = (client: PrismaClient, tenantId: string) =>
  client.$extends(createTenantScopeExtension(tenantId));
