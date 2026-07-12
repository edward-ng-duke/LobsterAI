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
  requiredInteger(report, 'numFailedTestSuites');
  requiredInteger(report, 'numPendingTestSuites');
  if (!Array.isArray(report.testResults)) {
    throw new Error('Vitest JSON report testResults must be an array');
  }
  if (passed + failed + skipped + todo !== total) {
    throw new Error('Vitest JSON report test counts do not add up to total');
  }
  if (total <= 0) throw new Error('Vitest JSON report must contain at least one test');
  return { passed, failed, skipped, todo, total };
};
