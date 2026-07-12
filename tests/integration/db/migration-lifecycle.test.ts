import { describe, expect, test } from 'vitest';

interface MigrationLifecycleEvidence {
  first?: boolean;
  repeat?: boolean;
  existingSchema?: {
    independentDatabase?: boolean;
    prepared?: boolean;
    preserved?: boolean;
    completedMigrations?: number;
    beforeCatalog?: {
      payload?: { tables?: string[] };
      sha256?: string;
    };
    afterCatalog?: {
      payload?: { tables?: string[] };
      sha256?: string;
    };
    migrationHistory?: Array<{
      migrationName?: string;
      checksum?: string;
      finished?: boolean;
      rolledBack?: boolean;
    }>;
  };
  rollback?: {
    failed?: boolean;
    partialTableAbsent?: boolean;
    rolledBackRows?: number;
    repaired?: boolean;
  };
  concurrent?: {
    safe?: boolean;
    exitCodes?: number[];
    completedRows?: number;
  };
}

const evidence = JSON.parse(
  process.env.P02_MIGRATION_LIFECYCLE_EVIDENCE ?? '{}',
) as MigrationLifecycleEvidence;

describe('P02 migration lifecycle evidence', () => {
  test('proves first repeat and existing-schema deploys are idempotent', () => {
    expect(evidence).toMatchObject({
      first: true,
      repeat: true,
      existingSchema: {
        independentDatabase: true,
        prepared: true,
        preserved: true,
        completedMigrations: 2,
        beforeCatalog: {
          payload: { tables: ['_prisma_migrations', 'p02_preexisting_catalog'] },
          sha256: expect.stringMatching(/^[a-f0-9]{64}$/),
        },
        afterCatalog: {
          payload: {
            tables: ['_prisma_migrations', 'agents', 'p02_preexisting_catalog', 'tenants'],
          },
          sha256: expect.stringMatching(/^[a-f0-9]{64}$/),
        },
        migrationHistory: [
          {
            migrationName: '20260710000000_existing_catalog_baseline',
            checksum: expect.stringMatching(/^[a-f0-9]{64}$/),
            finished: true,
            rolledBack: false,
          },
          {
            migrationName: '20260711000000_init_prisma_rls_scaffold',
            checksum: expect.stringMatching(/^[a-f0-9]{64}$/),
            finished: true,
            rolledBack: false,
          },
        ],
      },
    });
  });

  test('proves a failed migration rolls back before a repaired retry', () => {
    expect(evidence.rollback).toEqual({
      failed: true,
      partialTableAbsent: true,
      rolledBackRows: 1,
      repaired: true,
    });
  });

  test('proves concurrent deploys serialize without corrupting migration history', () => {
    expect(evidence.concurrent).toEqual({
      safe: true,
      exitCodes: [0, 0],
      completedRows: 1,
    });
  });
});
