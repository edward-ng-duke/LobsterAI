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

export const DatabaseBoundaryKind = {
  Unconfigured: 'unconfigured',
} as const;

export interface DatabaseBoundary {
  readonly kind: typeof DatabaseBoundaryKind.Unconfigured;
}

// Kept for the P00 health-only API shell until V201/V202 provide its runtime URL.
export const createDatabaseBoundary = (): DatabaseBoundary => ({
  kind: DatabaseBoundaryKind.Unconfigured,
});
