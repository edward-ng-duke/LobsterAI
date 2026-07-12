import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { afterEach, describe, expect, test } from 'vitest';

import { loadVitestJsonEvidence } from '../../scripts/db/vitest-json-evidence.mjs';

const temporaryRoots: string[] = [];

const report = () => ({
  numTotalTestSuites: 6,
  numPassedTestSuites: 6,
  numFailedTestSuites: 0,
  numPendingTestSuites: 0,
  numTotalTests: 27,
  numPassedTests: 27,
  numFailedTests: 0,
  numPendingTests: 0,
  numTodoTests: 0,
  testResults: [],
});

const writeReport = (value: unknown): string => {
  const root = mkdtempSync(path.join(tmpdir(), 'lobsterai-vitest-json-'));
  temporaryRoots.push(root);
  const target = path.join(root, 'report.json');
  writeFileSync(target, `${JSON.stringify(value)}\n`);
  return target;
};

afterEach(() => {
  temporaryRoots.splice(0).forEach((root) => rmSync(root, { recursive: true, force: true }));
});

describe('Vitest structured integration evidence', () => {
  test('accepts a complete all-passing machine report', () => {
    expect(loadVitestJsonEvidence(writeReport(report()))).toEqual({
      passed: 27,
      failed: 0,
      skipped: 0,
      todo: 0,
      total: 27,
    });
  });

  test.each([
    ['skip', { numPassedTests: 26, numPendingTests: 1 }],
    ['todo', { numPassedTests: 26, numTodoTests: 1 }],
    ['failure', { numPassedTests: 26, numFailedTests: 1 }],
  ])('rejects a report containing one %s', (_label, mutation) => {
    try {
      loadVitestJsonEvidence(writeReport({ ...report(), ...mutation }));
      throw new Error('expected non-passing Vitest report to fail');
    } catch (error) {
      expect(error).toMatchObject({
        testResults: {
          passed: mutation.numPassedTests,
          failed: mutation.numFailedTests ?? 0,
          skipped: mutation.numPendingTests ?? 0,
          todo: mutation.numTodoTests ?? 0,
          total: 27,
        },
      });
    }
  });

  test('rejects inconsistent totals instead of inferring counts', () => {
    expect(() => loadVitestJsonEvidence(writeReport({
      ...report(),
      numPassedTests: 26,
    }))).toThrow();
  });

  test('rejects malformed or missing machine fields', () => {
    expect(() => loadVitestJsonEvidence(writeReport({ numTotalTests: 27 }))).toThrow();
    expect(() => loadVitestJsonEvidence(writeReport('{not-json'))).toThrow();
  });
});
