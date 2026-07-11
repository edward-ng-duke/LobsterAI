import { Prisma, type PrismaClient } from '../generated/index.js';

export const TenantContextSql = {
  Tenant: "SELECT set_config('app.tenant_id', $1, true)",
  User: "SELECT set_config('app.user_id', $1, true)",
} as const;

export interface TenantContext {
  readonly tenantId: string;
  readonly userId: string;
  readonly requestId?: string;
}

type TransactionClient = Prisma.TransactionClient;

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const assertTenantContext = (context: TenantContext): void => {
  if (!uuidPattern.test(context.tenantId)) {
    throw new TypeError('tenantId must be a UUID');
  }
  if (!uuidPattern.test(context.userId)) {
    throw new TypeError('userId must be a UUID');
  }
};

export const applyTenantContext = async (
  transaction: TransactionClient,
  context: TenantContext,
): Promise<void> => {
  assertTenantContext(context);
  await transaction.$executeRaw(
    Prisma.sql`SELECT set_config('app.tenant_id', ${context.tenantId}, true)`,
  );
  await transaction.$executeRaw(
    Prisma.sql`SELECT set_config('app.user_id', ${context.userId}, true)`,
  );
};

export const withTenantTransaction = async <Result>(
  client: PrismaClient,
  context: TenantContext,
  callback: (transaction: TransactionClient) => Promise<Result>,
): Promise<Result> => {
  assertTenantContext(context);
  return client.$transaction(async (transaction) => {
    await applyTenantContext(transaction, context);
    return callback(transaction);
  });
};
