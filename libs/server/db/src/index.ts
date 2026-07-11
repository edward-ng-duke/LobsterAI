export {
  type AgentCreateInput,
  type AgentDto,
  type AgentUpdateInput,
  createDatabaseFactory,
  type DatabaseFactory,
  type TenantDatabase,
} from './client.js';
export {
  type TenantContext,
  TenantContextSql,
} from './tenant-context.js';
export {
  scopeTenantOperation,
  TenantDatabaseOperation,
} from './tenant-scope.js';

// A tenant database is created only through DatabaseFactory.createTenantDatabase;
// the package root deliberately does not export PrismaClient or generated client paths.
