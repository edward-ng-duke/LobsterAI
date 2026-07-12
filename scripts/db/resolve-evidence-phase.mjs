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

export const requireCheckedOutSource = (expectedSha, actualSha) => {
  if (!/^[a-f0-9]{40}$/.test(expectedSha ?? '')) {
    throw new Error('P02_SOURCE_SHA must be a 40-character Git SHA');
  }
  if (!/^[a-f0-9]{40}$/.test(actualSha ?? '') || actualSha !== expectedSha) {
    throw new Error(`checked-out HEAD does not match P02_SOURCE_SHA: ${actualSha ?? ''}`);
  }
  return expectedSha;
};

export const classifyTrustedEvidenceValidation = ({ status, stdout, stderr }) => {
  const parseUniqueJson = (stream, label) => {
    if (typeof stream !== 'string' || stream.trim().length === 0) {
      throw new Error(`trusted evidence ${label} must contain exactly one JSON diagnostic`);
    }
    try {
      return JSON.parse(stream.trim());
    } catch (error) {
      throw new Error(`trusted evidence ${label} is not one isolated JSON diagnostic: ${error.message}`);
    }
  };

  if (status === 0) {
    if (stderr.trim() !== '') {
      throw new Error('successful trusted evidence validation wrote an unexpected stderr diagnostic');
    }
    const result = parseUniqueJson(stdout, 'stdout');
    if (result?.status !== 'PASS') {
      throw new Error('successful trusted evidence validation did not emit PASS');
    }
    return true;
  }

  if (status === 1 && stdout.trim() === '') {
    const result = parseUniqueJson(stderr, 'stderr');
    const fields = Object.keys(result ?? {}).sort();
    if (
      JSON.stringify(fields) === JSON.stringify(['errors', 'status']) &&
      result.status === 'FAILED' &&
      Array.isArray(result.errors) &&
      result.errors.length === 2
    ) {
      const pattern = /^(codeEvidenceSha|stageEvidenceSha): non-evidence change after source SHA: ((?:A|M|D|R\d+|C\d+) [^\r\n]+ \([a-f0-9]{40}\))$/;
      const matches = result.errors.map((error) =>
        typeof error === 'string' ? error.match(pattern) : null,
      );
      if (
        matches.every(Boolean) &&
        new Set(matches.map((match) => match[1])).size === 2 &&
        matches[0][2] === matches[1][2]
      ) {
        return false;
      }
    }
  }
  throw new Error(
    `trusted evidence validation failed outside the auditable source-drift states: ` +
    `exit=${status ?? 'unknown'}`,
  );
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
    valid: classifyTrustedEvidenceValidation(validation),
    exitCode: validation.status ?? 1,
  };
};

const isMain = process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  try {
    const head = spawnSync('git', ['rev-parse', 'HEAD'], {
      cwd: repositoryRoot,
      encoding: 'utf8',
    });
    if (head.status !== 0) throw new Error('unable to resolve checked-out HEAD for P02 phase');
    const sourceSha = requireCheckedOutSource(
      process.env.P02_SOURCE_SHA,
      head.stdout.trim(),
    );
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
      sourceSha,
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
