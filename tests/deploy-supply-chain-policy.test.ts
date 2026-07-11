import {
  cpSync,
  existsSync,
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

import {
  buildManifest,
  discoverAssets,
  validateEvidence,
  validateInventory,
  validateScanReport,
} from '../scripts/check-supply-chain.mjs';

const repositoryRoot = path.resolve(import.meta.dirname, '..');
const manifestPath = path.join(repositoryRoot, 'docs', 'supply-chain', 'skills-and-plugins.manifest.json');
const schemaPath = path.join(
  repositoryRoot,
  'libs',
  'shared',
  'contracts',
  'assets',
  'supply-chain-inventory.schema.json',
);
const temporaryRoots: string[] = [];

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

afterEach(() => {
  temporaryRoots.splice(0).forEach(root => rmSync(root, { recursive: true, force: true }));
});

describe('P03 supply-chain inventory and evidence policy', () => {
  test('inventory is active, non-empty, deterministic and covers every asset kind', () => {
    const manifest = JSON.parse(readFileSync(manifestPath, 'utf8')) as {
      status?: string;
      assets?: Array<{ id?: string; kind?: string; sourcePath?: string; integrity?: string }>;
    };
    expect(manifest.status).toBe('ACTIVE');
    expect(manifest.assets?.length).toBeGreaterThan(0);
    expect(new Set(manifest.assets?.map(asset => asset.kind))).toEqual(
      new Set(['skill', 'openclaw-plugin', 'openclaw-extension', 'kit', 'mcp-package']),
    );
    expect(manifest.assets?.every(asset => asset.id && asset.sourcePath && asset.integrity)).toBe(true);
    const ids = manifest.assets?.map(asset => asset.id) ?? [];
    expect(ids).toEqual([...ids].sort((left, right) => left.localeCompare(right)));
    expect(new Set(ids.map(id => id.toLocaleLowerCase())).size).toBe(ids.length);
  });

  test('schema and policy fixtures cover digest, SBOM, signature, waiver and critical findings', () => {
    const schema = readFileSync(schemaPath, 'utf8');
    for (const field of ['assets', 'integrity', 'scanStatus', 'imageEvidence', 'sbom', 'signature', 'waivers']) {
      expect(schema).toContain(`"${field}"`);
    }
    for (const fixture of [
      'critical-finding.json',
      'digest-mismatch.json',
      'expired-waiver.json',
      'latest-plugin.json',
      'unapproved-source.json',
    ]) {
      expect(existsSync(path.join(repositoryRoot, 'tests', 'fixtures', 'supply_chain', fixture))).toBe(true);
    }
  });

  test('real checkers exist and P00 placeholder language has been removed', () => {
    for (const checker of ['check-docker-build.mjs', 'check-helm.mjs', 'check-supply-chain.mjs']) {
      expect(existsSync(path.join(repositoryRoot, 'scripts', checker))).toBe(true);
    }
    expect(readFileSync(manifestPath, 'utf8')).not.toContain('NOT_APPLICABLE');
    expect(readFileSync(path.join(repositoryRoot, 'docs', 'supply-chain', 'README.md'), 'utf8'))
      .not.toContain('NOT_APPLICABLE');
  });

  test('bidirectional reconciliation rejects missing, ghost, duplicate and case-colliding assets', () => {
    const baseline = buildManifest(repositoryRoot);
    expect(validateInventory(repositoryRoot, baseline)).toEqual([]);

    const missing = clone(baseline);
    missing.assets.shift();
    expect(validateInventory(repositoryRoot, missing).join('\n')).toContain('missing discovered asset');

    const ghost = clone(baseline);
    ghost.assets.push({ ...ghost.assets.at(-1)!, id: 'skill:zz-ghost' });
    expect(validateInventory(repositoryRoot, ghost).join('\n')).toContain('ghost asset');

    const duplicate = clone(baseline);
    duplicate.assets.splice(1, 0, clone(duplicate.assets[0]));
    expect(validateInventory(repositoryRoot, duplicate).join('\n')).toContain('duplicate inventory asset ID');

    const caseCollision = clone(baseline);
    caseCollision.assets.splice(1, 0, { ...caseCollision.assets[0], id: caseCollision.assets[0].id.toUpperCase() });
    expect(validateInventory(repositoryRoot, caseCollision).join('\n')).toContain('case-insensitive inventory asset collision');
  });

  test('policy rejects production latest, critical findings, digest drift, expired waivers and fake trust', () => {
    const latest = JSON.parse(readFileSync(
      path.join(repositoryRoot, 'tests', 'fixtures', 'supply_chain', 'latest-plugin.json'),
      'utf8',
    )) as Record<string, unknown>;
    const manifest = buildManifest(repositoryRoot);
    manifest.assets.push({
      ...latest,
      license: 'MIT',
      scanStatus: 'platform-reviewed',
      productionEligible: true,
      optional: false,
    } as typeof manifest.assets[number]);
    expect(validateInventory(repositoryRoot, manifest).join('\n')).toContain('unpinned/latest');

    const critical = JSON.parse(readFileSync(
      path.join(repositoryRoot, 'tests', 'fixtures', 'supply_chain', 'critical-finding.json'),
      'utf8',
    )) as Parameters<typeof validateScanReport>[0];
    expect(validateScanReport(critical).join('\n')).toContain('critical finding');

    const evidence = buildManifest(repositoryRoot);
    evidence.imageEvidence.push({
      image: 'registry.internal/lobster-api@sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      digest: 'sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      sourceSha: '0123456789abcdef0123456789abcdef01234567',
      sbom: {
        format: 'spdx-json',
        path: 'lobster-api.spdx.json',
        sha256: 'sha256:cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc',
        imageDigest: 'sha256:bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
        sourceSha: '0123456789abcdef0123456789abcdef01234567',
      },
      criticalFindings: 0,
    });
    evidence.waivers.push(JSON.parse(readFileSync(
      path.join(repositoryRoot, 'tests', 'fixtures', 'supply_chain', 'expired-waiver.json'),
      'utf8',
    )));
    evidence.signature = {
      status: 'ACTIVE',
      reason: 'Mutation must fail without a trust identity.',
      requiredForPublish: true,
      trustedIdentities: [],
    };
    expect(validateEvidence(evidence, new Date('2026-07-11T00:00:00Z')).join('\n')).toEqual(
      expect.stringContaining('waiver is expired'),
    );
    expect(validateEvidence(evidence).join('\n')).toEqual(expect.stringContaining('SBOM digest mismatch'));
    expect(validateEvidence(evidence).join('\n')).toEqual(expect.stringContaining('trusted identities'));
  });

  test('asset discovery rejects a skill symlink that escapes the repository', () => {
    const root = mkdtempSync(path.join(tmpdir(), 'lobsterai-p03-inventory-'));
    temporaryRoots.push(root);
    for (const relativePath of [
      'SKILLs',
      'openclaw-extensions',
      'package.json',
      'src/main/computerUse/computerUseRuntime.ts',
      'src/renderer/data/mcpRegistry.json',
    ]) {
      mkdirSync(path.dirname(path.join(root, relativePath)), { recursive: true });
      cpSync(path.join(repositoryRoot, relativePath), path.join(root, relativePath), {
        recursive: true,
        filter: candidate => !candidate.includes(`${path.sep}node_modules${path.sep}`),
      });
    }
    const outside = path.join(tmpdir(), `lobsterai-p03-outside-${process.pid}.md`);
    temporaryRoots.push(outside);
    writeFileSync(outside, '---\nname: escaped\n---\n');
    mkdirSync(path.join(root, 'SKILLs', 'escaped'), { recursive: true });
    symlinkSync(outside, path.join(root, 'SKILLs', 'escaped', 'SKILL.md'));

    expect(discoverAssets(root).errors.join('\n')).toContain('escapes repository through symlink');
  });
});
