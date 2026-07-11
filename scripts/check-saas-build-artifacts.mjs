import { existsSync, readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const registry = JSON.parse(
  readFileSync(path.join(repositoryRoot, 'scripts/saas-workspace-registry.json'), 'utf8'),
);
const errors = [];

for (const [workspace, definition] of Object.entries(registry.workspaces ?? {})) {
  for (const artifact of definition.artifacts ?? []) {
    const wildcardMatch = artifact.match(/^(.*)\/\*\.([a-z0-9]+)$/i);
    if (wildcardMatch) {
      const directory = path.join(repositoryRoot, workspace, wildcardMatch[1]);
      const extension = `.${wildcardMatch[2]}`;
      if (
        !existsSync(directory) ||
        !readdirSync(directory, { withFileTypes: true }).some(
          (entry) => entry.isFile() && entry.name.endsWith(extension),
        )
      ) {
        errors.push(`${workspace}/${artifact}`);
      }
    } else if (!existsSync(path.join(repositoryRoot, workspace, artifact))) {
      errors.push(`${workspace}/${artifact}`);
    }
  }
}

if (errors.length > 0) {
  console.error('[SaaS Build] missing registered artifacts');
  errors.forEach((artifact) => console.error(`- ${artifact}`));
  process.exit(1);
}

console.log(`[SaaS Build] verified artifacts for ${Object.keys(registry.workspaces).length} workspaces`);
