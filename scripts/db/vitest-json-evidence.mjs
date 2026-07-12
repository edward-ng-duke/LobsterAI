import { readFileSync } from 'node:fs';

const requiredInteger = (report, field) => {
  const value = report?.[field];
  if (!Number.isInteger(value) || value < 0) {
    throw new Error(`Vitest JSON report field ${field} must be a non-negative integer`);
  }
  return value;
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
  const failedSuites = requiredInteger(report, 'numFailedTestSuites');
  const pendingSuites = requiredInteger(report, 'numPendingTestSuites');
  if (!Array.isArray(report.testResults)) {
    throw new Error('Vitest JSON report testResults must be an array');
  }
  if (passed + failed + skipped + todo !== total) {
    throw new Error('Vitest JSON report test counts do not add up to total');
  }
  if (total <= 0 || failed !== 0 || skipped !== 0 || todo !== 0 || failedSuites !== 0 || pendingSuites !== 0) {
    throw new Error(
      `Vitest JSON report is not all-pass: passed=${passed}, failed=${failed}, skipped=${skipped}, todo=${todo}, total=${total}`,
    );
  }
  return { passed, failed, skipped, todo, total };
};
