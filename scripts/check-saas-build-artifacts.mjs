import { createHash } from 'node:crypto';
import {
  existsSync,
  readFileSync,
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
for (const [workspace, patterns] of Object.entries(expectedWorkspaceArtifacts)) {
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
      const metadata = statSync(artifactPath);
      const relativePath = path.relative(repositoryRoot, artifactPath).replaceAll(path.sep, '/');
      if (metadata.mtimeMs < buildStartedAt - 1_000) {
        errors.push(`stale output from before current build: ${relativePath}`);
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
