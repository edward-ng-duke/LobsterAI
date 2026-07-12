import { describe, expect, test } from 'vitest';

interface MigrationLifecycleEvidence {
  first?: boolean;
  repeat?: boolean;
  existingSchema?: boolean;
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
      existingSchema: true,
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
