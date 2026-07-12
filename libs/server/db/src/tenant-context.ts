import { Prisma } from '../generated/index.js';

export const TenantContextSql = {
  Tenant: "SELECT set_config('app.tenant_id', $1, true)",
  User: "SELECT set_config('app.user_id', $1, true)",
} as const;

export interface TenantContext {
  readonly tenantId: string;
  readonly userId: string;
  readonly requestId?: string;
}

export type TenantTransactionClient = Prisma.TransactionClient;

export type TenantTransactionRunner = <Result>(
  callback: (transaction: TenantTransactionClient) => Promise<Result>,
) => Promise<Result>;

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
  transaction: TenantTransactionClient,
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
  runTransaction: TenantTransactionRunner,
  context: TenantContext,
  callback: (transaction: TenantTransactionClient) => Promise<Result>,
): Promise<Result> => {
  assertTenantContext(context);
  return runTransaction(async (transaction) => {
    await applyTenantContext(transaction, context);
    return callback(transaction);
  });
};
