import { AgentDtoSchema } from '@lobsterai/shared-contracts';

import {
  type Agent as AgentRow,
  PrismaClient,
} from '../generated/index.js';
import {
  type TenantContext,
  type TenantTransactionClient,
  withTenantTransaction,
} from './tenant-context.js';
import { extendTenantClient } from './tenant-scope.js';

export type AgentDto = (typeof AgentDtoSchema)['_output'];
export type AgentCreateInput = Omit<AgentDto, 'id'>;
export type AgentUpdateInput = Partial<AgentCreateInput>;

export interface TenantAgentFacade {
  list(): Promise<AgentDto[]>;
  find(logicalId: string): Promise<AgentDto | null>;
  create(logicalId: string, input: AgentCreateInput): Promise<AgentDto>;
  update(logicalId: string, input: AgentUpdateInput): Promise<AgentDto>;
  delete(logicalId: string): Promise<boolean>;
}

export interface TenantDatabase {
  readonly agents: TenantAgentFacade;
}

export interface DatabaseFactory {
  createTenantDatabase(context: TenantContext): TenantDatabase;
  disconnect(): Promise<void>;
}

const toAgentDto = (row: AgentRow): AgentDto =>
  AgentDtoSchema.parse({
    id: row.logicalId,
    name: row.name,
    model: row.model ?? undefined,
    skillIds: Array.isArray(row.skillIds) ? row.skillIds : [],
    workingDirectory: row.workingDirectory ?? undefined,
  });

const createTenantDatabase = (
  client: ReturnType<typeof extendTenantClient>,
  context: TenantContext,
): TenantDatabase => {
  const run = <Result>(callback: (transaction: TenantTransactionClient) => Promise<Result>) =>
    withTenantTransaction(
      (transactionCallback) =>
        client.$transaction((transaction) =>
          transactionCallback(transaction as TenantTransactionClient),
        ),
      context,
      callback,
    );

  return {
    agents: {
      list: () =>
        run(async (transaction) =>
          (await transaction.agent.findMany({
            where: { tenantId: context.tenantId },
            orderBy: { logicalId: 'asc' },
          })).map(toAgentDto),
        ),
      find: (logicalId) =>
        run(async (transaction) => {
          const row = await transaction.agent.findUnique({
            where: {
              tenantId_logicalId: { tenantId: context.tenantId, logicalId },
            },
          });
          return row ? toAgentDto(row) : null;
        }),
      create: (logicalId, input) =>
        run(async (transaction) =>
          toAgentDto(
            await transaction.agent.create({
              data: {
                tenantId: context.tenantId,
                logicalId,
                name: input.name,
                model: input.model,
                skillIds: input.skillIds,
                workingDirectory: input.workingDirectory,
              },
            }),
          ),
        ),
      update: (logicalId, input) =>
        run(async (transaction) =>
          toAgentDto(
            await transaction.agent.update({
              where: {
                tenantId_logicalId: { tenantId: context.tenantId, logicalId },
              },
              data: input,
            }),
          ),
        ),
      delete: (logicalId) =>
        run(async (transaction) => {
          const result = await transaction.agent.deleteMany({
            where: { tenantId: context.tenantId, logicalId },
          });
          return result.count === 1;
        }),
    },
  };
};

export const createDatabaseFactory = (databaseUrl = process.env.DATABASE_URL): DatabaseFactory => {
  if (!databaseUrl) throw new Error('DATABASE_URL is required');
  const client = new PrismaClient({ datasources: { db: { url: databaseUrl } } });
  return {
    createTenantDatabase: (context) => {
      const scopedClient = extendTenantClient(client, context.tenantId);
      return createTenantDatabase(scopedClient, context);
    },
    disconnect: () => client.$disconnect(),
  };
};
