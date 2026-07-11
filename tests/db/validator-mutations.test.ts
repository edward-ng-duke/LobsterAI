import { spawnSync } from 'node:child_process';
import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { afterEach, describe, expect, test } from 'vitest';

const repositoryRoot = path.resolve(import.meta.dirname, '../..');
const temporaryRoots: string[] = [];

const createCopy = (): string => {
  const root = mkdtempSync(path.join(tmpdir(), 'lobsterai-p02-static-'));
  temporaryRoots.push(root);
  for (const relativePath of [
    '.github/workflows/saas-scaffold.yml',
    'apps',
    'libs/server/db',
    'package.json',
    'prisma',
    'scripts/db/run-integration.mjs',
    'scripts/db/validate-static.mjs',
    'scripts/saas-stage-gates.json',
    'tests/integration/db/postgres-image.json',
  ]) {
    cpSync(path.join(repositoryRoot, relativePath), path.join(root, relativePath), {
      recursive: true,
      filter: (source) => !/(?:^|\/)(?:dist|generated)(?:\/|$)/.test(source),
    });
  }
  return root;
};

const mutate = (root: string, relativePath: string, from: string | RegExp, to: string): void => {
  const target = path.join(root, relativePath);
  const before = readFileSync(target, 'utf8');
  const after = before.replace(from, to);
  expect(after).not.toBe(before);
  writeFileSync(target, after);
};

const run = (root: string) =>
  spawnSync(process.execPath, ['scripts/db/validate-static.mjs', '--root', root], {
    cwd: root,
    encoding: 'utf8',
  });

afterEach(() => {
  temporaryRoots.splice(0).forEach((root) => rmSync(root, { recursive: true, force: true }));
});

describe('P02 static gate mutation resistance', () => {
  test('accepts the canonical source set', () => {
    const root = createCopy();
    expect(run(root).status).toBe(0);
  });

  test.each([
    ['FORCE RLS', 'prisma/migrations/20260711000000_init_prisma_rls_scaffold/migration.sql', 'ALTER TABLE "agents" FORCE ROW LEVEL SECURITY;', ''],
    ['WITH CHECK', 'prisma/migrations/20260711000000_init_prisma_rls_scaffold/migration.sql', "  WITH CHECK (\"tenant_id\" = current_setting('app.tenant_id')::uuid);", '  WITH CHECK (true);'],
    ['session set_config', 'libs/server/db/src/tenant-context.ts', "set_config('app.tenant_id', $1, true)", "set_config('app.tenant_id', $1, false)"],
    ['global logical ID', 'prisma/schema.prisma', '@@unique([tenantId, logicalId]', '@@unique([logicalId]'],
    ['BYPASSRLS app role', 'scripts/db/run-integration.mjs', 'NOBYPASSRLS', 'BYPASSRLS'],
    ['floating image', 'tests/integration/db/postgres-image.json', 'postgres:17.10-bookworm', 'postgres:17'],
    ['deferred gate', 'scripts/saas-stage-gates.json', '"status": "PASS",\n      "activationTask": "P02-PR2数据库脚手架"', '"status": "NOT_APPLICABLE",\n      "activationTask": "P02-PR2数据库脚手架"'],
  ] as const)('rejects the %s mutation', (_label, relativePath, from, to) => {
    const root = createCopy();
    mutate(root, relativePath, from, to);
    expect(run(root).status).not.toBe(0);
  });

  test('rejects an application import of the raw Prisma client', () => {
    const root = createCopy();
    const target = path.join(root, 'apps/api/src/index.ts');
    writeFileSync(target, `${readFileSync(target, 'utf8')}\nimport '@prisma/client';\n`);
    expect(run(root).status).not.toBe(0);
  });
});
