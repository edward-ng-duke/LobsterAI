import { spawnSync } from 'node:child_process';
import {
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { afterEach, describe, expect, test } from 'vitest';

const repositoryRoot = path.resolve(import.meta.dirname, '..');
const temporaryRoots: string[] = [];

interface StageGate {
  status: 'PASS' | 'NOT_APPLICABLE';
  activationTask: string;
  reason: string;
  fixtures: string[];
  command?: string[];
}

interface StageManifest {
  schemaVersion: number;
  currentStage: 'P03';
  statuses: Record<string, number>;
  gates: Record<string, StageGate>;
}

const createRepositoryCopy = (): string => {
  const target = mkdtempSync(path.join(tmpdir(), 'lobsterai-p00-stage-gate-'));
  temporaryRoots.push(target);
  for (const relativePath of [
    '.dockerignore',
    '.github/workflows/saas-scaffold.yml',
    'apps',
    'charts',
    'docker',
    'docs/poc',
    'docs/supply-chain',
    'SKILLs',
    'openclaw-extensions',
    'libs',
    'package-lock.json',
    'package.json',
    'prisma',
    'scripts/check-saas-build-artifacts.mjs',
    'scripts/clean-saas-build.mjs',
    'scripts/check-saas-scaffold.mjs',
    'scripts/check-docker-build.mjs',
    'scripts/check-helm.mjs',
    'scripts/check-supply-chain.mjs',
    'scripts/harden-openclaw-runtime-dependencies.mjs',
    'scripts/contracts',
    'scripts/expect-saas-stage-gate.mjs',
    'scripts/json-without-duplicate-keys.mjs',
    'scripts/run-saas-stage-gate.mjs',
    'scripts/saas-stage-gates.json',
    'scripts/saas-workspace-registry.json',
    'scripts/saas-workspace-policy.mjs',
    'src/renderer/types/electron.d.ts',
    'src/main/computerUse/computerUseKit.ts',
    'src/main/computerUse/computerUseRuntime.ts',
    'src/shared/computerUse/constants.ts',
    'src/renderer/data/mcpRegistry.json',
    'tests',
    'tsconfig.base.json',
    'tsconfig.workspace.json',
    '改造计划/附录A-IPC通道与接口映射.md',
  ]) {
    const source = path.join(repositoryRoot, relativePath);
    const destination = path.join(target, relativePath);
    mkdirSync(path.dirname(destination), { recursive: true });
    cpSync(source, destination, {
      recursive: true,
      filter: (candidate) => !/(?:^|\/)(?:dist|dist-types|node_modules)(?:\/|$)/.test(candidate),
    });
  }
  const manifestPath = path.join(target, 'scripts/saas-stage-gates.json');
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8')) as StageManifest;
  manifest.gates['contracts:check'].command = [
    process.execPath,
    '-e',
    "console.log(JSON.stringify({ status: 'PASSED', check: 'contracts-test-double' }))",
  ];
  manifest.gates['supply-chain:check'].command = [
    process.execPath,
    '-e',
    "console.log(JSON.stringify({ status: 'PASSED', check: 'supply-chain-test-double' }))",
  ];
  manifest.gates['docker:build:check'].command = ['node', 'scripts/check-docker-build.mjs', '--static'];
  manifest.gates['helm:lint'].command = ['node', 'scripts/check-helm.mjs', '--static'];
  writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  symlinkSync(path.join(repositoryRoot, 'node_modules'), path.join(target, 'node_modules'), 'dir');
  return target;
};

const readManifest = (root: string): StageManifest =>
  JSON.parse(readFileSync(path.join(root, 'scripts/saas-stage-gates.json'), 'utf8')) as StageManifest;

const runNodeScript = (root: string, script: string, gate: string) =>
  spawnSync(process.execPath, [script, gate], {
    cwd: root,
    encoding: 'utf8',
    env: { ...process.env, SAAS_SOURCE_SHA: '0123456789abcdef0123456789abcdef01234567' },
  });

const parseReport = (output: string): Record<string, unknown> =>
  JSON.parse(
    output
      .trim()
      .split(/\r?\n/)
      .findLast((line) => line.startsWith('{')) ?? '{}',
  ) as Record<string, unknown>;

afterEach(() => {
  temporaryRoots.splice(0).forEach((root) => rmSync(root, { recursive: true, force: true }));
});

describe('P03 active and deferred stage gate integrity', () => {
  test('each gate returns its declared status and atomically writes a complete fresh report', () => {
    const root = createRepositoryCopy();
    const manifest = readManifest(root);
    for (const [gateName, gate] of Object.entries(manifest.gates)) {
      const reportPath = path.join(root, '.reports/saas-gates', `${gateName.replaceAll(':', '-')}.json`);
      mkdirSync(path.dirname(reportPath), { recursive: true });
      writeFileSync(reportPath, '{"invocationId":"stale"}\n');

      const result = runNodeScript(root, 'scripts/run-saas-stage-gate.mjs', gateName);
      expect(result.status, `${result.stdout}\n${result.stderr}`).toBe(manifest.statuses[gate.status]);
      const stdoutReport = parseReport(result.stdout);
      const fileReport = JSON.parse(readFileSync(reportPath, 'utf8')) as Record<string, unknown>;
      expect(fileReport).toEqual(stdoutReport);
      expect(stdoutReport).toMatchObject({
        schemaVersion: manifest.schemaVersion,
        gate: gateName,
        stage: manifest.currentStage,
        status: gate.status,
        activationTask: gate.activationTask,
        reason: gate.reason,
        fixturesChecked: gate.fixtures,
      });
      expect(stdoutReport.invocationId).toEqual(expect.any(String));
      expect(stdoutReport.invocationId).not.toBe('stale');
      expect(stdoutReport.generatedAt).toEqual(expect.any(String));
      expect(stdoutReport.sourceSha).toBe('0123456789abcdef0123456789abcdef01234567');
    }
  });

  test('missing and empty declared fixtures fail both runner and verifier for every gate', () => {
    const baselineRoot = createRepositoryCopy();
    const manifest = readManifest(baselineRoot);
    for (const [gateName, gate] of Object.entries(manifest.gates)) {
      for (const mutation of ['missing', 'empty'] as const) {
        const root = createRepositoryCopy();
        const fixturePath = path.join(root, gate.fixtures[0]);
        if (mutation === 'missing') rmSync(fixturePath, { recursive: true, force: true });
        else writeFileSync(fixturePath, '');

        const runner = runNodeScript(root, 'scripts/run-saas-stage-gate.mjs', gateName);
        const verifier = runNodeScript(root, 'scripts/expect-saas-stage-gate.mjs', gateName);
        expect(runner.status).not.toBe(manifest.statuses[gate.status]);
        expect(verifier.status).not.toBe(0);
      }
    }
  }, 30_000);

  test('unknown gates fail both runner and verifier', () => {
    const root = createRepositoryCopy();
    expect(runNodeScript(root, 'scripts/run-saas-stage-gate.mjs', 'unknown:gate').status).not.toBe(0);
    expect(runNodeScript(root, 'scripts/expect-saas-stage-gate.mjs', 'unknown:gate').status).not.toBe(0);
  });

  test('a three-line stdout-only fake runner fails verifier and scaffold checker', () => {
    const root = createRepositoryCopy();
    const fakeRunner = [
      "const gate = process.argv[2];",
      "console.log(JSON.stringify({ gate, stage: 'P00', status: 'NOT_APPLICABLE' }));",
      'process.exit(78);',
      '',
    ].join('\n');
    writeFileSync(path.join(root, 'scripts/run-saas-stage-gate.mjs'), fakeRunner);
    rmSync(path.join(root, '.reports'), { recursive: true, force: true });

    const verifier = runNodeScript(root, 'scripts/expect-saas-stage-gate.mjs', 'contracts:check');
    const checker = runNodeScript(root, 'scripts/check-saas-scaffold.mjs', '');
    expect(verifier.status).not.toBe(0);
    expect(checker.status).not.toBe(0);
    expect(existsSync(path.join(root, '.reports/saas-gates/contracts-check.json'))).toBe(false);
  });
});
