import { readFileSync } from 'node:fs';
import path from 'node:path';

import { describe, expect, test } from 'vitest';

const repositoryRoot = path.resolve(import.meta.dirname, '..');
const requiredPretestSteps = [
  'npm rebuild better-sqlite3',
  'tsc -b tsconfig.workspace.json --clean',
  'tsc -b tsconfig.workspace.json --pretty false',
  'node scripts/contracts/generate.mjs --check',
];

const validatePretest = (command: string): string[] => {
  const errors: string[] = [];
  const steps = command.split('&&').map((step) => step.trim());

  if (steps.length !== requiredPretestSteps.length) {
    errors.push('pretest must contain exactly the native rebuild, clean, build, and check steps');
  }
  requiredPretestSteps.forEach((expected, index) => {
    if (steps[index] !== expected) {
      errors.push(`pretest step ${index + 1} must be: ${expected}`);
    }
  });
  if (/\|\||\b(?:vite|build:saas|npm install|contracts:generate)\b/.test(command)) {
    errors.push('pretest contains a forbidden command or failure bypass');
  }
  if (/generate\.mjs(?!\s+--check(?:\s|$))/.test(command)) {
    errors.push('contracts generation must run in check-only mode');
  }

  return errors;
};

describe('default test bootstrap', () => {
  test('prepares workspace package entries before starting Vitest from a dist-free checkout', () => {
    const rootPackage = JSON.parse(
      readFileSync(path.join(repositoryRoot, 'package.json'), 'utf8'),
    ) as { scripts?: Record<string, string> };

    expect(validatePretest(rootPackage.scripts?.pretest ?? '')).toEqual([]);
  });

  test.each([
    ['missing clean', requiredPretestSteps.filter((_, index) => index !== 1).join(' && ')],
    ['missing build', requiredPretestSteps.filter((_, index) => index !== 2).join(' && ')],
    ['missing check', requiredPretestSteps.filter((_, index) => index !== 3).join(' && ')],
    ['Vite build', [...requiredPretestSteps, 'vite build'].join(' && ')],
    ['SaaS build', [...requiredPretestSteps, 'npm run build:saas'].join(' && ')],
    ['network install', [...requiredPretestSteps, 'npm install'].join(' && ')],
    ['failure bypass', `${requiredPretestSteps.join(' && ')} || true`],
    [
      'write-mode generator',
      requiredPretestSteps
        .map((step) => step.replace('node scripts/contracts/generate.mjs --check', 'node scripts/contracts/generate.mjs'))
        .join(' && '),
    ],
    [
      'contracts generate script',
      requiredPretestSteps
        .map((step) => step.replace('node scripts/contracts/generate.mjs --check', 'npm run contracts:generate'))
        .join(' && '),
    ],
  ])('rejects %s in the default test bootstrap', (_name, command) => {
    expect(validatePretest(command)).not.toEqual([]);
  });
});
