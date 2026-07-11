import { existsSync, readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const defaultRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const rootArgument = process.argv.indexOf('--root');
const root = rootArgument >= 0 ? path.resolve(process.argv[rootArgument + 1]) : defaultRoot;
const errors = [];

const read = (relativePath) => {
  const absolutePath = path.join(root, relativePath);
  if (!existsSync(absolutePath)) {
    errors.push(`missing ${relativePath}`);
    return '';
  }
  return readFileSync(absolutePath, 'utf8');
};

const json = (relativePath) => {
  try {
    return JSON.parse(read(relativePath));
  } catch (error) {
    errors.push(`invalid JSON ${relativePath}: ${error.message}`);
    return {};
  }
};

const requirePattern = (content, pattern, message) => {
  if (!pattern.test(content)) errors.push(message);
};

const packageJson = json('package.json');
const dbPackage = json('libs/server/db/package.json');
const image = json('tests/integration/db/postgres-image.json');
const schema = read('prisma/schema.prisma');
const inventory = json('prisma/rls/tenant-scoped-models.json');
const context = read('libs/server/db/src/tenant-context.ts');
const integrationRunner = read('scripts/db/run-integration.mjs');
const workflow = read('.github/workflows/saas-scaffold.yml');
const stageManifest = json('scripts/saas-stage-gates.json');

const migrationRoot = path.join(root, 'prisma/migrations');
const migrationDirectories = existsSync(migrationRoot)
  ? readdirSync(migrationRoot, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
  : [];
if (
  migrationDirectories.length !== 1 ||
  !/^\d{14}_[a-z0-9_]+$/.test(migrationDirectories[0] ?? '')
) {
  errors.push('exactly one timestamped snake-case Prisma migration is required');
}
const migration = migrationDirectories[0]
  ? read(`prisma/migrations/${migrationDirectories[0]}/migration.sql`)
  : '';

for (const [script, fragment] of Object.entries({
  'prisma:generate': 'prisma generate',
  'prisma:migrate:deploy': 'prisma migrate deploy',
  'prisma:validate:active': 'scripts/db/validate.mjs',
  'test:db:preflight': 'scripts/db/preflight.mjs',
  'test:db:unit': 'vitest run tests/db',
  'test:db:integration': 'scripts/db/run-integration.mjs',
})) {
  if (!packageJson.scripts?.[script]?.includes(fragment)) {
    errors.push(`root script ${script} must execute ${fragment}`);
  }
}
for (const [dependency, version] of Object.entries({
  prisma: '6.19.3',
  testcontainers: '12.0.4',
  '@types/pg': '8.20.0',
})) {
  if (packageJson.devDependencies?.[dependency] !== version) {
    errors.push(`${dependency} must be pinned to ${version}`);
  }
}
if (
  dbPackage.dependencies?.['@prisma/client'] !== '6.19.3' ||
  dbPackage.dependencies?.pg !== '8.22.0'
) {
  errors.push('server-db Prisma client and pg dependencies are not pinned');
}

if (!/^postgres:17\.\d+-bookworm$/.test(image.image ?? '')) {
  errors.push('PostgreSQL image must use an exact 17.x bookworm patch tag');
}
if (!/^linux\/(?:amd64|arm64)$/.test(image.platform ?? '')) {
  errors.push('PostgreSQL image platform must be linux/amd64 or linux/arm64');
}
if (!/^sha256:[a-f0-9]{64}$/.test(image.digest ?? '')) {
  errors.push('PostgreSQL image requires an immutable sha256 digest');
}
if (image.immutableReference !== `${image.image}@${image.digest}`) {
  errors.push('PostgreSQL immutable reference must bind exact tag and digest');
}

requirePattern(schema, /model Tenant\s*\{/, 'schema lacks Tenant isolation root');
requirePattern(schema, /model Agent\s*\{/, 'schema lacks Agent tenant model');
requirePattern(
  schema,
  /tenantId\s+String\s+@map\("tenant_id"\)\s+@db\.Uuid/,
  'Agent tenantId must map to tenant_id UUID',
);
requirePattern(schema, /logicalId\s+String\s+@map\("logical_id"\)/, 'Agent lacks logical_id');
requirePattern(
  schema,
  /@@unique\(\[tenantId, logicalId\]/,
  'Agent logical ID uniqueness must be tenant-local',
);
if (/@@unique\(\[logicalId\]/.test(schema)) errors.push('global logicalId uniqueness is forbidden');

for (const required of [
  /CREATE EXTENSION IF NOT EXISTS citext/,
  /gen_random_uuid\(\)/,
  /CREATE TABLE "tenants"/,
  /CREATE TABLE "agents"/,
  /"tenant_id" UUID NOT NULL/,
  /UNIQUE \("tenant_id", "logical_id"\)/,
  /ALTER TABLE "agents" ENABLE ROW LEVEL SECURITY/,
  /ALTER TABLE "agents" FORCE ROW LEVEL SECURITY/,
  /USING \("tenant_id" = current_setting\('app\.tenant_id'\)::uuid\)/,
  /WITH CHECK \("tenant_id" = current_setting\('app\.tenant_id'\)::uuid\)/,
]) {
  requirePattern(migration, required, `migration invariant missing: ${required}`);
}
if (/\bDROP\s+(?:TABLE|COLUMN|SCHEMA|DATABASE)\b/i.test(migration)) {
  errors.push('first P02 migration must be expand-only');
}

const registered = inventory.tenantScopedModels ?? [];
const keys = registered.map((entry) => `${entry.model}:${entry.table}`);
if (new Set(keys).size !== keys.length) errors.push('RLS inventory contains duplicate entries');
if (JSON.stringify(registered) !== JSON.stringify([{ model: 'Agent', table: 'agents' }])) {
  errors.push('RLS inventory must contain exactly Agent:agents');
}
for (const entry of registered) {
  if (!schema.includes(`model ${entry.model} {`)) errors.push(`inventory model missing in schema: ${entry.model}`);
  if (!migration.includes(`ALTER TABLE "${entry.table}" ENABLE ROW LEVEL SECURITY`)) {
    errors.push(`inventory table missing ENABLE RLS: ${entry.table}`);
  }
  if (!migration.includes(`ALTER TABLE "${entry.table}" FORCE ROW LEVEL SECURITY`)) {
    errors.push(`inventory table missing FORCE RLS: ${entry.table}`);
  }
}

requirePattern(
  context,
  /set_config\('app\.tenant_id', \$1, true\)/,
  'tenant context must be parameterized and transaction-local',
);
requirePattern(
  context,
  /set_config\('app\.user_id', \$1, true\)/,
  'user context must be parameterized and transaction-local',
);
if (/\$executeRawUnsafe|\$queryRawUnsafe|\bSET\s+(?:LOCAL\s+)?app\./.test(context)) {
  errors.push('tenant context contains unsafe/session SQL');
}
if (/set_config\('app\.(?:tenant_id|user_id)', \$1, false\)/.test(context)) {
  errors.push('tenant context set_config must not use session scope');
}
for (const required of ['NOSUPERUSER', 'NOBYPASSRLS', 'table_owner', 'rolsuper', 'rolbypassrls']) {
  if (!integrationRunner.includes(required)) errors.push(`integration role proof missing ${required}`);
}

const scanRoots = ['apps'];
for (const scanRoot of scanRoots) {
  const queue = [path.join(root, scanRoot)];
  while (queue.length > 0) {
    const directory = queue.pop();
    if (!existsSync(directory)) continue;
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const absolutePath = path.join(directory, entry.name);
      if (entry.isDirectory()) queue.push(absolutePath);
      else if (/\.(?:ts|tsx|js|mjs)$/.test(entry.name)) {
        const source = readFileSync(absolutePath, 'utf8');
        if (/@prisma\/client|libs\/server\/db\/(?:generated|src\/client)|server-db\/generated/.test(source)) {
          errors.push(`application imports a raw database client: ${path.relative(root, absolutePath)}`);
        }
      }
    }
  }
}

const prismaGate = stageManifest.gates?.['prisma:validate'];
if (
  prismaGate?.status !== 'PASS' ||
  JSON.stringify(prismaGate.command) !==
    JSON.stringify(['npm', 'run', '--silent', 'prisma:validate:active'])
) {
  errors.push('prisma:validate stage gate is not active');
}
if (!workflow.includes('db-integration:') || !workflow.includes('npm run test:db:integration')) {
  errors.push('workflow lacks an independent database integration job');
}
if (/test:db:integration[^\n]*(?:\|\|\s*true|continue-on-error)/.test(workflow)) {
  errors.push('database integration CI job may not skip or continue on error');
}

if (errors.length > 0) {
  console.error(JSON.stringify({ status: 'FAILED', errors }));
  process.exit(1);
}
console.log(JSON.stringify({
  status: 'PASS',
  migration: migrationDirectories[0],
  tenantScopedTables: registered.map((entry) => entry.table),
  image: image.immutableReference,
}));
