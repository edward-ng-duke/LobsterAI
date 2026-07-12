import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import {
  cpSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { afterEach, describe, expect, test } from 'vitest';

const repositoryRoot = path.resolve(import.meta.dirname, '../..');
const evidencePath = 'docs/db/20260711_P02_Prisma与RLS脚手架证据';
const trustedBootstrapSha256 = 'bec37832b990ae6fcaa08653d9be888326fbe5abad1d68f1f434c311e980f33f';
const postgresManifest = JSON.parse(readFileSync(
  path.join(repositoryRoot, 'tests/integration/db/postgres-image.json'),
  'utf8',
)) as {
  image: string;
  platforms: Array<{ platform: 'linux/amd64' | 'linux/arm64'; digest: string }>;
};
const temporaryRoots: string[] = [];
const sha256File = (target: string) =>
  createHash('sha256').update(readFileSync(target)).digest('hex');

type MkfifoProbeResult = {
  status: number | null;
  error?: Error & { code?: string };
  stderr?: string | null;
};

type FifoCapability =
  | { available: true; reason: '' }
  | { available: false; reason: string };
type MkfifoSpawn = (target: string) => MkfifoProbeResult;

const classifyMkfifoProbe = (result: MkfifoProbeResult): FifoCapability => {
  if (result.status === 0) return { available: true, reason: '' };
  if (result.error?.code) {
    return {
      available: false,
      reason: `mkfifo spawn failed with ${result.error.code}`,
    };
  }
  const stderr = result.stderr?.trim();
  return {
    available: false,
    reason: `mkfifo could not create a FIFO (exit ${result.status ?? 'null'}${
      stderr ? `: ${stderr}` : ''
    })`,
  };
};

const spawnMkfifo: MkfifoSpawn = (target) => spawnSync(
  'mkfifo',
  [target],
  { encoding: 'utf8' },
);

const detectFifoCapability = (spawn: MkfifoSpawn = spawnMkfifo): FifoCapability => {
  const probeRoot = mkdtempSync(path.join(tmpdir(), 'lobsterai-p02-mkfifo-probe-'));
  try {
    return classifyMkfifoProbe(spawn(path.join(probeRoot, 'probe.fifo')));
  } finally {
    rmSync(probeRoot, { recursive: true, force: true });
  }
};

const fifoCapability = detectFifoCapability();

const git = (root: string, ...args: string[]): string => {
  const result = spawnSync('git', args, { cwd: root, encoding: 'utf8' });
  expect(result.status, `${result.stdout}\n${result.stderr}`).toBe(0);
  return result.stdout.trim();
};

type EvidenceReportName =
  | 'contracts-preflight.json'
  | 'preflight.json'
  | 'integration.json'
  | 'validation.json';
type EvidenceReport = Record<string, unknown>;
type EvidenceMutation = (reports: Record<EvidenceReportName, EvidenceReport>) => void;
type ImplementationMutation = (root: string) => void;

const createFixture = (
  mutateReports?: EvidenceMutation,
  mutateImplementation?: ImplementationMutation,
): string => {
  const root = mkdtempSync(path.join(tmpdir(), 'lobsterai-p02-bootstrap-'));
  temporaryRoots.push(root);
  git(root, 'init', '-b', 'main');
  git(root, 'config', 'user.name', 'P02 Bootstrap Test');
  git(root, 'config', 'user.email', 'p02-bootstrap@example.invalid');
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
  mutateImplementation?.(root);
  git(root, 'add', '.');
  git(root, 'commit', '-m', 'feat: trusted implementation');
  const sourceSha = git(root, 'rev-parse', 'HEAD');

  const evidenceDirectory = path.join(root, evidencePath);
  mkdirSync(evidenceDirectory, { recursive: true });
  const runners = {
    'contracts-preflight.json': 'scripts/db/preflight.mjs',
    'preflight.json': 'scripts/db/preflight.mjs',
    'integration.json': 'scripts/db/run-integration.mjs',
    'validation.json': 'scripts/db/validate.mjs',
  } as const;
  const reportBundle = {} as Record<EvidenceReportName, EvidenceReport>;
  for (const reportName of Object.keys(runners) as EvidenceReportName[]) {
    const report = JSON.parse(
      readFileSync(path.join(repositoryRoot, evidencePath, reportName), 'utf8'),
    ) as EvidenceReport;
    report.sourceSha = sourceSha;
    reportBundle[reportName] = report;
  }
  mutateReports?.(reportBundle);
  for (const [reportName, report] of Object.entries(reportBundle)) {
    writeFileSync(
      path.join(evidenceDirectory, reportName),
      `${JSON.stringify(report, null, 2)}\n`,
    );
  }
  const reports = Object.fromEntries(
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
      reports,
    }, null, 2)}\n`,
  );
  git(root, 'add', '.');
  git(root, 'commit', '-m', 'docs: native evidence');
  return root;
};

const run = (root: string, bootstrapped: boolean) =>
  spawnSync(
    process.execPath,
    [
      ...(bootstrapped
        ? [
            'scripts/db/evidence-trust-launcher.mjs',
            '--expected-bootstrap-sha256',
            trustedBootstrapSha256,
          ]
        : ['scripts/db/validate-evidence.mjs']),
    ],
    {
      cwd: root,
      encoding: 'utf8',
      env: { ...process.env, NODE_OPTIONS: '' },
      timeout: 5_000,
    },
  );

const nestedRecord = (value: unknown, ...pathSegments: string[]): EvidenceReport => {
  let current = value;
  for (const segment of pathSegments) {
    if (!current || typeof current !== 'object' || Array.isArray(current)) {
      throw new Error(`expected object before ${segment}`);
    }
    current = (current as EvidenceReport)[segment];
  }
  if (!current || typeof current !== 'object' || Array.isArray(current)) {
    throw new Error(`expected object at ${pathSegments.join('.')}`);
  }
  return current as EvidenceReport;
};

const arrayAt = (value: unknown, ...pathSegments: string[]): unknown[] => {
  let current = value;
  for (const segment of pathSegments) {
    if (!current || typeof current !== 'object' || Array.isArray(current)) {
      throw new Error(`expected object before ${segment}`);
    }
    current = (current as EvidenceReport)[segment];
  }
  if (!Array.isArray(current)) throw new Error(`expected array at ${pathSegments.join('.')}`);
  return current;
};

type NamedMutation = readonly [string, EvidenceMutation];

const exactShapeMutations: NamedMutation[] = [
  ['contracts cleanup is missing', (reports) => {
    delete reports['contracts-preflight.json'].cleanup;
  }],
  ['contracts cleanup contains a container ID', (reports) => {
    nestedRecord(reports['contracts-preflight.json'], 'cleanup').containerId = 'a'.repeat(64);
  }],
  ['contracts cleanup attempted a container stop', (reports) => {
    nestedRecord(reports['contracts-preflight.json'], 'cleanup').attempted = true;
  }],
  ['database cleanup is missing attempted', (reports) => {
    delete nestedRecord(reports['preflight.json'], 'cleanup').attempted;
  }],
  ['database cleanup is missing its container ID', (reports) => {
    delete nestedRecord(reports['integration.json'], 'cleanup').containerId;
  }],
  ['database cleanup did not remove its container', (reports) => {
    nestedRecord(reports['integration.json'], 'cleanup').removed = false;
  }],
  ['provider is missing runner OS', (reports) => {
    delete nestedRecord(reports['preflight.json'], 'checks', 'provider').runnerOs;
  }],
  ['provider contains an unknown nested field', (reports) => {
    nestedRecord(reports['integration.json'], 'checks', 'provider').runtimeAlias = 'linux/x64';
  }],
  ['runner arch uses a noncanonical alias', (reports) => {
    nestedRecord(reports['integration.json'], 'checks', 'provider').runnerArch = 'x86_64';
  }],
  ['server major is a string', (reports) => {
    nestedRecord(reports['preflight.json'], 'checks', 'provider').serverMajor = '17';
  }],
  ['server major differs from the approved major', (reports) => {
    nestedRecord(reports['preflight.json'], 'checks', 'provider').serverMajor = 16;
  }],
  ['server patch differs from the approved patch', (reports) => {
    nestedRecord(reports['integration.json'], 'checks', 'provider').serverVersion = '17.9';
  }],
  ['provider locale differs', (reports) => {
    nestedRecord(reports['integration.json'], 'checks', 'provider').lcCollate = 'C';
  }],
  ['provider timezone differs', (reports) => {
    nestedRecord(reports['integration.json'], 'checks', 'provider').timezone = 'UTC';
  }],
  ['provider SSL mode differs', (reports) => {
    nestedRecord(reports['integration.json'], 'checks', 'provider').ssl = 'on';
  }],
  ['migration lifecycle regresses to an array', (reports) => {
    nestedRecord(reports['integration.json'], 'checks').migrations = [];
  }],
  ['migration lifecycle is missing first deploy', (reports) => {
    delete nestedRecord(reports['integration.json'], 'checks', 'migrations').first;
  }],
  ['migration lifecycle has an unknown summary', (reports) => {
    nestedRecord(reports['integration.json'], 'checks', 'migrations').summary = 'pass';
  }],
  ['migration history contains an unfinished row', (reports) => {
    nestedRecord(arrayAt(
      reports['integration.json'],
      'checks',
      'migrations',
      'existingSchema',
      'migrationHistory',
    )[1]).finished = false;
  }],
  ['migration history contains a rolled-back row', (reports) => {
    nestedRecord(arrayAt(
      reports['integration.json'],
      'checks',
      'migrations',
      'existingSchema',
      'migrationHistory',
    )[1]).rolledBack = true;
  }],
  ['checksPassed is a string', (reports) => {
    nestedRecord(reports['integration.json'], 'checks').checksPassed = '27';
  }],
  ['checksTotal is fractional', (reports) => {
    nestedRecord(reports['integration.json'], 'checks').checksTotal = 27.5;
  }],
  ['failed tests are nonzero', (reports) => {
    nestedRecord(reports['integration.json'], 'checks', 'testResults').failed = 1;
  }],
  ['root skipped count conflicts with the all-pass contract', (reports) => {
    reports['integration.json'].skipped = 1;
  }],
  ['integration checks contain an unknown summary', (reports) => {
    nestedRecord(reports['integration.json'], 'checks').summary = 'pass';
  }],
];

const bindPostgresPlatform = (
  reports: Record<EvidenceReportName, EvidenceReport>,
  platform: 'linux/amd64' | 'linux/arm64',
  digest: string,
): void => {
  const nodeArch = platform === 'linux/amd64' ? 'x64' : 'arm64';
  const inspectedArch = platform === 'linux/amd64' ? 'amd64' : 'arm64';
  for (const name of ['preflight.json', 'integration.json'] as const) {
    const report = reports[name];
    report.platform = `linux/${nodeArch}`;
    const provider = nestedRecord(report, 'checks', 'provider');
    provider.dockerPlatform = platform;
    provider.runnerArch = nodeArch;
    provider.inspectedArch = inspectedArch;
    provider.digest = digest;
    provider.immutableReference = `${postgresManifest.image}@${digest}`;
    provider.repoDigests = [`postgres@${digest}`];
  }
};

const changeManifestDigest = (root: string, platform: 'linux/amd64' | 'linux/arm64', digest: string) => {
  const target = path.join(root, 'tests/integration/db/postgres-image.json');
  const manifest = JSON.parse(readFileSync(target, 'utf8')) as typeof postgresManifest & {
    platforms: Array<{ platform: 'linux/amd64' | 'linux/arm64'; digest: string; immutableReference: string }>;
  };
  const entry = manifest.platforms.find((candidate) => candidate.platform === platform);
  if (!entry) throw new Error(`missing PostgreSQL manifest entry for ${platform}`);
  entry.digest = digest;
  entry.immutableReference = `${manifest.image}@${digest}`;
  writeFileSync(target, `${JSON.stringify(manifest, null, 2)}\n`);
};

const semanticMutations: NamedMutation[] = [
  ['provider and cleanup container IDs differ', (reports) => {
    nestedRecord(reports['integration.json'], 'cleanup').containerId = 'b'.repeat(64);
  }],
  ['runner and Docker architectures differ', (reports) => {
    nestedRecord(reports['integration.json'], 'checks', 'provider').runnerArch = 'arm64';
  }],
  ['inspect and Docker architectures differ', (reports) => {
    nestedRecord(reports['integration.json'], 'checks', 'provider').inspectedArch = 'arm64';
  }],
  ['root and runner platforms differ', (reports) => {
    reports['integration.json'].platform = 'linux/arm64';
  }],
  ['both reports use one coherent unapproved digest', (reports) => {
    bindPostgresPlatform(reports, 'linux/amd64', `sha256:${'b'.repeat(64)}`);
  }],
  ['RepoDigest differs from the approved digest', (reports) => {
    nestedRecord(reports['integration.json'], 'checks', 'provider').repoDigests = [
      `postgres@sha256:${'b'.repeat(64)}`,
    ];
  }],
  ['RepoDigests contains an extra repository alias', (reports) => {
    const provider = nestedRecord(reports['integration.json'], 'checks', 'provider');
    const [approvedDigest] = provider.repoDigests as string[];
    provider.repoDigests = [approvedDigest, approvedDigest.replace('postgres@', 'mirror@')];
  }],
  ['RepoDigests duplicates the approved repository digest', (reports) => {
    const provider = nestedRecord(reports['integration.json'], 'checks', 'provider');
    const [approvedDigest] = provider.repoDigests as string[];
    provider.repoDigests = [approvedDigest, approvedDigest];
  }],
  ['RepoDigests reorders an extra repository alias before the approved digest', (reports) => {
    const provider = nestedRecord(reports['integration.json'], 'checks', 'provider');
    const [approvedDigest] = provider.repoDigests as string[];
    provider.repoDigests = [approvedDigest.replace('postgres@', 'mirror@'), approvedDigest];
  }],
  ['immutable reference differs from the approved digest', (reports) => {
    nestedRecord(reports['preflight.json'], 'checks', 'provider').immutableReference =
      `postgres:17.10-bookworm@sha256:${'b'.repeat(64)}`;
  }],
  ['catalog payload and hash are rewritten together', (reports) => {
    const beforeCatalog = nestedRecord(
      reports['integration.json'],
      'checks',
      'migrations',
      'existingSchema',
      'beforeCatalog',
    );
    beforeCatalog.payload = { tables: ['_prisma_migrations', 'attacker_table'] };
    beforeCatalog.sha256 = createHash('sha256')
      .update(JSON.stringify(beforeCatalog.payload))
      .digest('hex');
  }],
  ['migration history is reordered', (reports) => {
    arrayAt(
      reports['integration.json'],
      'checks',
      'migrations',
      'existingSchema',
      'migrationHistory',
    ).reverse();
  }],
  ['migration history uses a fake approved checksum', (reports) => {
    nestedRecord(arrayAt(
      reports['integration.json'],
      'checks',
      'migrations',
      'existingSchema',
      'migrationHistory',
    )[1]).checksum = 'b'.repeat(64);
  }],
  ['migration history contains an extra finished row', (reports) => {
    const history = arrayAt(
      reports['integration.json'],
      'checks',
      'migrations',
      'existingSchema',
      'migrationHistory',
    );
    history.push({ ...nestedRecord(history[1]) });
  }],
  ['concurrent migration evidence contains an extra exit code', (reports) => {
    arrayAt(
      reports['integration.json'],
      'checks',
      'migrations',
      'concurrent',
      'exitCodes',
    ).push(0);
  }],
  ['rollback claims the failed migration left a partial table', (reports) => {
    nestedRecord(
      reports['integration.json'],
      'checks',
      'migrations',
      'rollback',
    ).partialTableAbsent = false;
  }],
  ['concurrent migration evidence reports an unsafe race', (reports) => {
    nestedRecord(
      reports['integration.json'],
      'checks',
      'migrations',
      'concurrent',
    ).safe = false;
  }],
  ['checksPassed is zero', (reports) => {
    const checks = nestedRecord(reports['integration.json'], 'checks');
    checks.checksPassed = 0;
    checks.checksTotal = 0;
    const testResults = nestedRecord(checks, 'testResults');
    testResults.passed = 0;
    testResults.total = 0;
  }],
  ['checksPassed is negative', (reports) => {
    const checks = nestedRecord(reports['integration.json'], 'checks');
    checks.checksPassed = -1;
    checks.checksTotal = -1;
    const testResults = nestedRecord(checks, 'testResults');
    testResults.passed = -1;
    testResults.total = -1;
  }],
  ['testResults passed differs from checksPassed', (reports) => {
    nestedRecord(reports['integration.json'], 'checks', 'testResults').passed = 26;
  }],
  ['testResults total differs from checksTotal', (reports) => {
    nestedRecord(reports['integration.json'], 'checks', 'testResults').total = 26;
  }],
  ['testResults skipped is nonzero', (reports) => {
    nestedRecord(reports['integration.json'], 'checks', 'testResults').skipped = 1;
  }],
  ['testResults todo is nonzero', (reports) => {
    nestedRecord(reports['integration.json'], 'checks', 'testResults').todo = 1;
  }],
];

afterEach(() => {
  temporaryRoots.splice(0).forEach((root) => rmSync(root, { recursive: true, force: true }));
});

describe('P02 external evidence bootstrap boundary', () => {
  test('the official bootstrap accepts the canonical current four-report bundle', () => {
    const root = createFixture();
    const readReport = <T,>(name: string): T => JSON.parse(
      readFileSync(path.join(root, evidencePath, name), 'utf8'),
    ) as T;
    const contracts = readReport<{ cleanup: unknown }>('contracts-preflight.json');
    const preflight = readReport<{ checks: { provider: unknown }; cleanup: unknown }>(
      'preflight.json',
    );
    const integration = readReport<{
      checks: { migrations: unknown; checksPassed: number; checksTotal: number; testResults: unknown };
    }>('integration.json');

    expect(contracts.cleanup).toEqual({ attempted: false, removed: false });
    expect(preflight.checks.provider).toMatchObject({
      runnerOs: 'linux',
      runnerArch: 'x64',
      inspectedOs: 'linux',
      inspectedArch: 'amd64',
      serverMajor: 17,
    });
    expect(preflight.cleanup).toMatchObject({ attempted: true, removed: true });
    expect(integration.checks.migrations).toMatchObject({
      first: true,
      repeat: true,
      existingSchema: { completedMigrations: 2 },
    });
    expect(integration.checks).toMatchObject({
      checksPassed: 27,
      checksTotal: 27,
      testResults: { passed: 27, failed: 0, skipped: 0, todo: 0, total: 27 },
    });

    const official = run(root, true);
    expect(official.status, `${official.stdout}\n${official.stderr}`).toBe(0);
  });

  test('a bare validator is not qualified evidence', () => {
    const root = createFixture();
    const bare = run(root, false);
    expect(bare.status).not.toBe(0);
    expect(bare.stderr).toContain('trusted bootstrap');
  });

  test('the official bootstrap accepts the manifest-approved arm64 report pair', () => {
    const approvedArm64 = postgresManifest.platforms.find(
      ({ platform }) => platform === 'linux/arm64',
    );
    expect(approvedArm64).toBeDefined();
    const result = run(createFixture((reports) => {
      bindPostgresPlatform(reports, 'linux/arm64', approvedArm64?.digest ?? '');
    }), true);

    expect(result.status, `${result.stdout}\n${result.stderr}`).toBe(0);
  });

  test.each([
    ['duplicate manifest key', (root: string) => {
      const target = path.join(root, 'tests/integration/db/postgres-image.json');
      const source = readFileSync(target, 'utf8');
      writeFileSync(target, source.replace('"schemaVersion": 2', '"schemaVersion": 2, "schemaVersion": 2'));
    }],
    ['unknown manifest field', (root: string) => {
      const target = path.join(root, 'tests/integration/db/postgres-image.json');
      const manifest = JSON.parse(readFileSync(target, 'utf8')) as Record<string, unknown>;
      manifest.untrustedSummary = true;
      writeFileSync(target, `${JSON.stringify(manifest, null, 2)}\n`);
    }],
    ['missing manifest platform', (root: string) => {
      const target = path.join(root, 'tests/integration/db/postgres-image.json');
      const manifest = JSON.parse(readFileSync(target, 'utf8')) as typeof postgresManifest;
      manifest.platforms.pop();
      writeFileSync(target, `${JSON.stringify(manifest, null, 2)}\n`);
    }],
  ] as const)('rejects trusted-source policy mutation: %s', (_label, mutation) => {
    const result = run(createFixture(undefined, mutation), true);
    expect(result.status, `${result.stdout}\n${result.stderr}`).not.toBe(0);
    expect(result.stderr).toContain('PostgreSQL image policy');
  });

  test.each([
    'scripts/db/postgres-image-policy.mjs',
    'scripts/json-without-duplicate-keys.mjs',
    'tests/integration/db/postgres-image.json',
  ])('rejects a worktree replacement of protected policy input %s', (relativePath) => {
    const root = createFixture();
    const target = path.join(root, relativePath);
    writeFileSync(target, `${readFileSync(target, 'utf8')}\n`);

    const result = run(root, true);
    expect(result.status, `${result.stdout}\n${result.stderr}`).not.toBe(0);
    expect(result.stderr).toContain(`trusted file mismatch ${relativePath}`);
  });

  test.each([
    'scripts/db/validate-evidence.mjs',
    'scripts/json-without-duplicate-keys.mjs',
    'tests/integration/db/postgres-image.json',
  ])('rejects an external same-byte symlink for protected input %s', (relativePath) => {
    const root = createFixture();
    const externalRoot = mkdtempSync(path.join(tmpdir(), 'lobsterai-p02-symlink-target-'));
    temporaryRoots.push(externalRoot);
    const protectedPath = path.join(root, relativePath);
    const externalPath = path.join(externalRoot, path.basename(relativePath));
    writeFileSync(externalPath, readFileSync(protectedPath));
    rmSync(protectedPath);
    symlinkSync(externalPath, protectedPath);

    const result = run(root, true);
    expect(result.signal, `${result.stdout}\n${result.stderr}`).not.toBe('SIGTERM');
    expect(result.status, `${result.stdout}\n${result.stderr}`).not.toBe(0);
    expect(result.stderr).toContain(
      `P02 evidence bootstrap: trusted file must be a regular file ${relativePath}`,
    );
  });

  test('rejects an external same-byte symlink for the trusted bootstrap itself', () => {
    const root = createFixture();
    const externalRoot = mkdtempSync(path.join(tmpdir(), 'lobsterai-p02-bootstrap-target-'));
    temporaryRoots.push(externalRoot);
    const relativePath = 'scripts/db/evidence-bootstrap.mjs';
    const bootstrapPath = path.join(root, relativePath);
    const externalPath = path.join(externalRoot, path.basename(relativePath));
    writeFileSync(externalPath, readFileSync(bootstrapPath));
    rmSync(bootstrapPath);
    symlinkSync(externalPath, bootstrapPath);

    const result = run(root, true);
    expect(result.signal, `${result.stdout}\n${result.stderr}`).not.toBe('SIGTERM');
    expect(result.status, `${result.stdout}\n${result.stderr}`).not.toBe(0);
    expect(result.stderr).toContain(
      `P02 evidence trust launcher: bootstrap must be a regular file ${relativePath}`,
    );
  });

  test('records a controlled missing mkfifo spawn as an explicit capability failure', () => {
    const missingCommand = Object.assign(new Error('spawn mkfifo ENOENT'), { code: 'ENOENT' });

    expect(detectFifoCapability(() => ({ status: null, error: missingCommand }))).toEqual({
      available: false,
      reason: 'mkfifo spawn failed with ENOENT',
    });
  });

  test.skipIf(!fifoCapability.available)(fifoCapability.available
    ? 'rejects a protected FIFO without trying to read it'
    : `skips the protected FIFO corner because ${fifoCapability.reason}`, () => {
    const root = createFixture();
    const relativePath = 'tests/integration/db/postgres-image.json';
    const protectedPath = path.join(root, relativePath);
    rmSync(protectedPath);
    const mkfifo = spawnSync('mkfifo', [protectedPath], { encoding: 'utf8' });
    expect(mkfifo.status, `${mkfifo.stdout}\n${mkfifo.stderr}`).toBe(0);

    const result = run(root, true);
    expect(result.signal, `${result.stdout}\n${result.stderr}`).not.toBe('SIGTERM');
    expect(result.status, `${result.stdout}\n${result.stderr}`).not.toBe(0);
    expect(result.stderr).toContain(
      `P02 evidence bootstrap: trusted file must be a regular file ${relativePath}`,
    );
  });

  test('rejects a protected directory as a nonregular file on every platform', () => {
    const root = createFixture();
    const relativePath = 'tests/integration/db/postgres-image.json';
    const protectedPath = path.join(root, relativePath);
    rmSync(protectedPath);
    mkdirSync(protectedPath);

    const result = run(root, true);
    expect(result.status, `${result.stdout}\n${result.stderr}`).not.toBe(0);
    expect(result.stderr).toContain(
      `P02 evidence bootstrap: trusted file must be a regular file ${relativePath}`,
    );
  });

  test('rejects a broken symlink where an optional protected file could be absent', () => {
    const root = createFixture();
    const relativePath = 'package.json';
    symlinkSync(path.join(root, 'missing-package.json'), path.join(root, relativePath));

    const result = run(root, true);
    expect(result.signal, `${result.stdout}\n${result.stderr}`).not.toBe('SIGTERM');
    expect(result.status, `${result.stdout}\n${result.stderr}`).not.toBe(0);
    expect(result.stderr).toContain(
      `P02 evidence bootstrap: trusted file must be a regular file ${relativePath}`,
    );
  });

  test('rejects a regular protected file reached through an external parent symlink', () => {
    const root = createFixture();
    const externalRoot = mkdtempSync(path.join(tmpdir(), 'lobsterai-p02-parent-target-'));
    temporaryRoots.push(externalRoot);
    const relativeDirectory = 'tests/integration/db';
    const protectedDirectory = path.join(root, relativeDirectory);
    const externalDirectory = path.join(externalRoot, 'db');
    cpSync(protectedDirectory, externalDirectory, { recursive: true });
    rmSync(protectedDirectory, { recursive: true });
    symlinkSync(externalDirectory, protectedDirectory, 'dir');

    const result = run(root, true);
    expect(result.status, `${result.stdout}\n${result.stderr}`).not.toBe(0);
    expect(result.stderr).toContain(
      'P02 evidence bootstrap: trusted file escapes root ' +
        'tests/integration/db/postgres-image.json',
    );
  });

  test('rejects the bootstrap reached through an external parent symlink', () => {
    const root = createFixture();
    const externalRoot = mkdtempSync(path.join(tmpdir(), 'lobsterai-p02-launcher-parent-'));
    temporaryRoots.push(externalRoot);
    const relativeDirectory = 'scripts/db';
    const protectedDirectory = path.join(root, relativeDirectory);
    const externalDirectory = path.join(externalRoot, 'db');
    cpSync(protectedDirectory, externalDirectory, { recursive: true });
    rmSync(protectedDirectory, { recursive: true });
    symlinkSync(externalDirectory, protectedDirectory, 'dir');

    const result = run(root, true);
    expect(result.status, `${result.stdout}\n${result.stderr}`).not.toBe(0);
    expect(result.stderr).toContain(
      'P02 evidence trust launcher: bootstrap escapes root scripts/db/evidence-bootstrap.mjs',
    );
  });

  test('accepts a legal symlink path to the trusted worktree root', () => {
    const root = createFixture();
    const aliasRoot = mkdtempSync(path.join(tmpdir(), 'lobsterai-p02-root-alias-'));
    temporaryRoots.push(aliasRoot);
    const alias = path.join(aliasRoot, 'worktree');
    symlinkSync(root, alias, 'dir');

    const result = run(alias, true);
    expect(result.status, `${result.stdout}\n${result.stderr}`).toBe(0);
  });

  test('rejects a coordinated approved digest and report replacement after the source commit', () => {
    const unapprovedDigest = `sha256:${'b'.repeat(64)}`;
    const root = createFixture((reports) => {
      bindPostgresPlatform(reports, 'linux/amd64', unapprovedDigest);
    });
    changeManifestDigest(root, 'linux/amd64', unapprovedDigest);

    const result = run(root, true);
    expect(result.status, `${result.stdout}\n${result.stderr}`).not.toBe(0);
    expect(result.stderr).toContain(
      'trusted file mismatch tests/integration/db/postgres-image.json',
    );
  });

  test.each(exactShapeMutations)('rejects exact-shape mutation: %s', (_label, mutation) => {
    const result = run(createFixture(mutation), true);
    expect(result.status, `${result.stdout}\n${result.stderr}`).not.toBe(0);
    expect(result.stderr).toContain('"status":"FAILED"');
    expect(result.stderr).not.toContain('bootstrap');
  });

  test.each(semanticMutations)('rejects semantic mutation: %s', (_label, mutation) => {
    const result = run(createFixture(mutation), true);
    expect(result.status, `${result.stdout}\n${result.stderr}`).not.toBe(0);
    expect(result.stderr).toContain('"status":"FAILED"');
    expect(result.stderr).not.toContain('bootstrap');
  });

  test('replacing the bootstrap cannot turn the unchanged validator into PASS', () => {
    const root = createFixture();
    writeFileSync(path.join(root, 'scripts/db/evidence-bootstrap.mjs'), '// bypass attempt\n');
    git(root, 'add', '.');
    git(root, 'commit', '-m', 'fix(db): bypass bootstrap');
    const result = run(root, true);
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('bootstrap integrity mismatch');
  });

  test('coordinated bootstrap and validator replacement cannot make the official entry pass', () => {
    const root = createFixture();
    writeFileSync(path.join(root, 'scripts/db/evidence-bootstrap.mjs'), '// bypass attempt\n');
    writeFileSync(
      path.join(root, 'scripts/db/validate-evidence.mjs'),
      "console.log(JSON.stringify({ status: 'PASS', coordinatedBypass: true }));\n",
    );
    git(root, 'add', '.');
    git(root, 'commit', '-m', 'fix(db): coordinated evidence bypass');
    const result = run(root, true);
    expect(result.status).not.toBe(0);
  });

  test('replacing the existing-schema helper cannot validate rewritten catalog evidence', () => {
    const rewriteCatalog = semanticMutations.find(
      ([label]) => label === 'catalog payload and hash are rewritten together',
    )?.[1];
    expect(rewriteCatalog).toBeDefined();
    const root = createFixture(rewriteCatalog);
    writeFileSync(
      path.join(root, 'scripts/db/existing-schema-evidence.mjs'),
      'export const validateExistingSchemaEvidence = (evidence) => evidence;\n',
    );

    const result = run(root, true);
    expect(result.status, `${result.stdout}\n${result.stderr}`).not.toBe(0);
  });
});
