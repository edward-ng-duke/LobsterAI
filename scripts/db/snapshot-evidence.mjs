import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

import { repositoryRoot } from './common.mjs';

const mode = process.argv[2];
if (!['--code', '--stage'].includes(mode)) {
  console.error('usage: node scripts/db/snapshot-evidence.mjs --code|--stage');
  process.exit(1);
}

const evidenceDirectory = path.join(
  repositoryRoot,
  'docs/db/20260711_P02_Prisma与RLS脚手架证据',
);
const head = spawnSync('git', ['rev-parse', 'HEAD'], { cwd: repositoryRoot, encoding: 'utf8' }).stdout.trim();
if (!/^[a-f0-9]{40}$/.test(head)) throw new Error('unable to resolve evidence source SHA');

const sha256 = (content) => createHash('sha256').update(content).digest('hex');
const atomicWrite = (target, content) => {
  mkdirSync(path.dirname(target), { recursive: true });
  const temporary = `${target}.${process.pid}.tmp`;
  writeFileSync(temporary, content, { mode: 0o600 });
  renameSync(temporary, target);
};
const runnerEntry = (reportName, sourceSha, runner) => {
  const reportContent = readFileSync(path.join(evidenceDirectory, reportName));
  const runnerContent = readFileSync(path.join(repositoryRoot, runner));
  return {
    sourceSha,
    sha256: sha256(reportContent),
    runner,
    runnerSha256: sha256(runnerContent),
  };
};
const copyNativeReport = (source, destination, expectedSourceSha) => {
  const content = readFileSync(path.join(repositoryRoot, source));
  const report = JSON.parse(content);
  if (report.status !== 'PASS' || report.sourceSha !== expectedSourceSha) {
    throw new Error(`${source} is not a PASS report bound to ${expectedSourceSha}`);
  }
  atomicWrite(path.join(evidenceDirectory, destination), content);
};

const manifestPath = path.join(evidenceDirectory, 'evidence-manifest.json');
if (mode === '--code') {
  const codeReports = [
    ['.reports/db/contracts-preflight.json', 'contracts-preflight.json', 'scripts/db/preflight.mjs'],
    ['.reports/db/preflight.json', 'preflight.json', 'scripts/db/preflight.mjs'],
    ['.reports/db/integration.json', 'integration.json', 'scripts/db/run-integration.mjs'],
    ['.reports/db/validation.json', 'validation.json', 'scripts/db/validate.mjs'],
  ];
  for (const [source, destination] of codeReports) copyNativeReport(source, destination, head);
  const reports = Object.fromEntries(
    codeReports.map(([, destination, runner]) => [destination, runnerEntry(destination, head, runner)]),
  );
  atomicWrite(
    manifestPath,
    `${JSON.stringify({
      schemaVersion: 1,
      generatedAt: new Date().toISOString(),
      codeEvidenceSha: head,
      reports,
    }, null, 2)}\n`,
  );
} else {
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
  copyNativeReport(
    '.reports/saas-gates/prisma-validate.json',
    'prisma-stage-gate.json',
    head,
  );
  manifest.generatedAt = new Date().toISOString();
  manifest.stageEvidenceSha = head;
  manifest.reports['prisma-stage-gate.json'] = runnerEntry(
    'prisma-stage-gate.json',
    head,
    'scripts/run-saas-stage-gate.mjs',
  );
  atomicWrite(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
}

console.log(JSON.stringify({ status: 'PASS', mode, sourceSha: head }));
