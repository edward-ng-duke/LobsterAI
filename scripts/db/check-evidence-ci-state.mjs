const readyValue = process.env.P02_EVIDENCE_READY ?? '';
const platformResult = process.env.P02_PLATFORM_RESULT;
const evidenceResult = process.env.P02_EVIDENCE_RESULT;

const fail = (message) => {
  console.error(JSON.stringify({ status: 'FAILED', error: message }));
  process.exit(1);
};

if (!['', 'false', 'true'].includes(readyValue)) {
  fail(`invalid P02_EVIDENCE_READY value: ${readyValue}`);
}
if (platformResult !== 'success') {
  fail(`db-platform-arm64 did not succeed: ${platformResult}`);
}

const evidenceReady = readyValue === 'true';
if (!evidenceReady) {
  if (evidenceResult !== 'skipped') {
    fail(`pre-freeze evidence job must be skipped, received: ${evidenceResult}`);
  }
  console.log(JSON.stringify({
    status: 'WAITING_POST_FREEZE',
    platformResult,
    evidenceResult,
  }));
} else {
  if (evidenceResult !== 'success') {
    fail(`post-freeze evidence job did not succeed: ${evidenceResult}`);
  }
  console.log(JSON.stringify({
    status: 'POST_FREEZE_PASSED',
    platformResult,
    evidenceResult,
  }));
}
