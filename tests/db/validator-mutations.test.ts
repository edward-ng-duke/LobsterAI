import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import {
  cpSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  renameSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { afterEach, describe, expect, test } from 'vitest';

import { validateEvidenceOnlyDescendant } from '../../scripts/db/evidence-provenance.mjs';

const repositoryRoot = path.resolve(import.meta.dirname, '../..');
const evidencePath = 'docs/db/20260711_P02_Prisma与RLS脚手架证据';
const trustedBootstrapSha256 = 'bec37832b990ae6fcaa08653d9be888326fbe5abad1d68f1f434c311e980f33f';
const temporaryRoots: string[] = [];
const sha256File = (target: string) =>
  createHash('sha256').update(readFileSync(target)).digest('hex');

const createCopy = (): string => {
  const root = mkdtempSync(path.join(tmpdir(), 'lobsterai-p02-static-'));
  temporaryRoots.push(root);
  for (const relativePath of [
    '.github/workflows/saas-scaffold.yml',
    'apps',
    'docs/db/20260711_P02_Prisma与RLS脚手架证据',
    'libs/server/db',
    'package.json',
    'prisma',
    'scripts/check-saas-scaffold.mjs',
    'scripts/db',
    'scripts/json-without-duplicate-keys.mjs',
    'scripts/saas-stage-gates.json',
    'tests/integration/db/postgres-image.json',
    'tests/integration/db/tenant-extension.test.ts',
    'vitest.config.ts',
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

const git = (root: string, ...args: string[]) => {
  const result = spawnSync('git', args, { cwd: root, encoding: 'utf8' });
  expect(result.status, `${result.stdout}\n${result.stderr}`).toBe(0);
  return result.stdout.trim();
};

type NativeReportName =
  | 'contracts-preflight.json'
  | 'preflight.json'
  | 'integration.json'
  | 'validation.json';
type NativeReports = Record<NativeReportName, Record<string, unknown>>;

const createTrustedEvidenceRepository = (
  mutateReports?: (reports: NativeReports) => void,
): string => {
  const root = mkdtempSync(path.join(tmpdir(), 'lobsterai-p02-trusted-mutation-'));
  temporaryRoots.push(root);
  git(root, 'init', '-b', 'main');
  git(root, 'config', 'user.name', 'P02 Trusted Mutation Test');
  git(root, 'config', 'user.email', 'p02-trusted-mutation@example.invalid');
  for (const relativePath of [
    'prisma/migrations/20260711000000_init_prisma_rls_scaffold/migration.sql',
    'tests/integration/db/postgres-image.json',
    'scripts/json-without-duplicate-keys.mjs',
    'scripts/db/common.mjs',
    'scripts/db/evidence-bootstrap.mjs',
    'scripts/db/evidence-bundle.schema.json',
    'scripts/db/evidence-provenance.mjs',
    'scripts/db/evidence-trust-launcher.mjs',
    'scripts/db/existing-schema-evidence.mjs',
    'scripts/db/postgres-image-policy.mjs',
    'scripts/db/preflight.mjs',
    'scripts/db/run-integration.mjs',
    'scripts/db/validate-evidence.mjs',
    'scripts/db/validate.mjs',
  ]) {
    const target = path.join(root, relativePath);
    mkdirSync(path.dirname(target), { recursive: true });
    cpSync(path.join(repositoryRoot, relativePath), target);
  }
  git(root, 'add', '.');
  git(root, 'commit', '-m', 'feat: trusted implementation');
  const sourceSha = git(root, 'rev-parse', 'HEAD');

  const evidenceDirectory = path.join(root, evidencePath);
  mkdirSync(evidenceDirectory, { recursive: true });
  const runners: Record<NativeReportName, string> = {
    'contracts-preflight.json': 'scripts/db/preflight.mjs',
    'preflight.json': 'scripts/db/preflight.mjs',
    'integration.json': 'scripts/db/run-integration.mjs',
    'validation.json': 'scripts/db/validate.mjs',
  };
  const reports = {} as NativeReports;
  for (const reportName of Object.keys(runners) as NativeReportName[]) {
    const report = JSON.parse(
      readFileSync(path.join(repositoryRoot, evidencePath, reportName), 'utf8'),
    ) as Record<string, unknown>;
    report.sourceSha = sourceSha;
    reports[reportName] = report;
  }
  mutateReports?.(reports);
  for (const [reportName, report] of Object.entries(reports)) {
    writeFileSync(
      path.join(evidenceDirectory, reportName),
      `${JSON.stringify(report, null, 2)}\n`,
    );
  }
  const manifestReports = Object.fromEntries(
    Object.entries(runners).map(([reportName, runner]) => [
      reportName,
      {
        sourceSha,
        sha256: sha256File(path.join(evidenceDirectory, reportName)),
        runner,
        runnerSha256: sha256File(path.join(root, runner)),
      },
    ]),
  );
  writeFileSync(
    path.join(evidenceDirectory, 'evidence-manifest.json'),
    `${JSON.stringify({
      schemaVersion: 1,
      generatedAt: new Date().toISOString(),
      codeEvidenceSha: sourceSha,
      reports: manifestReports,
    }, null, 2)}\n`,
  );
  git(root, 'add', '.');
  git(root, 'commit', '-m', 'docs: native evidence');
  return root;
};

const runEvidence = (root: string) => spawnSync(
  process.execPath,
  [
    'scripts/db/evidence-trust-launcher.mjs',
    '--expected-bootstrap-sha256',
    trustedBootstrapSha256,
  ],
  { cwd: root, encoding: 'utf8', env: { ...process.env, NODE_OPTIONS: '' } },
);

const createEvidenceRepository = (): { root: string; implementationSha: string } => {
  const root = mkdtempSync(path.join(tmpdir(), 'lobsterai-p02-evidence-git-'));
  temporaryRoots.push(root);
  git(root, 'init', '-b', 'main');
  git(root, 'config', 'user.name', 'P02 Evidence Test');
  git(root, 'config', 'user.email', 'p02-evidence@example.invalid');
  mkdirSync(path.join(root, 'src'), { recursive: true });
  writeFileSync(path.join(root, 'src/existing.ts'), 'export const value = 1;\n');
  git(root, 'add', '.');
  git(root, 'commit', '-m', 'feat: implementation');
  const implementationSha = git(root, 'rev-parse', 'HEAD');

  mkdirSync(path.join(root, 'docs/db/evidence'), { recursive: true });
  writeFileSync(path.join(root, 'docs/db/evidence/report.json'), '{}\n');
  git(root, 'add', '.');
  git(root, 'commit', '-m', 'docs: evidence');
  return { root, implementationSha };
};

const evidenceErrors = (root: string, sourceSha: string) => validateEvidenceOnlyDescendant({
  gitRoot: root,
  sourceSha,
  allowedEvidencePath: (file: string) => file.startsWith('docs/db/evidence/'),
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
    ['detached extension', 'libs/server/db/src/client.ts', 'const scopedClient = extendTenantClient(client, context.tenantId);', 'const scopedClient = client;'],
    [
      'removed evidence bootstrap entry',
      'package.json',
      'node scripts/db/evidence-trust-launcher.mjs --expected-bootstrap-sha256 bec37832b990ae6fcaa08653d9be888326fbe5abad1d68f1f434c311e980f33f',
      'node scripts/db/validate-evidence.mjs',
    ],
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

  test('rejects a duplicate root key in the PostgreSQL manifest', () => {
    const root = createCopy();
    mutate(
      root,
      'tests/integration/db/postgres-image.json',
      '"schemaVersion": 2',
      '"schemaVersion": 2, "schemaVersion": 2',
    );
    expect(run(root).status).not.toBe(0);
  });

  test('rejects missing duplicate and reordered PostgreSQL platforms', () => {
    for (const mutation of ['missing', 'duplicate', 'reordered'] as const) {
      const root = createCopy();
      const target = path.join(root, 'tests/integration/db/postgres-image.json');
      const image = JSON.parse(readFileSync(target, 'utf8')) as {
        platforms: Array<Record<string, unknown>>;
      };
      if (mutation === 'missing') image.platforms.shift();
      if (mutation === 'duplicate') image.platforms[1] = { ...image.platforms[0] };
      if (mutation === 'reordered') image.platforms.reverse();
      writeFileSync(target, `${JSON.stringify(image, null, 2)}\n`);
      expect(run(root).status).not.toBe(0);
    }
  });

  test('rejects coordinated removal of a policy fixture and both external digest updates', () => {
    const root = createCopy();
    const manifestPath = path.join(root, 'scripts/saas-stage-gates.json');
    const manifest = JSON.parse(readFileSync(manifestPath, 'utf8')) as {
      gates: Record<string, { fixtures: string[] }>;
    };
    manifest.gates['prisma:validate'].fixtures = manifest.gates['prisma:validate'].fixtures.filter(
      (fixture) => fixture !== 'scripts/db/postgres-image-policy.mjs',
    );
    writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
    const digest = createHash('sha256').update(readFileSync(manifestPath)).digest('hex');
    for (const relativePath of ['package.json', 'scripts/check-saas-scaffold.mjs']) {
      const target = path.join(root, relativePath);
      const source = readFileSync(target, 'utf8');
      writeFileSync(
        target,
        source.replace(/(?<=prisma:validate )[a-f0-9]{64}/, digest),
      );
    }

    expect(run(root).status).not.toBe(0);
  });

  test('evidence schema rejects an unknown report field', () => {
    const root = createTrustedEvidenceRepository((reports) => {
      reports['integration.json'].untrustedSummary = true;
    });
    const result = runEvidence(root);
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('unknown property untrustedSummary');
    expect(result.stderr).not.toContain('trusted bootstrap');
  });

  test('evidence provenance rejects a stale report source SHA', () => {
    const root = createTrustedEvidenceRepository((reports) => {
      reports['preflight.json'].sourceSha = '0000000000000000000000000000000000000000';
    });
    const result = runEvidence(root);
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('source SHA does not match codeEvidenceSha');
    expect(result.stderr).not.toContain('trusted bootstrap');
  });

  test('evidence provenance accepts direct evidence-only first-parent commits', () => {
    const { root, implementationSha } = createEvidenceRepository();
    expect(evidenceErrors(root, implementationSha)).toEqual([]);
  });

  test.each([
    ['add', (root: string) => writeFileSync(path.join(root, 'src/added.ts'), 'export {};\n')],
    ['modify', (root: string) => writeFileSync(path.join(root, 'src/existing.ts'), 'export const value = 2;\n')],
    ['delete', (root: string) => rmSync(path.join(root, 'src/existing.ts'))],
  ] as const)('evidence provenance rejects a non-evidence %s commit', (_status, mutateRepository) => {
    const { root, implementationSha } = createEvidenceRepository();
    mutateRepository(root);
    git(root, 'add', '-A');
    git(root, 'commit', '-m', `feat: ${_status} code`);
    expect(evidenceErrors(root, implementationSha).join('\n')).toContain('src/');
  });

  test('evidence provenance audits both sides of a code-to-evidence rename', () => {
    const { root, implementationSha } = createEvidenceRepository();
    renameSync(
      path.join(root, 'src/existing.ts'),
      path.join(root, 'docs/db/evidence/disguised.ts'),
    );
    git(root, 'add', '-A');
    git(root, 'commit', '-m', 'docs: rename code into evidence');
    expect(evidenceErrors(root, implementationSha).join('\n')).toContain('src/existing.ts');
  });

  test('evidence provenance rejects inserted code even after a later revert', () => {
    const { root, implementationSha } = createEvidenceRepository();
    writeFileSync(path.join(root, 'src/arbitrary.ts'), 'export const inserted = true;\n');
    git(root, 'add', '.');
    git(root, 'commit', '-m', 'feat: inserted code');
    const codeSha = git(root, 'rev-parse', 'HEAD');
    git(root, 'revert', '--no-edit', codeSha);
    expect(evidenceErrors(root, implementationSha).join('\n')).toContain('src/arbitrary.ts');
  });

  test('evidence provenance rejects merge commits after the implementation SHA', () => {
    const { root, implementationSha } = createEvidenceRepository();
    git(root, 'branch', 'evidence-side');
    writeFileSync(path.join(root, 'docs/db/evidence/main.json'), '{}\n');
    git(root, 'add', '.');
    git(root, 'commit', '-m', 'docs: main evidence');
    git(root, 'checkout', 'evidence-side');
    writeFileSync(path.join(root, 'docs/db/evidence/side.json'), '{}\n');
    git(root, 'add', '.');
    git(root, 'commit', '-m', 'docs: side evidence');
    git(root, 'checkout', 'main');
    git(root, 'merge', '--no-ff', 'evidence-side', '-m', 'merge: evidence histories');
    expect(evidenceErrors(root, implementationSha).join('\n')).toContain('merge commit');
  });

  test('evidence provenance rejects a source SHA reachable only through a non-first parent', () => {
    const { root } = createEvidenceRepository();
    git(root, 'checkout', '-b', 'source-side');
    writeFileSync(path.join(root, 'docs/db/evidence/source.json'), '{}\n');
    git(root, 'add', '.');
    git(root, 'commit', '-m', 'docs: side source');
    const sideSourceSha = git(root, 'rev-parse', 'HEAD');
    git(root, 'checkout', 'main');
    writeFileSync(path.join(root, 'docs/db/evidence/main-2.json'), '{}\n');
    git(root, 'add', '.');
    git(root, 'commit', '-m', 'docs: main evidence again');
    git(root, 'merge', '--no-ff', 'source-side', '-m', 'merge: source side');
    expect(evidenceErrors(root, sideSourceSha).join('\n')).toContain('first-parent history');
  });
});
