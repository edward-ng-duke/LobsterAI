import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import {
  chmodSync,
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

const repositoryRoot = path.resolve(import.meta.dirname, '..');
const evidenceRelativeDirectory = '.reports/supply-chain/20260712_PR3部署供应链证据';
const evidenceSourceSha = 'f93fdd59d98b029cb82da5cc4f5873520472bb7f';
const temporaryRoots: string[] = [];

const sha256File = (filePath: string) =>
  `sha256:${createHash('sha256').update(readFileSync(filePath)).digest('hex')}`;

const readJson = (filePath: string) => JSON.parse(readFileSync(filePath, 'utf8')) as Record<string, any>;

const writeJson = (filePath: string, value: unknown) => {
  writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
};

const evidenceDirectory = (root: string) => path.join(root, evidenceRelativeDirectory);
const reportPath = (root: string) => path.join(evidenceDirectory(root), 'docker-build-check.json');

const createFixtureRoot = () => {
  const root = mkdtempSync(path.join(tmpdir(), 'lobsterai-p03-evidence-'));
  temporaryRoots.push(root);
  for (const relativePath of [
    'SKILLs',
    'openclaw-extensions',
    'package.json',
    'scripts/check-supply-chain.mjs',
    'docs/supply-chain/skills-and-plugins.manifest.json',
    'libs/shared/contracts/assets/supply-chain-inventory.schema.json',
    'src/main/computerUse/computerUseKit.ts',
    'src/main/computerUse/computerUseRuntime.ts',
    'src/shared/computerUse/constants.ts',
    'src/renderer/data/mcpRegistry.json',
    evidenceRelativeDirectory,
  ]) {
    const destination = path.join(root, relativePath);
    mkdirSync(path.dirname(destination), { recursive: true });
    cpSync(path.join(repositoryRoot, relativePath), destination, { recursive: true });
  }
  symlinkSync(path.join(repositoryRoot, 'node_modules'), path.join(root, 'node_modules'), 'junction');

  const report = readJson(reportPath(root));
  for (const image of report.images) {
    image.sbom.path = path.basename(image.sbom.path);
    image.vulnerabilityScan.path = path.basename(image.vulnerabilityScan.path);
  }
  writeJson(reportPath(root), report);

  const gitCommonDirectory = spawnSync(
    'git',
    ['rev-parse', '--path-format=absolute', '--git-common-dir'],
    { cwd: repositoryRoot, encoding: 'utf8' },
  ).stdout.trim();
  expect(spawnSync('git', ['init', '--quiet'], { cwd: root }).status).toBe(0);
  const alternatesPath = path.join(root, '.git/objects/info/alternates');
  mkdirSync(path.dirname(alternatesPath), { recursive: true });
  writeFileSync(alternatesPath, `${path.join(gitCommonDirectory, 'objects')}\n`);
  expect(spawnSync('git', ['update-ref', 'refs/heads/fixture', evidenceSourceSha], { cwd: root }).status).toBe(0);
  expect(spawnSync('git', ['symbolic-ref', 'HEAD', 'refs/heads/fixture'], { cwd: root }).status).toBe(0);
  return root;
};

const runChecker = (root: string, environment: NodeJS.ProcessEnv = process.env) => spawnSync(
  process.execPath,
  ['scripts/check-supply-chain.mjs'],
  { cwd: root, encoding: 'utf8', env: environment },
);

const mutateEvidenceDocument = (
  root: string,
  imageName: string,
  kind: 'sbom' | 'vulnerabilityScan',
  mutate: (document: Record<string, any>) => void,
) => {
  const report = readJson(reportPath(root));
  const image = report.images.find((candidate: Record<string, unknown>) => candidate.imageName === imageName);
  const documentPath = path.join(evidenceDirectory(root), image[kind].path);
  const document = readJson(documentPath);
  mutate(document);
  writeJson(documentPath, document);
  image[kind].sha256 = sha256File(documentPath);
  writeJson(reportPath(root), report);
};

afterEach(() => {
  temporaryRoots.splice(0).forEach(root => rmSync(root, { recursive: true, force: true }));
});

describe('P03 on-disk supply-chain evidence verification', () => {
  test('accepts the unmodified exact-five evidence fixture', () => {
    const result = runChecker(createFixtureRoot());
    expect(result.status, `${result.stdout}\n${result.stderr}`).toBe(0);
  });

  const mutations: Array<{
    name: string;
    mutate: (root: string) => void;
  }> = [
    {
      name: 'unknown report root property',
      mutate: root => {
        const report = readJson(reportPath(root));
        report.unexpectedRoot = true;
        writeJson(reportPath(root), report);
      },
    },
    {
      name: 'unknown nested runtime property',
      mutate: root => {
        const report = readJson(reportPath(root));
        report.images[0].runtimeEvidence.unexpectedNested = true;
        writeJson(reportPath(root), report);
      },
    },
    {
      name: 'missing SBOM path',
      mutate: root => {
        const report = readJson(reportPath(root));
        report.images[0].sbom.path = 'missing.spdx.json';
        writeJson(reportPath(root), report);
      },
    },
    {
      name: 'SBOM path outside the evidence directory',
      mutate: root => {
        const report = readJson(reportPath(root));
        const source = path.join(evidenceDirectory(root), report.images[0].sbom.path);
        const outside = path.join(evidenceDirectory(root), '..', 'outside.spdx.json');
        cpSync(source, outside);
        report.images[0].sbom.path = '../outside.spdx.json';
        report.images[0].sbom.sha256 = sha256File(outside);
        writeJson(reportPath(root), report);
      },
    },
    {
      name: 'symlinked SBOM path',
      mutate: root => {
        const report = readJson(reportPath(root));
        const link = path.join(evidenceDirectory(root), 'linked.spdx.json');
        symlinkSync(report.images[0].sbom.path, link);
        report.images[0].sbom.path = path.basename(link);
        writeJson(reportPath(root), report);
      },
    },
    {
      name: 'non-regular SBOM path',
      mutate: root => {
        const report = readJson(reportPath(root));
        mkdirSync(path.join(evidenceDirectory(root), 'directory.spdx.json'));
        report.images[0].sbom.path = 'directory.spdx.json';
        writeJson(reportPath(root), report);
      },
    },
    {
      name: 'invalid SBOM JSON with coordinated hash',
      mutate: root => {
        const report = readJson(reportPath(root));
        const target = path.join(evidenceDirectory(root), report.images[0].sbom.path);
        writeFileSync(target, 'not an SPDX document\n');
        report.images[0].sbom.sha256 = sha256File(target);
        writeJson(reportPath(root), report);
      },
    },
    {
      name: 'wrong SPDX structure with coordinated hash',
      mutate: root => {
        const report = readJson(reportPath(root));
        const target = path.join(evidenceDirectory(root), report.images[0].sbom.path);
        writeJson(target, { spdxVersion: 'SPDX-2.3' });
        report.images[0].sbom.sha256 = sha256File(target);
        writeJson(reportPath(root), report);
      },
    },
    {
      name: 'invalid Grype JSON with coordinated hash',
      mutate: root => {
        const report = readJson(reportPath(root));
        const target = path.join(evidenceDirectory(root), report.images[0].vulnerabilityScan.path);
        writeFileSync(target, 'not a Grype report\n');
        report.images[0].vulnerabilityScan.sha256 = sha256File(target);
        writeJson(reportPath(root), report);
      },
    },
    {
      name: 'wrong Grype structure with coordinated hash',
      mutate: root => {
        const report = readJson(reportPath(root));
        const target = path.join(evidenceDirectory(root), report.images[0].vulnerabilityScan.path);
        writeJson(target, { matches: [] });
        report.images[0].vulnerabilityScan.sha256 = sha256File(target);
        writeJson(reportPath(root), report);
      },
    },
    {
      name: 'SBOM file hash drift',
      mutate: root => {
        const report = readJson(reportPath(root));
        const target = path.join(evidenceDirectory(root), report.images[0].sbom.path);
        writeFileSync(target, `${readFileSync(target, 'utf8')} `);
      },
    },
    {
      name: 'SPDX subject drift with coordinated hash',
      mutate: root => mutateEvidenceDocument(root, 'web', 'sbom', document => {
        document.name = 'ghost-image';
        const described = document.relationships.find(
          (relationship: Record<string, string>) => relationship.relationshipType === 'DESCRIBES',
        );
        const rootPackage = document.packages.find(
          (candidate: Record<string, string>) => candidate.SPDXID === described.relatedSpdxElement,
        );
        rootPackage.name = 'ghost-image';
      }),
    },
    {
      name: 'SPDX source tag drift with coordinated hash',
      mutate: root => mutateEvidenceDocument(root, 'web', 'sbom', document => {
        const described = document.relationships.find(
          (relationship: Record<string, string>) => relationship.relationshipType === 'DESCRIBES',
        );
        const rootPackage = document.packages.find(
          (candidate: Record<string, string>) => candidate.SPDXID === described.relatedSpdxElement,
        );
        rootPackage.versionInfo = 'ffffffffffff';
      }),
    },
    {
      name: 'Grype source tag drift with coordinated hash',
      mutate: root => mutateEvidenceDocument(root, 'web', 'vulnerabilityScan', document => {
        document.source.target.userInput = 'lobsterai-p03-web:ffffffffffff';
        document.source.target.tags = ['lobsterai-p03-web:ffffffffffff'];
      }),
    },
    {
      name: 'Grype repository digest drift with coordinated hash',
      mutate: root => mutateEvidenceDocument(root, 'web', 'vulnerabilityScan', document => {
        document.source.target.repoDigests = [`lobsterai-p03-web@sha256:${'f'.repeat(64)}`];
      }),
    },
    {
      name: 'Grype manifest digest drift from SPDX subject with coordinated hash',
      mutate: root => mutateEvidenceDocument(root, 'web', 'vulnerabilityScan', document => {
        document.source.target.manifestDigest = `sha256:${'f'.repeat(64)}`;
      }),
    },
    {
      name: 'wrapper findings cleared while Grype matches remain',
      mutate: root => {
        const report = readJson(reportPath(root));
        report.images[0].vulnerabilityScan.findings = [];
        writeJson(reportPath(root), report);
      },
    },
    {
      name: 'coordinated nonexistent image digest',
      mutate: root => {
        const report = readJson(reportPath(root));
        const image = report.images.find((candidate: Record<string, string>) => candidate.imageName === 'web');
        const digest = `sha256:${'f'.repeat(64)}`;
        image.digest = digest;
        image.image = image.image.replace(/sha256:[a-f0-9]{64}$/, digest);
        image.sbom.imageDigest = digest;
        image.vulnerabilityScan.imageDigest = digest;
        const scanPath = path.join(evidenceDirectory(root), image.vulnerabilityScan.path);
        const scan = readJson(scanPath);
        scan.source.target.repoDigests = [`lobsterai-p03-web@${digest}`];
        writeJson(scanPath, scan);
        image.vulnerabilityScan.sha256 = sha256File(scanPath);
        writeJson(reportPath(root), report);
      },
    },
    {
      name: 'critical count differs from coordinated Grype findings',
      mutate: root => {
        const report = readJson(reportPath(root));
        const image = report.images.find((candidate: Record<string, string>) => candidate.imageName === 'web');
        const scanPath = path.join(evidenceDirectory(root), image.vulnerabilityScan.path);
        const scan = readJson(scanPath);
        scan.matches[0].vulnerability.severity = 'Critical';
        writeJson(scanPath, scan);
        image.vulnerabilityScan.sha256 = sha256File(scanPath);
        image.vulnerabilityScan.findings[0].severity = 'Critical';
        image.criticalFindings = 0;
        const manifestPath = path.join(root, 'docs/supply-chain/skills-and-plugins.manifest.json');
        const manifest = readJson(manifestPath);
        manifest.waivers = [{
          findingId: image.vulnerabilityScan.findings[0].id,
          imageDigest: image.digest,
          owner: 'security',
          reason: 'count reconciliation fixture',
          expiresAt: '2099-01-01T00:00:00Z',
        }];
        writeJson(manifestPath, manifest);
        writeJson(reportPath(root), report);
      },
    },
  ];

  test.each(mutations)('rejects $name', ({ mutate }) => {
    const root = createFixtureRoot();
    mutate(root);
    const result = runChecker(root);
    expect(result.status, `${result.stdout}\n${result.stderr}`).not.toBe(0);
  });

  test('resolves the latest product source while allowing docs-only review commits', async () => {
    const policy = await import('../scripts/check-supply-chain.mjs') as Record<string, unknown>;
    expect(policy.resolveProductSourceSha).toEqual(expect.any(Function));
    const resolveProductSourceSha = policy.resolveProductSourceSha as (root: string) => string;
    expect(resolveProductSourceSha(repositoryRoot)).toBe(evidenceSourceSha);
  });

  test('declares machine-readable OpenClaw plugin installation evidence', () => {
    const schema = readFileSync(
      path.join(repositoryRoot, 'libs/shared/contracts/assets/supply-chain-inventory.schema.json'),
      'utf8',
    );
    const dockerChecker = readFileSync(path.join(repositoryRoot, 'scripts/check-docker-build.mjs'), 'utf8');
    expect(schema).toContain('pluginInstallations');
    expect(dockerChecker).toContain('pluginInstallations');
  });

  test('does not claim every declared plugin installed after optional skips', () => {
    const installer = readFileSync(path.join(repositoryRoot, 'scripts/ensure-openclaw-plugins.cjs'), 'utf8');
    expect(installer).not.toContain('All ${plugins.length} plugin(s) installed successfully.');
    expect(installer).toContain('skipped');
  });

  test.each([
    {
      name: 'missing required runtime field',
      mutate: (report: Record<string, any>) => delete report.images[0].runtimeEvidence.status,
    },
    {
      name: 'wrong Critical count type',
      mutate: (report: Record<string, any>) => { report.images[0].criticalFindings = '0'; },
    },
    {
      name: 'unknown plugin installation field',
      mutate: (report: Record<string, any>) => {
        const openClaw = report.images.find(
          (image: Record<string, string>) => image.imageName === 'openclaw-runtime',
        );
        openClaw.pluginInstallations[0].directoryPresent = true;
      },
    },
  ])('rejects schema corner: $name', ({ mutate }) => {
    const root = createFixtureRoot();
    const report = readJson(reportPath(root));
    mutate(report);
    writeJson(reportPath(root), report);
    const result = runChecker(root);
    expect(result.status, `${result.stdout}\n${result.stderr}`).not.toBe(0);
  });

  test('rejects absolute and FIFO evidence paths without reading the FIFO', () => {
    const absoluteRoot = createFixtureRoot();
    const absoluteReport = readJson(reportPath(absoluteRoot));
    absoluteReport.images[0].sbom.path = path.join(evidenceDirectory(absoluteRoot), 'web.spdx.json');
    writeJson(reportPath(absoluteRoot), absoluteReport);
    const absolute = runChecker(absoluteRoot);
    expect(absolute.status, `${absolute.stdout}\n${absolute.stderr}`).not.toBe(0);

    const fifoRoot = createFixtureRoot();
    const fifoReport = readJson(reportPath(fifoRoot));
    const fifoName = 'evidence.fifo';
    const fifoPath = path.join(evidenceDirectory(fifoRoot), fifoName);
    const mkfifo = spawnSync('mkfifo', [fifoPath], { encoding: 'utf8' });
    expect(mkfifo.status, mkfifo.stderr).toBe(0);
    fifoReport.images[0].sbom.path = fifoName;
    writeJson(reportPath(fifoRoot), fifoReport);
    const startedAt = Date.now();
    const fifo = runChecker(fifoRoot);
    expect(Date.now() - startedAt).toBeLessThan(5_000);
    expect(fifo.status, `${fifo.stdout}\n${fifo.stderr}`).not.toBe(0);
  });

  test('rejects a valid SBOM file replacement even when its hash is coordinated', () => {
    const root = createFixtureRoot();
    const report = readJson(reportPath(root));
    const web = report.images.find((image: Record<string, string>) => image.imageName === 'web');
    const api = report.images.find((image: Record<string, string>) => image.imageName === 'api');
    const webPath = path.join(evidenceDirectory(root), web.sbom.path);
    cpSync(path.join(evidenceDirectory(root), api.sbom.path), webPath);
    web.sbom.sha256 = sha256File(webPath);
    writeJson(reportPath(root), report);
    const result = runChecker(root);
    expect(result.status, `${result.stdout}\n${result.stderr}`).not.toBe(0);
  });

  test.each([
    {
      name: 'multiple SPDX subjects',
      mutate: (document: Record<string, any>) => {
        const describes = document.relationships.find(
          (relationship: Record<string, string>) => relationship.relationshipType === 'DESCRIBES',
        );
        document.relationships.push(structuredClone(describes));
      },
    },
    {
      name: 'missing SPDX subject relationship',
      mutate: (document: Record<string, any>) => {
        document.relationships = document.relationships.filter(
          (relationship: Record<string, string>) => relationship.relationshipType !== 'DESCRIBES',
        );
      },
    },
    {
      name: 'duplicate SPDX package identity',
      mutate: (document: Record<string, any>) => {
        const describes = document.relationships.find(
          (relationship: Record<string, string>) => relationship.relationshipType === 'DESCRIBES',
        );
        const rootPackage = document.packages.find(
          (candidate: Record<string, string>) => candidate.SPDXID === describes.relatedSpdxElement,
        );
        document.packages.push(structuredClone(rootPackage));
      },
    },
  ])('rejects $name with a coordinated file hash', ({ mutate }) => {
    const root = createFixtureRoot();
    mutateEvidenceDocument(root, 'web', 'sbom', mutate);
    const result = runChecker(root);
    expect(result.status, `${result.stdout}\n${result.stderr}`).not.toBe(0);
  });

  test('rejects duplicate raw Grype matches even when wrapper findings are duplicated identically', () => {
    const root = createFixtureRoot();
    const report = readJson(reportPath(root));
    const web = report.images.find((image: Record<string, string>) => image.imageName === 'web');
    const scanPath = path.join(evidenceDirectory(root), web.vulnerabilityScan.path);
    const scan = readJson(scanPath);
    const duplicatedMatch = structuredClone(scan.matches[0]);
    scan.matches.push(duplicatedMatch);
    writeJson(scanPath, scan);
    web.vulnerabilityScan.sha256 = sha256File(scanPath);
    web.vulnerabilityScan.findings.push({
      id: duplicatedMatch.vulnerability.id,
      severity: duplicatedMatch.vulnerability.severity,
      package: duplicatedMatch.artifact.name,
      version: duplicatedMatch.artifact.version,
    });
    writeJson(reportPath(root), report);
    const result = runChecker(root);
    expect(result.status, `${result.stdout}\n${result.stderr}`).not.toBe(0);
  });

  test('rejects duplicate Grype vulnerability/package identity even when severity differs', () => {
    const root = createFixtureRoot();
    const report = readJson(reportPath(root));
    const web = report.images.find((image: Record<string, string>) => image.imageName === 'web');
    const scanPath = path.join(evidenceDirectory(root), web.vulnerabilityScan.path);
    const scan = readJson(scanPath);
    const duplicatedMatch = structuredClone(scan.matches[0]);
    duplicatedMatch.vulnerability.severity = 'Unknown';
    scan.matches.push(duplicatedMatch);
    writeJson(scanPath, scan);
    web.vulnerabilityScan.sha256 = sha256File(scanPath);
    web.vulnerabilityScan.findings.push({
      id: duplicatedMatch.vulnerability.id,
      severity: duplicatedMatch.vulnerability.severity,
      package: duplicatedMatch.artifact.name,
      version: duplicatedMatch.artifact.version,
    });
    writeJson(reportPath(root), report);
    const result = runChecker(root);
    expect(result.status, `${result.stdout}\n${result.stderr}`).not.toBe(0);
  });

  test('rejects unavailable and digest-drifted local Docker image metadata', () => {
    const missingRoot = createFixtureRoot();
    const missingBin = path.join(missingRoot, 'bin');
    mkdirSync(missingBin);
    const missingDocker = path.join(missingBin, 'docker');
    writeFileSync(missingDocker, '#!/bin/sh\nexit 1\n');
    chmodSync(missingDocker, 0o755);
    const missing = runChecker(missingRoot, {
      ...process.env,
      PATH: `${missingBin}:${process.env.PATH ?? ''}`,
    });
    expect(`${missing.stdout}\n${missing.stderr}`).toContain('bound local Docker image is unavailable');
    expect(missing.status).not.toBe(0);

    const driftRoot = createFixtureRoot();
    const driftBin = path.join(driftRoot, 'bin');
    mkdirSync(driftBin);
    const driftDocker = path.join(driftBin, 'docker');
    writeFileSync(driftDocker, [
      '#!/bin/sh',
      `printf '%s\\n' '{"Id":"sha256:${'0'.repeat(64)}","RepoDigests":[]}'`,
      '',
    ].join('\n'));
    chmodSync(driftDocker, 0o755);
    const drift = runChecker(driftRoot, {
      ...process.env,
      PATH: `${driftBin}:${process.env.PATH ?? ''}`,
    });
    expect(`${drift.stdout}\n${drift.stderr}`).toContain('local Docker image digest does not match evidence');
    expect(drift.status).not.toBe(0);
  });

  test.each([
    {
      name: 'required plugin skipped',
      mutate: (installations: Array<Record<string, unknown>>) => {
        installations.find(plugin => plugin.id === 'openclaw-netease-bee')!.status = 'skipped';
      },
    },
    {
      name: 'duplicate plugin declaration replacing another declared ID',
      mutate: (installations: Array<Record<string, unknown>>) => {
        installations[1] = structuredClone(installations[0]);
      },
    },
    {
      name: 'unknown plugin replacing a declared ID',
      mutate: (installations: Array<Record<string, unknown>>) => {
        installations[0].id = 'unknown-plugin';
      },
    },
    {
      name: 'optional plugin claimed installed while absent from the bound final image',
      mutate: (installations: Array<Record<string, unknown>>) => {
        installations.find(plugin => plugin.id === 'moltbot-popo')!.status = 'installed';
      },
    },
    {
      name: 'optional plugin claimed skipped while present in the bound final image',
      mutate: (installations: Array<Record<string, unknown>>) => {
        installations.find(plugin => plugin.id === 'openclaw-nim-channel')!.status = 'skipped';
      },
    },
  ])('rejects plugin installation drift: $name', ({ mutate }) => {
    const root = createFixtureRoot();
    const report = readJson(reportPath(root));
    const openClaw = report.images.find(
      (image: Record<string, string>) => image.imageName === 'openclaw-runtime',
    );
    mutate(openClaw.pluginInstallations);
    writeJson(reportPath(root), report);
    const result = runChecker(root);
    expect(result.status, `${result.stdout}\n${result.stderr}`).not.toBe(0);
  });
});
