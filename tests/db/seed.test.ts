import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import path from 'node:path';

import { describe, expect, test } from 'vitest';

import { P02Seed } from '../../prisma/seed/index.js';

const repositoryRoot = path.resolve(import.meta.dirname, '../..');

describe('P02 deterministic synthetic seed guard', () => {
  test('uses distinct internal UUIDs for tenant-local main agents', () => {
    expect(P02Seed.tenantA).not.toBe(P02Seed.tenantB);
    expect(P02Seed.agentMainA).not.toBe(P02Seed.agentMainB);
  });

  test('refuses to run in production before opening a database connection', () => {
    const result = spawnSync(
      process.execPath,
      ['--experimental-strip-types', 'prisma/seed/index.ts'],
      {
        cwd: repositoryRoot,
        encoding: 'utf8',
        env: {
          ...process.env,
          NODE_ENV: 'production',
          DATABASE_URL: 'postgresql://127.0.0.1:1/must-not-connect',
        },
      },
    );

    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('P02 seed is restricted');
    expect(result.stderr).not.toContain("Can't reach database server");
  });

  test('contains no public endpoint, credential assignment, or random fixture value', () => {
    const source = readFileSync(path.join(repositoryRoot, 'prisma/seed/index.ts'), 'utf8');
    expect(source).not.toMatch(/https?:\/\//);
    expect(source).not.toMatch(/(?:password|secret|api[_-]?key)\s*[:=]/i);
    expect(source).not.toMatch(/randomUUID|Math\.random/);
  });
});
