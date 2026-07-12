import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

import { describe, expect, test } from 'vitest';

import {
  scopeTenantOperation,
  TenantDatabaseOperation,
} from '../../libs/server/db/src/tenant-scope.js';

const repositoryRoot = path.resolve(import.meta.dirname, '../..');
const tenantA = '10000000-0000-4000-8000-000000000001';
const tenantB = '20000000-0000-4000-8000-000000000002';
const evidenceDirectory = path.join(
  repositoryRoot,
  'docs/db/20260711_P02_Prisma与RLS脚手架证据',
);

describe('P02 Reviewer Round 1 P1 red baseline', () => {
  test('the safe factory installs the real tenant extension on its application client', () => {
    const source = readFileSync(path.join(repositoryRoot, 'libs/server/db/src/client.ts'), 'utf8');

    expect(source).toContain('extendTenantClient');
    expect(source).toMatch(/const\s+scopedClient\s*=\s*extendTenantClient\(client,\s*context\.tenantId\)/);
    expect(source).toMatch(/createTenantDatabase\(scopedClient,\s*context\)/);
  });

  test.each([
    TenantDatabaseOperation.Update,
    TenantDatabaseOperation.UpdateMany,
  ])('%s cannot retain a spoofed data.tenantId', (operation) => {
    const scoped = scopeTenantOperation(
      'Agent',
      operation,
      { where: { logicalId: 'main' }, data: { tenantId: tenantB, name: 'spoofed' } },
      tenantA,
    );

    expect(scoped).toMatchObject({
      where: { tenantId: tenantA },
      data: { tenantId: tenantA, name: 'spoofed' },
    });
  });

  test('upsert scopes where, create, and update data against tenant migration', () => {
    const scoped = scopeTenantOperation(
      'Agent',
      TenantDatabaseOperation.Upsert,
      {
        where: { tenantId: tenantB, logicalId: 'main' },
        create: { tenantId: tenantB, logicalId: 'main', name: 'new' },
        update: { tenantId: tenantB, name: 'moved' },
      },
      tenantA,
    );

    expect(scoped).toMatchObject({
      where: { tenantId: tenantA },
      create: { tenantId: tenantA },
      update: { tenantId: tenantA, name: 'moved' },
    });
  });

  test('a live extension-only PostgreSQL suite covers all scoped operations with RLS disabled', () => {
    const relativePath = 'tests/integration/db/tenant-extension.test.ts';
    expect(existsSync(path.join(repositoryRoot, relativePath))).toBe(true);
    const source = existsSync(path.join(repositoryRoot, relativePath))
      ? readFileSync(path.join(repositoryRoot, relativePath), 'utf8')
      : '';

    for (const behavior of [
      'DISABLE ROW LEVEL SECURITY',
      'findMany',
      'count',
      'aggregate',
      'groupBy',
      'createMany',
      'upsert',
      'updateMany',
      'deleteMany',
    ]) {
      expect(source).toContain(behavior);
    }
  });

  test('committed evidence preserves native runner shape and one frozen code-evidence SHA', () => {
    const codeReportNames = [
      'contracts-preflight.json',
      'preflight.json',
      'integration.json',
      'validation.json',
    ];
    const reports = codeReportNames.map((name) => {
      const target = path.join(evidenceDirectory, name);
      expect(existsSync(target), name).toBe(true);
      return JSON.parse(existsSync(target) ? readFileSync(target, 'utf8') : '{}') as Record<string, unknown>;
    });
    const manifestPath = path.join(evidenceDirectory, 'evidence-manifest.json');
    const stagePath = path.join(evidenceDirectory, 'prisma-stage-gate.json');
    expect(existsSync(manifestPath)).toBe(true);
    const preFreeze = process.env.P02_EVIDENCE_PHASE === 'pre-freeze';
    expect(existsSync(stagePath)).toBe(!preFreeze);
    const manifest = JSON.parse(
      existsSync(manifestPath) ? readFileSync(manifestPath, 'utf8') : '{}',
    ) as Record<string, unknown>;
    const stage = JSON.parse(
      existsSync(stagePath) ? readFileSync(stagePath, 'utf8') : '{}',
    ) as Record<string, unknown>;
    const sourceShas = new Set(reports.map((report) => report.sourceSha));

    expect(sourceShas.size).toBe(1);
    const [sourceSha] = sourceShas;
    expect(sourceSha).toBe(manifest.codeEvidenceSha);
    if (!preFreeze) expect(stage.sourceSha).toBe(manifest.stageEvidenceSha);
    expect(sourceSha).toMatch(/^[a-f0-9]{40}$/);
    expect(
      spawnSync('git', ['merge-base', '--is-ancestor', String(sourceSha), 'HEAD'], {
        cwd: repositoryRoot,
      }).status,
    ).toBe(0);
    if (!preFreeze) {
      expect(
        spawnSync('git', ['merge-base', '--is-ancestor', String(stage.sourceSha), 'HEAD'], {
          cwd: repositoryRoot,
        }).status,
      ).toBe(0);
    }
    expect(reports[3]).toHaveProperty('commands');
    expect(reports[3]).not.toHaveProperty('commandExitCodes');
  });

  test('the evidence validator rejects unknown fields and stale source SHAs', () => {
    const validator = path.join(repositoryRoot, 'scripts/db/validate-evidence.mjs');
    expect(existsSync(validator)).toBe(true);
    const current = spawnSync(process.execPath, [validator], {
      cwd: repositoryRoot,
      encoding: 'utf8',
    });
    if (process.env.P02_EVIDENCE_PHASE === 'pre-freeze') {
      expect(current.status).not.toBe(0);
      expect(current.stderr).toContain(
        'trusted file mismatch scripts/db/validate-evidence.mjs',
      );
      expect(
        readFileSync(path.join(repositoryRoot, 'scripts/db/evidence-bundle.schema.json'), 'utf8'),
      ).toContain('additionalProperties');
    } else {
      expect(current.status, `${current.stdout}\n${current.stderr}`).toBe(0);
      expect(
        execFileSync(process.execPath, [validator, '--print-schema'], {
          cwd: repositoryRoot,
          encoding: 'utf8',
        }),
      ).toContain('additionalProperties');
    }
  });
});
