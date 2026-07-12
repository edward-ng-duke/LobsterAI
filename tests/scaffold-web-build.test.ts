import { spawnSync } from 'node:child_process';
import { existsSync, readdirSync } from 'node:fs';
import path from 'node:path';

import { describe, expect, test } from 'vitest';

import { createWebWorkspaceBuildFixture } from './helpers/web-workspace-build-fixture';

describe('P00 Web production build gate', () => {
  test('workspace build emits an HTML entry and static asset', () => {
    const fixture = createWebWorkspaceBuildFixture();
    try {
      for (const excludedOutput of [
        'apps/web/dist',
        'apps/web/dist-types',
        'apps/web/tsconfig.tsbuildinfo',
        'libs/client/bridge/dist',
        'libs/client/bridge/tsconfig.tsbuildinfo',
        'libs/shared/contracts/dist',
        'libs/shared/contracts/tsconfig.tsbuildinfo',
        'libs/shared/types/dist',
        'libs/shared/types/tsconfig.tsbuildinfo',
      ]) {
        expect(existsSync(path.join(fixture.root, excludedOutput)), excludedOutput).toBe(false);
      }

      const result = spawnSync('npm', ['run', 'build', '--workspace', '@lobsterai/web'], {
        cwd: fixture.root,
        encoding: 'utf8',
      });

      expect(result.status, `${result.stdout}\n${result.stderr}`).toBe(0);
      expect(existsSync(fixture.resolveWebDist('index.html'))).toBe(true);
      expect(
        readdirSync(fixture.resolveWebDist('assets')).some((file) => file.endsWith('.js')),
      ).toBe(true);
    } finally {
      fixture.cleanup();
    }
  }, 30_000);
});
