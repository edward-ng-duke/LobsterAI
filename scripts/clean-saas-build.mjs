import { randomUUID } from 'node:crypto';
import { mkdirSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  expectedWorkspaceArtifacts,
  loadWorkspaceRegistry,
  validateWorkspaceRegistry,
} from './saas-workspace-policy.mjs';

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const { registry, registrySha256 } = loadWorkspaceRegistry(repositoryRoot);
const registryErrors = validateWorkspaceRegistry(registry);
if (registryErrors.length > 0) {
  registryErrors.forEach((error) => console.error(`[SaaS Build] invalid registry: ${error}`));
  process.exit(1);
}

for (const workspace of Object.keys(expectedWorkspaceArtifacts)) {
  for (const generatedPath of ['dist', 'dist-types', 'tsconfig.tsbuildinfo']) {
    rmSync(path.join(repositoryRoot, workspace, generatedPath), { recursive: true, force: true });
  }
}

const reportDirectory = path.join(repositoryRoot, '.reports/saas-build');
mkdirSync(reportDirectory, { recursive: true });
rmSync(path.join(reportDirectory, 'build-result.json'), { force: true });
const report = {
  schemaVersion: 1,
  status: 'STARTED',
  invocationId: randomUUID(),
  startedAt: new Date().toISOString(),
  startedAtEpochMs: Date.now(),
  registrySha256,
};
const reportPath = path.join(reportDirectory, 'build-start.json');
const temporaryPath = `${reportPath}.${report.invocationId}.tmp`;
writeFileSync(temporaryPath, `${JSON.stringify(report, null, 2)}\n`);
renameSync(temporaryPath, reportPath);
console.log(`[SaaS Build] clean preflight ${report.invocationId}`);
