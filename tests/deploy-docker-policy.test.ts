import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

import { describe, expect, test } from 'vitest';

import { validateDockerfile } from '../scripts/check-docker-build.mjs';

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

    expect(dockerfile.match(/^FROM\s+/gm)?.length ?? 0).toBeGreaterThanOrEqual(2);
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

  test('static policy rejects root, dynamic runtime installs, GUI payloads and unpinned bases', () => {
    const baseline = readFileSync(path.join(repositoryRoot, 'docker', 'api', 'Dockerfile'), 'utf8');
    expect(validateDockerfile('api', baseline)).toEqual([]);

    expect(validateDockerfile('api', baseline.replace('USER 10001:10001', 'USER 0:0')).join('\n'))
      .toContain('numeric non-root');
    expect(validateDockerfile('api', baseline.replace(
      'ENTRYPOINT ["node", "/opt/lobster/index.mjs"]',
      'RUN npm install unsafe-package\nENTRYPOINT ["node", "/opt/lobster/index.mjs"]',
    )).join('\n')).toContain('dynamic install');
    expect(validateDockerfile('api', baseline.replace(
      'ENTRYPOINT ["node", "/opt/lobster/index.mjs"]',
      'RUN apk add xvfb\nENTRYPOINT ["node", "/opt/lobster/index.mjs"]',
    )).join('\n')).toContain('GUI/latest');
    expect(validateDockerfile('api', baseline.replace(/@sha256:[a-f0-9]{64}/g, '')).join('\n'))
      .toContain('digest-pinned');
  });

  test('OpenClaw health probes the live gateway and full smoke uses the production entrypoint', () => {
    const health = readFileSync(
      path.join(repositoryRoot, 'docker', 'openclaw-runtime', 'healthcheck.mjs'),
      'utf8',
    );
    expect(health).toMatch(/(?:connect|fetch|WebSocket)/);
    expect(health).toContain('OPENCLAW_GATEWAY_PORT');
    expect(health).not.toContain("readFileSync('/opt/openclaw/package.json'");

    const checker = readFileSync(path.join(repositoryRoot, 'scripts', 'check-docker-build.mjs'), 'utf8');
    expect(checker).toContain('OPENCLAW_GATEWAY_TOKEN');
    expect(checker).toContain('--tmpfs=/state');
    expect(checker).toContain('--tmpfs=/workspace');
    expect(checker).toContain('waitForHealthy(containerId');

    const negative = spawnSync(process.execPath, [
      path.join(repositoryRoot, 'docker', 'openclaw-runtime', 'healthcheck.mjs'),
    ], {
      encoding: 'utf8',
      env: { ...process.env, OPENCLAW_GATEWAY_PORT: '9' },
    });
    expect(negative.status).not.toBe(0);
  });
});
