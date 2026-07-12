import { appendFileSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

import { repositoryRoot } from './common.mjs';

export const resolveEvidencePhase = ({ eventName, evidenceReady, trustedEvidenceValid }) => {
  if (!['push', 'pull_request', 'workflow_dispatch'].includes(eventName)) {
    throw new Error(`unsupported GitHub event for P02 evidence phase: ${eventName}`);
  }
  if (eventName === 'workflow_dispatch') {
    if (!['false', 'true'].includes(evidenceReady)) {
      throw new Error(`workflow_dispatch requires a boolean P02_EVIDENCE_READY value: ${evidenceReady}`);
    }
    if (evidenceReady === 'true' && !trustedEvidenceValid) {
      throw new Error('post-freeze dispatch requires valid trusted evidence for this source');
    }
    if (evidenceReady === 'false' && trustedEvidenceValid) {
      throw new Error('a source with valid trusted evidence cannot be dispatched as pre-freeze');
    }
    return evidenceReady === 'true' ? 'post-freeze' : 'pre-freeze';
  }
  if (evidenceReady !== '') {
    throw new Error(`${eventName} must not provide P02_EVIDENCE_READY: ${evidenceReady}`);
  }
  return trustedEvidenceValid ? 'post-freeze' : 'pre-freeze';
};

const inspectTrustedEvidence = () => {
  const gates = JSON.parse(
    readFileSync(path.join(repositoryRoot, 'scripts/saas-stage-gates.json'), 'utf8'),
  );
  const expectedBootstrapSha256 =
    gates.gates?.['prisma:validate']?.trustedFiles?.['scripts/db/evidence-bootstrap.mjs'];
  if (!/^[a-f0-9]{64}$/.test(expectedBootstrapSha256 ?? '')) {
    throw new Error('P02 trusted bootstrap digest is missing from scripts/saas-stage-gates.json');
  }
  const validation = spawnSync(
    process.execPath,
    [
      'scripts/db/evidence-trust-launcher.mjs',
      '--expected-bootstrap-sha256',
      expectedBootstrapSha256,
    ],
    {
      cwd: repositoryRoot,
      encoding: 'utf8',
      env: { ...process.env, NODE_OPTIONS: '' },
    },
  );
  return {
    valid: validation.status === 0,
    exitCode: validation.status ?? 1,
  };
};

const isMain = process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  try {
    const trustedEvidence = inspectTrustedEvidence();
    const phase = resolveEvidencePhase({
      eventName: process.env.GITHUB_EVENT_NAME ?? '',
      evidenceReady: process.env.P02_EVIDENCE_READY ?? '',
      trustedEvidenceValid: trustedEvidence.valid,
    });
    if (process.env.GITHUB_OUTPUT) {
      appendFileSync(process.env.GITHUB_OUTPUT, `phase=${phase}\n`);
    }
    console.log(JSON.stringify({
      status: 'PASS',
      phase,
      trustedEvidenceExitCode: trustedEvidence.exitCode,
    }));
  } catch (error) {
    console.error(JSON.stringify({
      status: 'FAILED',
      error: error instanceof Error ? error.message : String(error),
    }));
    process.exitCode = 1;
  }
}
