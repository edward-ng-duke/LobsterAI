import { spawnSync } from 'node:child_process';
import { existsSync, readdirSync, rmSync } from 'node:fs';
import path from 'node:path';

import { describe, expect, test } from 'vitest';

const repositoryRoot = path.resolve(import.meta.dirname, '..');
const webDist = path.join(repositoryRoot, 'apps/web/dist');

describe('P00 Web production build gate', () => {
  test('workspace build emits an HTML entry and static asset', () => {
    rmSync(webDist, { recursive: true, force: true });
    const result = spawnSync('npm', ['run', 'build', '--workspace', '@lobsterai/web'], {
      cwd: repositoryRoot,
      encoding: 'utf8',
    });

    expect(result.status, `${result.stdout}\n${result.stderr}`).toBe(0);
    expect(existsSync(path.join(webDist, 'index.html'))).toBe(true);
    expect(readdirSync(path.join(webDist, 'assets')).some((file) => file.endsWith('.js'))).toBe(true);
  }, 30_000);
});
