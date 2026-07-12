import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import path from 'node:path';

import { describe, expect, test } from 'vitest';

const repositoryRoot = path.resolve(import.meta.dirname, '../..');
const acceptedP03MergeSha = '43665ce1b7519ed5dbd47591d7efabd9d436f366';
const trustedBootstrapSha256 =
  '3a539b57aeae01f2ad0b6fd4b6d5adab1c1cb2362cb0ca03adf7723965032c23';
const manifest = JSON.parse(
  readFileSync(
    path.join(
      repositoryRoot,
      'docs/db/20260711_P02_Prisma与RLS脚手架证据/evidence-manifest.json',
    ),
    'utf8',
  ),
) as { codeEvidenceSha: string };

describe('P02 evidence after the accepted P03 integration merge', () => {
  test('freezes code evidence from a source that contains the accepted P03 merge', () => {
    const result = spawnSync(
      'git',
      ['merge-base', '--is-ancestor', acceptedP03MergeSha, manifest.codeEvidenceSha],
      { cwd: repositoryRoot },
    );
    expect(result.status).toBe(0);
  });

  test('restores the official trusted evidence entry on the integrated tree', () => {
    const result = spawnSync(
      process.execPath,
      [
        'scripts/db/evidence-trust-launcher.mjs',
        '--expected-bootstrap-sha256',
        trustedBootstrapSha256,
      ],
      {
        cwd: repositoryRoot,
        encoding: 'utf8',
        env: { ...process.env, NODE_OPTIONS: '' },
      },
    );
    if (process.env.P02_EVIDENCE_PHASE === 'pre-freeze') {
      expect(result.status).not.toBe(0);
      expect(result.stderr).toContain('trusted file mismatch package.json');
    } else {
      expect(result.status, `${result.stdout}\n${result.stderr}`).toBe(0);
    }
  });
});
