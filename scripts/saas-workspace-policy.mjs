import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import path from 'node:path';

import { parseJsonRejectingDuplicateKeys } from './json-without-duplicate-keys.mjs';

export const expectedWorkspaceArtifacts = {
  'apps/api': ['dist/index.js', 'dist/index.d.ts'],
  'apps/runtime-orchestrator': ['dist/index.js', 'dist/index.d.ts'],
  'apps/web': ['dist/index.html', 'dist/assets/*.js'],
  'apps/worker': ['dist/index.js', 'dist/index.d.ts'],
  'libs/client/bridge': ['dist/index.js', 'dist/index.d.ts'],
  'libs/server/auth': ['dist/index.js', 'dist/index.d.ts'],
  'libs/server/db': ['dist/index.js', 'dist/index.d.ts'],
  'libs/shared/contracts': ['dist/index.js', 'dist/index.d.ts'],
  'libs/shared/types': ['dist/index.js', 'dist/index.d.ts'],
};

const appPlanReference =
  '改造计划/19-开工前补件与工程脚手架冻结.md#32-apps-应用边界';
const libraryPlanReference =
  '改造计划/19-开工前补件与工程脚手架冻结.md#33-libs-与契约事实源';

const stableJson = (value) => JSON.stringify(value);

export const loadWorkspaceRegistry = (repositoryRoot) => {
  const registryPath = path.join(repositoryRoot, 'scripts/saas-workspace-registry.json');
  const bytes = readFileSync(registryPath);
  return {
    registry: parseJsonRejectingDuplicateKeys(bytes.toString('utf8')),
    registrySha256: createHash('sha256').update(bytes).digest('hex'),
  };
};

export const validateWorkspaceRegistry = (registry) => {
  const errors = [];
  if (registry?.schemaVersion !== 1) errors.push('schemaVersion must be 1');
  if (registry?.stage !== 'P00') errors.push('stage must be P00');
  if (typeof registry?.changePolicy !== 'string' || registry.changePolicy.length < 40) {
    errors.push('changePolicy must describe the plan/RFC update requirement');
  }

  const actualWorkspaces = Object.keys(registry?.workspaces ?? {}).sort();
  const expectedWorkspaces = Object.keys(expectedWorkspaceArtifacts).sort();
  if (stableJson(actualWorkspaces) !== stableJson(expectedWorkspaces)) {
    errors.push('workspace keys must match the frozen P00 registry');
  }

  for (const workspace of expectedWorkspaces) {
    const definition = registry?.workspaces?.[workspace];
    if (!definition) continue;
    const isApp = workspace.startsWith('apps/');
    const expectedKind = isApp ? 'deployable' : 'library';
    const expectedPlanReference = isApp ? appPlanReference : libraryPlanReference;
    const expectedBuild = workspace === 'apps/web' ? 'tsc -b && vite build' : 'tsc -b';
    if (definition.kind !== expectedKind) {
      errors.push(`${workspace} kind must be ${expectedKind}`);
    }
    if (definition.planReference !== expectedPlanReference) {
      errors.push(`${workspace} planReference must target the authoritative allowed section`);
    }
    if (definition.build !== expectedBuild) errors.push(`${workspace} build command drifted`);
    if (definition.typecheck !== 'tsc -b --pretty false') {
      errors.push(`${workspace} typecheck command drifted`);
    }
    if (
      stableJson(definition.artifacts) !== stableJson(expectedWorkspaceArtifacts[workspace])
    ) {
      errors.push(`${workspace} artifacts must match fixed build outputs`);
    }
  }
  return errors;
};
