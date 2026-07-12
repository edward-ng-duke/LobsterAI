import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

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

const sha256File = (relativePath) =>
  createHash('sha256').update(readFileSync(path.join(root, relativePath))).digest('hex');

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
let image = {};
let selectedImage;
try {
  const policy = await import(pathToFileURL(path.join(root, 'scripts/db/postgres-image-policy.mjs')));
  image = policy.loadPostgresImageManifest(root);
  selectedImage = policy.selectApprovedPostgresImage(image, process.arch, process.arch);
} catch (error) {
  errors.push(`invalid PostgreSQL image policy: ${error.message}`);
}
const schema = read('prisma/schema.prisma');
const inventory = json('prisma/rls/tenant-scoped-models.json');
const context = read('libs/server/db/src/tenant-context.ts');
const dbClient = read('libs/server/db/src/client.ts');
const tenantScope = read('libs/server/db/src/tenant-scope.ts');
const extensionIntegration = read('tests/integration/db/tenant-extension.test.ts');
const integrationRunner = read('scripts/db/run-integration.mjs');
const platformArtifactValidator = read('scripts/db/validate-platform-artifact.mjs');
const workflow = read('.github/workflows/saas-scaffold.yml');
const rootVitestConfig = read('vitest.config.ts');
const stageManifest = json('scripts/saas-stage-gates.json');
const scaffoldChecker = read('scripts/check-saas-scaffold.mjs');
const evidenceValidator = read('scripts/db/validate-evidence.mjs');
const evidenceBootstrap = read('scripts/db/evidence-bootstrap.mjs');
const evidenceTrustLauncher = read('scripts/db/evidence-trust-launcher.mjs');
const evidenceProvenance = read('scripts/db/evidence-provenance.mjs');
const evidenceSchema = read('scripts/db/evidence-bundle.schema.json');
const evidenceSnapshot = read('scripts/db/snapshot-evidence.mjs');

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
if (!packageJson.scripts?.['prisma:validate:active']?.includes('evidence-trust-launcher.mjs')) {
  errors.push('active Prisma gate must validate committed native evidence');
}
for (const required of ['additionalProperties', 'codeEvidenceSha', 'stageEvidenceSha']) {
  if (!evidenceSchema.includes(required)) errors.push(`evidence JSON schema lacks ${required}`);
}
if (!evidenceSchema.includes('manifestSha256')) {
  errors.push('evidence JSON schema must bind the outer gate manifest digest');
}
for (const required of ['unknown property', 'source SHA', 'runner SHA mismatch']) {
  if (!evidenceValidator.includes(required)) errors.push(`evidence validator lacks ${required}`);
}
for (const required of [
  'P02 evidence bootstrap: trusted file mismatch',
  'P02_EVIDENCE_BOOTSTRAPPED',
  "['show', `${sourceSha}:${relativePath}`]",
]) {
  if (!evidenceBootstrap.includes(required)) errors.push(`evidence bootstrap lacks ${required}`);
}
for (const required of [
  'node scripts/db/evidence-trust-launcher.mjs --expected-bootstrap-sha256',
]) {
  if (!packageJson.scripts?.['prisma:validate:active']?.includes(required)) {
    errors.push('active Prisma gate must enter evidence validation through the trusted bootstrap');
  }
}
for (const required of [
  'external bootstrap digest is required',
  'bootstrap integrity mismatch',
  '--expected-bootstrap-sha256',
]) {
  if (!evidenceTrustLauncher.includes(required)) {
    errors.push(`evidence trust launcher lacks ${required}`);
  }
}
for (const relativePath of [
  'scripts/db/evidence-bootstrap.mjs',
  'scripts/db/evidence-trust-launcher.mjs',
]) {
  if (!stageManifest.gates?.['prisma:validate']?.trustedFiles?.[relativePath]) {
    errors.push(`Prisma stage must externally pin ${relativePath}`);
  }
  if (
    stageManifest.gates?.['prisma:validate']?.trustedFiles?.[relativePath] !==
    sha256File(relativePath)
  ) {
    errors.push(`Prisma stage trusted digest mismatch for ${relativePath}`);
  }
}
const stageManifestSha256 = sha256File('scripts/saas-stage-gates.json');
if (!packageJson.scripts?.['prisma:validate']?.endsWith(stageManifestSha256)) {
  errors.push('Prisma stage entry must include the externally accepted gate manifest digest');
}
if (!scaffoldChecker.includes(
  `'prisma:validate': 'node scripts/run-saas-stage-gate.mjs prisma:validate ${stageManifestSha256}'`,
)) {
  errors.push('scaffold policy must include the externally accepted gate manifest digest');
}
const requiredPrismaFixtures = [
  '.github/workflows/saas-scaffold.yml',
  'package.json',
  'scripts/json-without-duplicate-keys.mjs',
  'scripts/db/postgres-image-policy.mjs',
  'scripts/db/postgres-container-cleanup.mjs',
  'scripts/db/postgres-migration-lifecycle.mjs',
  'scripts/db/validate-platform-artifact.mjs',
  'scripts/db/preflight.mjs',
  'scripts/db/run-integration.mjs',
  'scripts/db/validate-static.mjs',
  'tests/integration/db/postgres-image.json',
  'tests/integration/db/migration-lifecycle.test.ts',
  'tests/db/postgres-image-policy.test.ts',
  'tests/db/postgres-platform-artifact.test.ts',
  'tests/db/postgres-platform-workflow.test.ts',
  'tests/db/postgres-container-cleanup.test.ts',
  'vitest.db.config.ts',
];
for (const fixture of requiredPrismaFixtures) {
  if (!stageManifest.gates?.['prisma:validate']?.fixtures?.includes(fixture)) {
    errors.push(`Prisma stage fixture missing ${fixture}`);
  }
}
for (const required of ['--first-parent', 'non-evidence change after source SHA']) {
  if (!evidenceProvenance.includes(required)) errors.push(`evidence provenance lacks ${required}`);
}
for (const required of [
  'copyNativeReport',
  "report.sourceSha !== expectedSourceSha",
  'atomicWrite',
  "rmSync(path.join(evidenceDirectory, 'prisma-stage-gate.json')",
]) {
  if (!evidenceSnapshot.includes(required)) errors.push(`native evidence snapshot lacks ${required}`);
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
for (const required of [
  /import \{ extendTenantClient \} from '\.\/tenant-scope\.js'/,
  /const scopedClient = extendTenantClient\(client, context\.tenantId\)/,
  /createTenantDatabase\(scopedClient, context\)/,
]) {
  requirePattern(dbClient, required, `safe database factory does not install tenant extension: ${required}`);
}
for (const required of [
  /Prisma\.defineExtension/,
  /operation === TenantDatabaseOperation\.Update/,
  /operation === TenantDatabaseOperation\.UpdateMany/,
  /args\.update = withTenant\(args\.update, tenantId\)/,
]) {
  requirePattern(tenantScope, required, `tenant extension invariant missing: ${required}`);
}
for (const required of [
  /DISABLE ROW LEVEL SECURITY/,
  /findMany/,
  /count/,
  /aggregate/,
  /groupBy/,
  /createMany/,
  /upsert/,
  /updateMany/,
  /deleteMany/,
]) {
  requirePattern(extensionIntegration, required, `RLS-disabled extension integration lacks ${required}`);
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
for (const required of [
  'db-platform-arm64:',
  'db-evidence-arm64:',
  'npm run test:db:preflight',
  'npm run test:db:integration',
  'npm run prisma:validate',
  'validate-platform-artifact.mjs',
]) {
  if (!workflow.includes(required)) errors.push(`workflow lacks required database gate: ${required}`);
}
for (const required of [
  '--source-sha',
  '--platform',
  'checksPassed',
  'cleanup.removed',
]) {
  if (!platformArtifactValidator.includes(required)) {
    errors.push(`platform artifact validator lacks ${required}`);
  }
}
if (!rootVitestConfig.includes("'tests/integration/**'")) {
  errors.push('default Vitest fast loop must exclude explicit database integration tests');
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
  dockerPlatform: selectedImage.platform,
  image: selectedImage.immutableReference,
}));
