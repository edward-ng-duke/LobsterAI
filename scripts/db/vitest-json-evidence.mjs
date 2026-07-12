import { readFileSync } from 'node:fs';

const FailedSuiteDiagnostic = {
  MaxNames: 2,
  MaxNameLength: 80,
};

const requiredInteger = (report, field) => {
  const value = report?.[field];
  if (!Number.isInteger(value) || value < 0) {
    throw new Error(`Vitest JSON report field ${field} must be a non-negative integer`);
  }
  return value;
};

const normalizeSuiteName = (value) => {
  if (typeof value !== 'string') return 'unknown-suite';
  const leaf = value.replaceAll('\\', '/').split('/').at(-1)?.trim() ?? '';
  const normalized = leaf
    .replaceAll(/[\u0000-\u001f\u007f]/g, '_')
    .replaceAll(/[^\p{L}\p{N}._-]+/gu, '_');
  if (!normalized) return 'unknown-suite';
  if (normalized.length <= FailedSuiteDiagnostic.MaxNameLength) return normalized;
  const edgeLength = Math.floor((FailedSuiteDiagnostic.MaxNameLength - 3) / 2);
  return `${normalized.slice(0, edgeLength)}...${normalized.slice(-edgeLength)}`;
};

const failedSuiteDiagnostic = (report, failedSuites) => {
  const names = report.testResults
    .filter((result) => result?.status === 'failed')
    .map((result) => normalizeSuiteName(result?.name))
    .filter((name, index, values) => values.indexOf(name) === index)
    .slice(0, FailedSuiteDiagnostic.MaxNames);
  const identities = names.length > 0 ? names : ['unknown-suite'];
  const omitted = Math.max(0, failedSuites - identities.length);
  const suffix = omitted > 0 ? ` (+${omitted} more)` : '';
  return `Vitest JSON report contains ${failedSuites} failed test suite(s): ${identities.join(', ')}${suffix}`;
};

export const loadVitestJsonEvidence = (reportPath) => {
  let report;
  try {
    report = JSON.parse(readFileSync(reportPath, 'utf8'));
  } catch (error) {
    throw new Error(`Vitest JSON report cannot be parsed: ${error.message}`, { cause: error });
  }
  if (typeof report !== 'object' || report === null || Array.isArray(report)) {
    throw new Error('Vitest JSON report root must be an object');
  }

  const total = requiredInteger(report, 'numTotalTests');
  const passed = requiredInteger(report, 'numPassedTests');
  const failed = requiredInteger(report, 'numFailedTests');
  const skipped = requiredInteger(report, 'numPendingTests');
  const todo = requiredInteger(report, 'numTodoTests');
  const totalSuites = requiredInteger(report, 'numTotalTestSuites');
  const passedSuites = requiredInteger(report, 'numPassedTestSuites');
  const failedSuites = requiredInteger(report, 'numFailedTestSuites');
  const pendingSuites = requiredInteger(report, 'numPendingTestSuites');
  if (!Array.isArray(report.testResults)) {
    throw new Error('Vitest JSON report testResults must be an array');
  }
  if (passedSuites + failedSuites + pendingSuites !== totalSuites) {
    throw new Error('Vitest JSON report suite counts do not add up to total');
  }
  if (passed + failed + skipped + todo !== total) {
    throw new Error('Vitest JSON report test counts do not add up to total');
  }
  if (total <= 0) throw new Error('Vitest JSON report must contain at least one test');
  if (failedSuites > 0 && failed === 0) {
    throw new Error(failedSuiteDiagnostic(report, failedSuites));
  }
  if (pendingSuites > 0 && skipped === 0) {
    throw new Error('Vitest JSON report contains pending test suites without pending tests');
  }
  return { passed, failed, skipped, todo, total };
};
