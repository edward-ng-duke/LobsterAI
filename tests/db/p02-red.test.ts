import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

import { describe, expect, test } from 'vitest';

const repositoryRoot = path.resolve(import.meta.dirname, '../..');

const readRepositoryFile = (relativePath: string): string => {
  const absolutePath = path.join(repositoryRoot, relativePath);
  return existsSync(absolutePath) ? readFileSync(absolutePath, 'utf8') : '';
};

const readJson = <T>(relativePath: string): T | undefined => {
  const content = readRepositoryFile(relativePath);
  return content ? (JSON.parse(content) as T) : undefined;
};

describe('P02 Prisma and RLS scaffold red baseline', () => {
  test('activates executable P02 package scripts instead of the P00 placeholder', () => {
    const rootPackage = readJson<{ scripts?: Record<string, string> }>('package.json');

    expect(rootPackage?.scripts).toMatchObject({
      'prisma:generate': expect.stringContaining('prisma'),
      'test:db:preflight': expect.stringContaining('scripts/db'),
      'test:db:unit': expect.stringContaining('vitest'),
      'test:db:integration': expect.stringContaining('scripts/db'),
    });
  });

  test('pins a PostgreSQL 17 patch image, platform, and immutable sha256 digest', () => {
    const image = readJson<{ image?: string; platform?: string; digest?: string }>(
      'tests/integration/db/postgres-image.json',
    );

    expect(image?.image).toMatch(/^postgres:17\.\d+-bookworm$/);
    expect(image?.platform).toMatch(/^linux\/(?:amd64|arm64)$/);
    expect(image?.digest).toMatch(/^sha256:[a-f0-9]{64}$/);
  });

  test('defines the minimal mapped Tenant and Agent Prisma models', () => {
    const schema = readRepositoryFile('prisma/schema.prisma');

    expect(schema).toMatch(/model Tenant\s*\{/);
    expect(schema).toMatch(/model Agent\s*\{/);
    expect(schema).toMatch(/tenantId\s+String\s+@map\("tenant_id"\)\s+@db\.Uuid/);
    expect(schema).toMatch(/logicalId\s+String\s+@map\("logical_id"\)/);
    expect(schema).toMatch(/@@unique\(\[tenantId, logicalId\]/);
    expect(schema).toMatch(/@@map\("agents"\)/);
  });

  test('records extensions, tables, and dual-key constraints in a timestamped migration', () => {
    const migration = readRepositoryFile(
      'prisma/migrations/20260711000000_init_prisma_rls_scaffold/migration.sql',
    );

    expect(migration).toContain('CREATE EXTENSION IF NOT EXISTS citext');
    expect(migration).toContain('gen_random_uuid()');
    expect(migration).toMatch(/CREATE TABLE "tenants"/);
    expect(migration).toMatch(/CREATE TABLE "agents"/);
    expect(migration).toMatch(/UNIQUE\s*\("tenant_id",\s*"logical_id"\)/);
  });

  test('enables and forces fail-closed RLS with symmetric read/write policy', () => {
    const migration = readRepositoryFile(
      'prisma/migrations/20260711000000_init_prisma_rls_scaffold/migration.sql',
    );

    expect(migration).toContain('ALTER TABLE "agents" ENABLE ROW LEVEL SECURITY');
    expect(migration).toContain('ALTER TABLE "agents" FORCE ROW LEVEL SECURITY');
    expect(migration).toMatch(/USING\s*\(\s*"tenant_id"\s*=\s*current_setting\('app\.tenant_id'\)::uuid\s*\)/s);
    expect(migration).toMatch(/WITH CHECK\s*\(\s*"tenant_id"\s*=\s*current_setting\('app\.tenant_id'\)::uuid\s*\)/s);
  });

  test('keeps a unique RLS inventory that names agents and no isolation root table', () => {
    const inventory = readJson<{ tenantScopedModels?: Array<{ model: string; table: string }> }>(
      'prisma/rls/tenant-scoped-models.json',
    );

    expect(inventory?.tenantScopedModels).toEqual([{ model: 'Agent', table: 'agents' }]);
  });

  test('provides contract, extension, UUID, role, and provider preflight probes', () => {
    const preflight = readRepositoryFile('scripts/db/preflight.mjs');

    expect(preflight).toContain('--contracts');
    expect(preflight).toContain('pg_available_extensions');
    expect(preflight).toContain('gen_random_uuid()');
    expect(preflight).toContain('rolsuper');
    expect(preflight).toContain('rolbypassrls');
    expect(preflight).toContain('BLOCKED');
  });

  test('uses parameterized transaction-local tenant and user context without unsafe raw SQL', () => {
    const context = readRepositoryFile('libs/server/db/src/tenant-context.ts');

    expect(context).toContain("set_config('app.tenant_id', $1, true)");
    expect(context).toContain("set_config('app.user_id', $1, true)");
    expect(context).not.toContain('$executeRawUnsafe');
    expect(context).not.toMatch(/\bSET\s+(?:LOCAL\s+)?app\./);
  });

  test('exposes only a tenant facade and never exports a raw generated Prisma client', () => {
    const boundary = readRepositoryFile('libs/server/db/src/index.ts');
    const client = readRepositoryFile('libs/server/db/src/client.ts');

    expect(client).toContain('createDatabaseFactory');
    expect(boundary).toContain('createTenantDatabase');
    expect(boundary).not.toMatch(/export\s+\{[^}]*PrismaClient/s);
    expect(boundary).not.toMatch(/generated\/client/);
  });

  test('tests non-owner non-superuser non-BYPASSRLS CRUD and missing context in real PostgreSQL', () => {
    const integration = readRepositoryFile('tests/integration/db/rls.test.ts');

    expect(integration).toContain('rolsuper');
    expect(integration).toContain('rolbypassrls');
    expect(integration).toContain('tableOwner');
    expect(integration).toContain('missing context');
    expect(integration).toContain('cross-tenant CRUD');
  });

  test('tests commit, rollback, throw, same-connection reuse, and interleaved pool isolation', () => {
    const integration = readRepositoryFile('tests/integration/db/tenant-context.test.ts');

    for (const scenario of ['commit', 'rollback', 'throw', 'same connection', 'interleaved']) {
      expect(integration).toContain(scenario);
    }
    expect(integration).toContain('set_config third argument false mutation');
  });

  test('activates the Prisma gate and a non-skippable independent container CI job', () => {
    const stageGates = readJson<{
      gates?: Record<string, { status?: string; command?: string[] }>;
    }>('scripts/saas-stage-gates.json');
    const workflow = readRepositoryFile('.github/workflows/saas-scaffold.yml');

    expect(stageGates?.gates?.['prisma:validate']).toMatchObject({
      status: 'PASS',
      command: ['npm', 'run', '--silent', 'prisma:validate:active'],
    });
    expect(workflow).toContain('db-integration:');
    expect(workflow).toContain('npm run test:db:integration');
    expect(workflow).not.toMatch(/test:db:integration[^\n]*(?:\|\|\s*true|continue-on-error)/);
  });
});
