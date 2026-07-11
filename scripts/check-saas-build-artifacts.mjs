import { createHash } from 'node:crypto';
import {
  existsSync,
  lstatSync,
  readFileSync,
  realpathSync,
  readdirSync,
  renameSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  expectedWorkspaceArtifacts,
  loadWorkspaceRegistry,
  validateWorkspaceRegistry,
} from './saas-workspace-policy.mjs';

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const { registry, registrySha256 } = loadWorkspaceRegistry(repositoryRoot);
const errors = validateWorkspaceRegistry(registry).map((error) => `invalid registry: ${error}`);
const startReportPath = path.join(repositoryRoot, '.reports/saas-build/build-start.json');
let startReport;
if (!existsSync(startReportPath)) {
  errors.push('missing current build-start report; run the clean build preflight');
} else {
  try {
    startReport = JSON.parse(readFileSync(startReportPath, 'utf8'));
  } catch {
    errors.push('build-start report is not valid JSON');
  }
}
if (
  startReport?.schemaVersion !== 1 ||
  startReport?.status !== 'STARTED' ||
  typeof startReport?.invocationId !== 'string' ||
  !Number.isFinite(startReport?.startedAtEpochMs) ||
  startReport?.registrySha256 !== registrySha256
) {
  errors.push('build-start report does not match the current registry/invocation contract');
}

const verifiedOutputs = [];
const buildStartedAt = startReport?.startedAtEpochMs ?? Number.POSITIVE_INFINITY;
const validationNow = Date.now();
// Filesystems and build hosts can have small clock differences. Five minutes is
// enough for expected skew while rejecting timestamps that cannot belong to this build.
const maxFutureClockSkewMs = 5 * 60 * 1_000;
const isWithin = (parentPath, childPath) => {
  const relativePath = path.relative(parentPath, childPath);
  return relativePath === '' || (!relativePath.startsWith(`..${path.sep}`) && relativePath !== '..' && !path.isAbsolute(relativePath));
};
const hasSymlinkComponent = (workspaceRoot, artifactPath) => {
  const relativePath = path.relative(workspaceRoot, artifactPath);
  if (!isWithin(workspaceRoot, artifactPath)) return true;
  let currentPath = workspaceRoot;
  for (const segment of relativePath.split(path.sep)) {
    currentPath = path.join(currentPath, segment);
    if (lstatSync(currentPath).isSymbolicLink()) return true;
  }
  return false;
};
for (const [workspace, patterns] of Object.entries(expectedWorkspaceArtifacts)) {
  const workspaceRoot = path.join(repositoryRoot, workspace);
  const realWorkspaceRoot = realpathSync(workspaceRoot);
  for (const pattern of patterns) {
    const wildcardMatch = pattern.match(/^(.*)\/\*\.([a-z0-9]+)$/i);
    let artifactPaths = [];
    if (wildcardMatch) {
      const directory = path.join(repositoryRoot, workspace, wildcardMatch[1]);
      const extension = `.${wildcardMatch[2]}`;
      if (existsSync(directory)) {
        artifactPaths = readdirSync(directory, { withFileTypes: true })
          .filter((entry) => entry.isFile() && entry.name.endsWith(extension))
          .map((entry) => path.join(directory, entry.name));
      }
    } else {
      const artifactPath = path.join(repositoryRoot, workspace, pattern);
      if (existsSync(artifactPath)) artifactPaths = [artifactPath];
    }
    if (artifactPaths.length === 0) {
      errors.push(`missing output: ${workspace}/${pattern}`);
      continue;
    }
    for (const artifactPath of artifactPaths) {
      const relativePath = path.relative(repositoryRoot, artifactPath).replaceAll(path.sep, '/');
      const metadata = lstatSync(artifactPath);
      if (hasSymlinkComponent(workspaceRoot, artifactPath)) {
        errors.push(`symlink output is forbidden: ${relativePath}`);
        continue;
      }
      if (!metadata.isFile()) {
        errors.push(`output is not a regular file: ${relativePath}`);
        continue;
      }
      const realArtifactPath = realpathSync(artifactPath);
      if (!isWithin(repositoryRoot, realArtifactPath) || !isWithin(realWorkspaceRoot, realArtifactPath)) {
        errors.push(`output resolves outside repository/workspace: ${relativePath}`);
        continue;
      }
      if (metadata.mtimeMs < buildStartedAt - 1_000) {
        errors.push(`stale output from before current build: ${relativePath}`);
      }
      if (metadata.mtimeMs > validationNow + maxFutureClockSkewMs) {
        errors.push(`output timestamp exceeds 5 minute clock-skew tolerance: ${relativePath}`);
      }
      const bytes = readFileSync(artifactPath);
      verifiedOutputs.push({
        path: relativePath,
        bytes: metadata.size,
        mtimeMs: metadata.mtimeMs,
        sha256: createHash('sha256').update(bytes).digest('hex'),
      });
    }
  }
}

if (errors.length > 0) {
  console.error('[SaaS Build] artifact verification failed');
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

const result = {
  schemaVersion: 1,
  status: 'COMPLETED',
  invocationId: startReport.invocationId,
  startedAt: startReport.startedAt,
  completedAt: new Date().toISOString(),
  registrySha256,
  outputs: verifiedOutputs,
};
const resultPath = path.join(repositoryRoot, '.reports/saas-build/build-result.json');
const temporaryPath = `${resultPath}.${result.invocationId}.tmp`;
writeFileSync(temporaryPath, `${JSON.stringify(result, null, 2)}\n`);
renameSync(temporaryPath, resultPath);
console.log(
  `[SaaS Build] verified ${verifiedOutputs.length} fresh artifacts for ${Object.keys(expectedWorkspaceArtifacts).length} workspaces`,
);
