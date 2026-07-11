import { createHash, randomUUID } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
export const dbReportDirectory = path.join(repositoryRoot, '.reports/db');

export const readJson = (relativePath) =>
  JSON.parse(readFileSync(path.join(repositoryRoot, relativePath), 'utf8'));

export const sha256 = (content) => createHash('sha256').update(content).digest('hex');

export const writeAtomicJson = (relativePath, value) => {
  const target = path.join(repositoryRoot, relativePath);
  mkdirSync(path.dirname(target), { recursive: true });
  const temporary = `${target}.${randomUUID()}.tmp`;
  writeFileSync(temporary, `${JSON.stringify(value, null, 2)}\n`, { mode: 0o600 });
  renameSync(temporary, target);
};

export const createRunMetadata = (kind) => {
  const git = spawnSync('git', ['rev-parse', 'HEAD'], { cwd: repositoryRoot, encoding: 'utf8' });
  const sourceSha = git.status === 0 ? git.stdout.trim() : '';
  if (!/^[a-f0-9]{40}$/.test(sourceSha)) throw new Error('unable to bind DB report to git HEAD');
  return {
    schemaVersion: 1,
    kind,
    runId: randomUUID(),
    generatedAt: new Date().toISOString(),
    sourceSha,
    nodeVersion: process.version,
    platform: `${process.platform}/${process.arch}`,
  };
};
