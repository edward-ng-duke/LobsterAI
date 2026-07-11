import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { afterEach, describe, expect, test } from 'vitest';

import { verifyHardenedDependency } from '../scripts/harden-openclaw-runtime-dependencies.mjs';

const temporaryRoots: string[] = [];
const integrity = 'sha512-KrGhL9Q4zjj0kiUt5OO4Mr/A/jlI2jDYs5eHBpYHPcBEVSiipAvn2Ko2HnPe20rmcuuvMHNdZFp+4IlGTMF0Ow==';

const makePluginRoot = (version = '4.0.4', lockIntegrity = integrity): string => {
  const root = mkdtempSync(path.join(tmpdir(), 'lobsterai-p03-dingtalk-hardening-'));
  temporaryRoots.push(root);
  const packageRoot = path.join(root, 'node_modules/form-data');
  mkdirSync(packageRoot, { recursive: true });
  writeFileSync(path.join(packageRoot, 'package.json'), JSON.stringify({ name: 'form-data', version }));
  writeFileSync(path.join(root, 'package-lock.json'), JSON.stringify({
    lockfileVersion: 3,
    packages: {
      '': { name: 'dingtalk-connector' },
      'node_modules/form-data': { version, integrity: lockIntegrity },
    },
  }));
  return root;
};

afterEach(() => {
  temporaryRoots.splice(0).forEach(root => rmSync(root, { recursive: true, force: true }));
});

describe('P03 OpenClaw dependency hardening', () => {
  test('accepts only the pinned form-data version and registry integrity', () => {
    expect(verifyHardenedDependency(makePluginRoot())).toEqual([]);
    expect(verifyHardenedDependency(makePluginRoot('4.0.0')).join('\n'))
      .toContain('version must be 4.0.4');
    expect(verifyHardenedDependency(makePluginRoot('4.0.4', 'sha512-tampered')).join('\n'))
      .toContain('integrity mismatch');
  });
});
