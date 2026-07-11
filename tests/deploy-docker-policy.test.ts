import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

import { describe, expect, test } from 'vitest';

const repositoryRoot = path.resolve(import.meta.dirname, '..');
const imageNames = ['web', 'api', 'worker', 'runtime-orchestrator', 'openclaw-runtime'] as const;
const dynamicInstallPattern = /\b(?:npm|pnpm|yarn|pip3?|npx)\s+(?:install|add|ci)|\bcurl\b|\bwget\b|git\s+clone/i;
const forbiddenProductionPattern = /(?:xvfb|x11vnc|novnc|chromium|electron|:latest|\bdebug\b)/i;

const runtimeStage = (dockerfile: string): string => {
  const match = dockerfile.match(/\nFROM\s+[^\n]+\s+AS\s+(?:production|runtime)\s*\n([\s\S]*)$/i);
  return match?.[1] ?? '';
};

describe('P03 production image policy', () => {
  test.each(imageNames)('%s has a real multi-stage, non-root, health-checked image', (imageName) => {
    const dockerfilePath = path.join(repositoryRoot, 'docker', imageName, 'Dockerfile');
    expect(existsSync(dockerfilePath), `${imageName} Dockerfile is missing`).toBe(true);
    const dockerfile = readFileSync(dockerfilePath, 'utf8');

    expect(dockerfile.match(/^FROM\s+/g)?.length ?? 0).toBeGreaterThanOrEqual(2);
    expect(dockerfile).toMatch(/^USER\s+[1-9][0-9]*:[1-9][0-9]*\s*$/m);
    expect(dockerfile).toMatch(/^HEALTHCHECK\s+/m);
    expect(dockerfile).toMatch(/^(?:ENTRYPOINT|CMD)\s+\[.+\]\s*$/m);
    expect(runtimeStage(dockerfile)).not.toMatch(dynamicInstallPattern);
    expect(runtimeStage(dockerfile)).not.toMatch(forbiddenProductionPattern);
  });

  test('production and debug build entrypoints are physically separated', () => {
    expect(existsSync(path.join(repositoryRoot, 'docker', 'openclaw-runtime', 'Dockerfile.debug'))).toBe(true);
    const productionDockerfile = readFileSync(
      path.join(repositoryRoot, 'docker', 'openclaw-runtime', 'Dockerfile'),
      'utf8',
    );
    expect(productionDockerfile).not.toMatch(/(?:xvfb|x11vnc|novnc|chromium|electron|\bdebug\b)/i);
  });
});
