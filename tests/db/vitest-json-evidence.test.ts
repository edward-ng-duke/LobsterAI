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
  ])('preserves machine counts for a report containing one %s', (_label, mutation) => {
    expect(loadVitestJsonEvidence(writeReport({ ...report(), ...mutation }))).toEqual({
      passed: mutation.numPassedTests,
      failed: mutation.numFailedTests ?? 0,
      skipped: mutation.numPendingTests ?? 0,
      todo: mutation.numTodoTests ?? 0,
      total: 27,
    });
  });

  test('rejects inconsistent totals instead of inferring counts', () => {
    expect(() => loadVitestJsonEvidence(writeReport({
      ...report(),
      numPassedTests: 26,
    }))).toThrow();
  });

  test('rejects an all-green assertion count when a test suite failed to load', () => {
    const failureMessage = [
      'Error: SECRET_TOKEN=must-not-leak',
      'postgresql://p02:private@database.internal:5432/p02',
      '    at unsafe-stack-frame.ts:42:1',
    ].join('\n').repeat(100);
    const failedSuiteName = `${'/untrusted/'.repeat(40)}migration-lifecycle.test.ts`;
    const target = writeReport({
      ...report(),
      numPassedTestSuites: 5,
      numFailedTestSuites: 1,
      numTotalTests: 11,
      numPassedTests: 11,
      testResults: [{
        name: failedSuiteName,
        status: 'failed',
        message: failureMessage,
      }],
    });

    let diagnostic = '';
    try {
      loadVitestJsonEvidence(target);
    } catch (error) {
      diagnostic = error instanceof Error ? error.message : String(error);
    }

    expect(diagnostic).toContain('migration-lifecycle.test.ts');
    expect(diagnostic).not.toContain('SECRET_TOKEN');
    expect(diagnostic).not.toContain('postgresql://');
    expect(diagnostic).not.toContain('unsafe-stack-frame');
    expect(diagnostic.length).toBeLessThanOrEqual(256);
  });

  test('rejects inconsistent test suite totals', () => {
    expect(() => loadVitestJsonEvidence(writeReport({
      ...report(),
      numFailedTestSuites: 1,
    }))).toThrow(/suite counts/i);
  });

  test('rejects malformed or missing machine fields', () => {
    expect(() => loadVitestJsonEvidence(writeReport({ numTotalTests: 27 }))).toThrow();
    expect(() => loadVitestJsonEvidence(writeReport('{not-json'))).toThrow();
  });
});
