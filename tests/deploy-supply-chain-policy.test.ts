import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

import { describe, expect, test } from 'vitest';

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
});
