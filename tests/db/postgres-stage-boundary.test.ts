import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import path from 'node:path';

import { describe, expect, test } from 'vitest';

const repositoryRoot = path.resolve(import.meta.dirname, '../..');
const manifestSource = readFileSync(
  path.join(repositoryRoot, 'scripts/saas-stage-gates.json'),
  'utf8',
);
const manifest = JSON.parse(manifestSource) as {
  gates?: Record<string, { fixtures?: string[] }>;
};
const packageJson = JSON.parse(
  readFileSync(path.join(repositoryRoot, 'package.json'), 'utf8'),
) as { scripts?: Record<string, string> };
const scaffoldChecker = readFileSync(
  path.join(repositoryRoot, 'scripts/check-saas-scaffold.mjs'),
  'utf8',
);

describe('PostgreSQL stage fixture and external digest boundary', () => {
  test('includes every policy consumer runtime helper workflow and test fixture', () => {
    expect(manifest.gates?.['prisma:validate']?.fixtures).toEqual(expect.arrayContaining([
      '.github/workflows/saas-scaffold.yml',
      '.github/workflows/ci.yml',
      'package.json',
      'scripts/json-without-duplicate-keys.mjs',
      'scripts/db/postgres-image-policy.mjs',
      'scripts/db/postgres-container-cleanup.mjs',
      'scripts/db/postgres-migration-lifecycle.mjs',
      'scripts/db/existing-schema-evidence.mjs',
      'scripts/db/vitest-json-evidence.mjs',
      'scripts/db/check-evidence-ci-state.mjs',
      'scripts/db/resolve-evidence-phase.mjs',
      'scripts/db/validate-platform-artifact.mjs',
      'scripts/db/preflight.mjs',
      'scripts/db/run-integration.mjs',
      'scripts/db/validate-static.mjs',
      'tests/integration/db/postgres-image.json',
      'tests/integration/db/migration-lifecycle.test.ts',
      'tests/db/postgres-image-policy.test.ts',
      'tests/db/postgres-platform-artifact.test.ts',
      'tests/db/p02-b00-4-tester-artifact-bindings.test.ts',
      'tests/db/postgres-platform-workflow.test.ts',
      'tests/db/postgres-container-cleanup.test.ts',
      'tests/db/vitest-json-evidence.test.ts',
      'tests/db/postgres-evidence-ci-state.test.ts',
      'tests/db/integration-failure-artifact.test.mjs',
      'tests/db/p03-merge-evidence.test.ts',
      'tests/db/reviewer-round2-red.test.ts',
      'vitest.db.config.ts',
    ]));
  });

  test('uses one external manifest digest in package and scaffold policy', () => {
    const digest = createHash('sha256').update(manifestSource).digest('hex');

    expect(packageJson.scripts?.['prisma:validate']).toBe(
      `node scripts/run-saas-stage-gate.mjs prisma:validate ${digest}`,
    );
    expect(scaffoldChecker).toContain(
      `'prisma:validate': 'node scripts/run-saas-stage-gate.mjs prisma:validate ${digest}'`,
    );
  });
});
