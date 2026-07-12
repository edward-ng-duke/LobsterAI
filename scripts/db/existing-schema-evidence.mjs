import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import path from 'node:path';

import { repositoryRoot } from './common.mjs';

export const ExistingSchemaMigration = {
  Baseline: '20260710000000_existing_catalog_baseline',
  Current: '20260711000000_init_prisma_rls_scaffold',
};

export const existingSchemaBaselineSql = [
  'CREATE TABLE p02_preexisting_catalog (id INTEGER PRIMARY KEY, marker TEXT NOT NULL);',
  "INSERT INTO p02_preexisting_catalog (id, marker) VALUES (1, 'preserve-me');",
  '',
].join('\n');

const sha256 = (value) => createHash('sha256').update(value).digest('hex');
const expectedCatalogTables = {
  before: ['_prisma_migrations', 'p02_preexisting_catalog'],
  after: ['_prisma_migrations', 'agents', 'p02_preexisting_catalog', 'tenants'],
};

export const createCatalogEvidence = (tables) => {
  const payload = { tables: [...tables] };
  return { payload, sha256: sha256(JSON.stringify(payload)) };
};

export const approvedExistingSchemaMigrationHistory = () => [
  {
    migrationName: ExistingSchemaMigration.Baseline,
    checksum: sha256(existingSchemaBaselineSql),
    finished: true,
    rolledBack: false,
  },
  {
    migrationName: ExistingSchemaMigration.Current,
    checksum: sha256(readFileSync(path.join(
      repositoryRoot,
      'prisma/migrations',
      ExistingSchemaMigration.Current,
      'migration.sql',
    ))),
    finished: true,
    rolledBack: false,
  },
];

export const validateExistingSchemaEvidence = (evidence) => {
  for (const [label, expectedTables] of Object.entries(expectedCatalogTables)) {
    const catalog = evidence?.[`${label}Catalog`];
    if (JSON.stringify(catalog?.payload?.tables) !== JSON.stringify(expectedTables)) {
      throw new Error(`existing-schema ${label} catalog payload is invalid`);
    }
    const expectedSha256 = sha256(JSON.stringify(catalog.payload));
    if (catalog.sha256 !== expectedSha256) {
      throw new Error(`existing-schema ${label} catalog SHA-256 does not match its payload`);
    }
  }

  const approvedHistory = approvedExistingSchemaMigrationHistory();
  if (evidence?.completedMigrations !== approvedHistory.length) {
    throw new Error('existing-schema completed migration count is invalid');
  }
  if (JSON.stringify(evidence?.migrationHistory) !== JSON.stringify(approvedHistory)) {
    throw new Error('existing-schema migration history or approved checksum differs');
  }
  return evidence;
};
