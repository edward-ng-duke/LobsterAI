import { readFileSync } from 'node:fs';
import path from 'node:path';

import { parseJsonRejectingDuplicateKeys } from '../json-without-duplicate-keys.mjs';

export const ApprovedPostgresPlatform = Object.freeze({
  Amd64: 'linux/amd64',
  Arm64: 'linux/arm64',
});

export const PostgresImagePolicyErrorCode = Object.freeze({
  InvalidManifest: 'POSTGRES_IMAGE_INVALID_MANIFEST',
  UnsupportedPlatform: 'POSTGRES_IMAGE_UNSUPPORTED_PLATFORM',
  ArchitectureMismatch: 'POSTGRES_IMAGE_ARCHITECTURE_MISMATCH',
  InspectionMismatch: 'POSTGRES_IMAGE_INSPECTION_MISMATCH',
  ServerSettingsMismatch: 'POSTGRES_SERVER_SETTINGS_MISMATCH',
  DockerProviderUnavailable: 'POSTGRES_DOCKER_PROVIDER_UNAVAILABLE',
  ImageUnavailable: 'POSTGRES_IMAGE_UNAVAILABLE',
});

export const POSTGRES_IMAGE_MANIFEST_RELATIVE_PATH =
  'tests/integration/db/postgres-image.json';

const approvedPlatformOrder = [
  ApprovedPostgresPlatform.Amd64,
  ApprovedPostgresPlatform.Arm64,
];
const imageName = 'postgres:17.10-bookworm';
const digestPattern = /^sha256:[a-f0-9]{64}$/;
const rootFields = [
  'schemaVersion',
  'image',
  'serverMajor',
  'serverVersion',
  'distribution',
  'platforms',
];
const platformFields = ['platform', 'digest', 'immutableReference'];
const expectedServerSettings = Object.freeze({
  lcCollate: 'en_US.utf8',
  lcCtype: 'en_US.utf8',
  timezone: 'Etc/UTC',
  ssl: 'off',
});

class PostgresImagePolicyError extends Error {
  constructor(code, message, blocked) {
    super(message);
    this.name = 'PostgresImagePolicyError';
    this.code = code;
    this.blocked = blocked;
    this.exitCode = blocked ? 2 : 1;
  }
}

export const createPostgresImagePolicyError = (code, message, blocked, cause) => {
  const error = new PostgresImagePolicyError(code, message, blocked);
  if (cause !== undefined) error.cause = cause;
  return error;
};

const invalidManifest = (message, cause) => {
  const error = new PostgresImagePolicyError(
    PostgresImagePolicyErrorCode.InvalidManifest,
    message,
    false,
  );
  if (cause !== undefined) error.cause = cause;
  return error;
};

const failedPolicy = (code, message) =>
  new PostgresImagePolicyError(code, message, false);

const blockedPlatform = (code, message) =>
  new PostgresImagePolicyError(code, message, true);

const isRecord = (value) =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const hasExactFields = (value, expectedFields) => {
  if (!isRecord(value)) return false;
  const keys = Object.keys(value);
  return keys.length === expectedFields.length && expectedFields.every((field) => keys.includes(field));
};

export const normalizeDockerPlatform = (value) => {
  switch (value) {
    case 'linux/amd64':
    case 'linux/x86_64':
    case 'x64':
    case 'amd64':
    case 'x86_64':
      return ApprovedPostgresPlatform.Amd64;
    case 'linux/arm64':
    case 'linux/aarch64':
    case 'arm64':
    case 'aarch64':
      return ApprovedPostgresPlatform.Arm64;
    default:
      return null;
  }
};

const validateManifest = (manifest) => {
  if (!hasExactFields(manifest, rootFields)) {
    throw invalidManifest('PostgreSQL image manifest root fields are invalid');
  }
  if (
    manifest.schemaVersion !== 2 ||
    manifest.image !== imageName ||
    manifest.serverMajor !== 17 ||
    manifest.serverVersion !== '17.10' ||
    manifest.distribution !== 'Debian bookworm'
  ) {
    throw invalidManifest('PostgreSQL image manifest policy values are invalid');
  }
  if (!Array.isArray(manifest.platforms) || manifest.platforms.length !== approvedPlatformOrder.length) {
    throw invalidManifest('PostgreSQL image manifest must contain exactly two platforms');
  }

  manifest.platforms.forEach((entry, index) => {
    if (!hasExactFields(entry, platformFields)) {
      throw invalidManifest(`PostgreSQL image platform entry ${index} fields are invalid`);
    }
    if (entry.platform !== approvedPlatformOrder[index]) {
      throw invalidManifest(`PostgreSQL image platform ${index} must be ${approvedPlatformOrder[index]}`);
    }
    if (!digestPattern.test(entry.digest)) {
      throw invalidManifest(`PostgreSQL image digest for ${entry.platform} is invalid`);
    }
    if (entry.immutableReference !== `${manifest.image}@${entry.digest}`) {
      throw invalidManifest(`PostgreSQL immutable reference for ${entry.platform} is invalid`);
    }
  });

  return manifest;
};

export const loadPostgresImageManifest = (root) => {
  const manifestPath = path.join(root, POSTGRES_IMAGE_MANIFEST_RELATIVE_PATH);
  let manifest;
  try {
    manifest = parseJsonRejectingDuplicateKeys(readFileSync(manifestPath, 'utf8'));
  } catch (error) {
    throw invalidManifest(`PostgreSQL image manifest cannot be parsed: ${error.message}`, error);
  }
  return validateManifest(manifest);
};

export const selectApprovedPostgresImage = (manifest, dockerPlatform, nodeArch) => {
  const validatedManifest = validateManifest(manifest);
  const normalizedDockerPlatform = normalizeDockerPlatform(dockerPlatform);
  const normalizedNodePlatform = normalizeDockerPlatform(nodeArch);
  if (!normalizedDockerPlatform || !normalizedNodePlatform) {
    throw blockedPlatform(
      PostgresImagePolicyErrorCode.UnsupportedPlatform,
      `unsupported PostgreSQL platform: Docker=${dockerPlatform}, Node=${nodeArch}`,
    );
  }
  if (normalizedDockerPlatform !== normalizedNodePlatform) {
    throw blockedPlatform(
      PostgresImagePolicyErrorCode.ArchitectureMismatch,
      `PostgreSQL platform drift: Docker=${normalizedDockerPlatform}, Node=${normalizedNodePlatform}`,
    );
  }

  const selected = validatedManifest.platforms.find(
    (entry) => entry.platform === normalizedDockerPlatform,
  );
  if (!selected) {
    throw blockedPlatform(
      PostgresImagePolicyErrorCode.UnsupportedPlatform,
      `PostgreSQL platform is not approved: ${normalizedDockerPlatform}`,
    );
  }
  return selected;
};

export const validateApprovedPostgresImageInspection = (selected, inspected) => {
  const inspectedPlatform = normalizeDockerPlatform(`${inspected?.Os}/${inspected?.Architecture}`);
  if (inspectedPlatform !== selected.platform) {
    throw failedPolicy(
      PostgresImagePolicyErrorCode.InspectionMismatch,
      `inspected PostgreSQL platform does not match ${selected.platform}`,
    );
  }
  const repoDigests = inspected?.RepoDigests;
  if (!Array.isArray(repoDigests) || !repoDigests.some((value) =>
    typeof value === 'string' && value.endsWith(`@${selected.digest}`))) {
    throw failedPolicy(
      PostgresImagePolicyErrorCode.InspectionMismatch,
      'inspected PostgreSQL RepoDigests do not contain the approved digest',
    );
  }
  return {
    inspectedOs: inspected.Os,
    inspectedArch: inspected.Architecture,
    repoDigests,
  };
};

export const validatePostgresServerSettings = (manifest, settings) => {
  const validatedManifest = validateManifest(manifest);
  const serverVersion = String(settings?.serverVersion ?? '');
  const serverMajor = Number.parseInt(serverVersion.split('.')[0] ?? '', 10);
  const versionMatches = serverMajor === validatedManifest.serverMajor &&
    (serverVersion === validatedManifest.serverVersion ||
      serverVersion.startsWith(`${validatedManifest.serverVersion} `));
  if (!versionMatches) {
    throw failedPolicy(
      PostgresImagePolicyErrorCode.ServerSettingsMismatch,
      `PostgreSQL server version differs from ${validatedManifest.serverVersion}`,
    );
  }
  for (const [field, expected] of Object.entries(expectedServerSettings)) {
    if (settings?.[field] !== expected) {
      throw failedPolicy(
        PostgresImagePolicyErrorCode.ServerSettingsMismatch,
        `PostgreSQL ${field} differs from ${expected}`,
      );
    }
  }
  return {
    serverVersion,
    serverMajor,
    ...expectedServerSettings,
  };
};
