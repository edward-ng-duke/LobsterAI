import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { afterEach, describe, expect, test } from 'vitest';

import {
  PostgresImagePolicyErrorCode,
  loadPostgresImageManifest,
  normalizeDockerPlatform,
  selectApprovedPostgresImage,
} from '../../scripts/db/postgres-image-policy.mjs';

const amd64Digest = 'sha256:9cc09bb9a1b9da469658a6fab7bbced9ece6ca99174e1b93c1c4cc1a12f741cf';
const arm64Digest = 'sha256:17b6c778de50f4bb9a878c36e736110fbcd9b7020377d6fdfdf20f7c0347e40a';
const image = 'postgres:17.10-bookworm';
const temporaryRoots: string[] = [];

const manifest = () => ({
  schemaVersion: 2,
  image,
  serverMajor: 17,
  serverVersion: '17.10',
  distribution: 'Debian bookworm',
  platforms: [
    {
      platform: 'linux/amd64',
      digest: amd64Digest,
      immutableReference: `${image}@${amd64Digest}`,
    },
    {
      platform: 'linux/arm64',
      digest: arm64Digest,
      immutableReference: `${image}@${arm64Digest}`,
    },
  ],
});

const writeManifest = (source: string): string => {
  const root = mkdtempSync(path.join(tmpdir(), 'lobsterai-postgres-policy-'));
  temporaryRoots.push(root);
  mkdirSync(path.join(root, 'tests/integration/db'), { recursive: true });
  writeFileSync(path.join(root, 'tests/integration/db/postgres-image.json'), source);
  return root;
};

const expectFailedPolicy = (operation: () => unknown): void => {
  expect(operation).toThrow(expect.objectContaining({ blocked: false, exitCode: 1 }));
};

const expectBlockedPolicy = (operation: () => unknown): void => {
  expect(operation).toThrow(expect.objectContaining({ blocked: true, exitCode: 2 }));
};

afterEach(() => {
  temporaryRoots.splice(0).forEach((root) => rmSync(root, { recursive: true, force: true }));
});

describe('PostgreSQL image manifest v2 policy', () => {
  test('selects one exact digest for linux/amd64', () => {
    const selected = selectApprovedPostgresImage(manifest(), 'linux/amd64', 'x64');

    expect(selected).toEqual(manifest().platforms[0]);
  });

  test('preserves the accepted linux/arm64 digest', () => {
    const selected = selectApprovedPostgresImage(manifest(), 'linux/aarch64', 'arm64');

    expect(selected.digest).toBe(arm64Digest);
  });

  test('normalizes only approved native Linux and Node architecture spellings', () => {
    expect(normalizeDockerPlatform('linux/x86_64')).toBe('linux/amd64');
    expect(normalizeDockerPlatform('amd64')).toBe('linux/amd64');
    expect(normalizeDockerPlatform('linux/aarch64')).toBe('linux/arm64');
    expect(normalizeDockerPlatform('arm64')).toBe('linux/arm64');
    expect(normalizeDockerPlatform(' linux/amd64')).toBeNull();
    expect(normalizeDockerPlatform('LINUX/AMD64')).toBeNull();
    expect(normalizeDockerPlatform('linux/ppc64le')).toBeNull();
  });

  test('rejects duplicate platform entries', () => {
    const candidate = manifest();
    candidate.platforms[1] = { ...candidate.platforms[0] };

    expectFailedPolicy(() => loadPostgresImageManifest(writeManifest(JSON.stringify(candidate))));
  });

  test('blocks an unknown Docker platform', () => {
    expectBlockedPolicy(() => selectApprovedPostgresImage(manifest(), 'linux/ppc64le', 'x64'));
  });

  test('rejects Node and Docker architecture drift as blocked', () => {
    expectBlockedPolicy(() => selectApprovedPostgresImage(manifest(), 'linux/amd64', 'arm64'));
  });

  test('rejects digest and immutableReference mismatch', () => {
    const candidate = manifest();
    candidate.platforms[0].immutableReference = `${image}@${arm64Digest}`;

    expectFailedPolicy(() => loadPostgresImageManifest(writeManifest(JSON.stringify(candidate))));
  });

  test('rejects floating PostgreSQL tags and unknown fields', () => {
    const floating = { ...manifest(), image: 'postgres:17' };
    expectFailedPolicy(() => loadPostgresImageManifest(writeManifest(JSON.stringify(floating))));

    const unknown = { ...manifest(), latestDigest: amd64Digest };
    expectFailedPolicy(() => loadPostgresImageManifest(writeManifest(JSON.stringify(unknown))));
  });

  test('rejects duplicate JSON object keys before JSON.parse', () => {
    const source = JSON.stringify(manifest()).replace(
      '"schemaVersion":2',
      '"schemaVersion":2,"schemaVersion":2',
    );

    expectFailedPolicy(() => loadPostgresImageManifest(writeManifest(source)));
  });

  test.each([
    ['missing', () => ({ ...manifest(), platforms: manifest().platforms.slice(0, 1) })],
    ['extra', () => ({
      ...manifest(),
      platforms: [...manifest().platforms, {
        platform: 'linux/ppc64le',
        digest: amd64Digest,
        immutableReference: `${image}@${amd64Digest}`,
      }],
    })],
    ['reordered', () => ({ ...manifest(), platforms: manifest().platforms.reverse() })],
    ['non-Linux', () => ({
      ...manifest(),
      platforms: [
        { ...manifest().platforms[0], platform: 'darwin/amd64' },
        manifest().platforms[1],
      ],
    })],
  ])('rejects %s platform sets', (_label, createCandidate) => {
    expectFailedPolicy(() => loadPostgresImageManifest(
      writeManifest(JSON.stringify(createCandidate())),
    ));
  });

  test('classifies policy tampering as FAILED and unavailable platforms as BLOCKED', () => {
    try {
      loadPostgresImageManifest(writeManifest('{"schemaVersion":1}'));
      throw new Error('expected invalid policy to throw');
    } catch (error) {
      expect(error).toMatchObject({
        blocked: false,
        exitCode: 1,
        code: PostgresImagePolicyErrorCode.InvalidManifest,
      });
    }

    try {
      selectApprovedPostgresImage(manifest(), 'windows/amd64', 'x64');
      throw new Error('expected unavailable platform to throw');
    } catch (error) {
      expect(error).toMatchObject({
        blocked: true,
        exitCode: 2,
        code: PostgresImagePolicyErrorCode.UnsupportedPlatform,
      });
    }
  });
});
