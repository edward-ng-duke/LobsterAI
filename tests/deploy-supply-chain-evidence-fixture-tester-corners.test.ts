import { spawnSync } from 'node:child_process';
import {
  existsSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { afterEach, describe, expect, test } from 'vitest';

import { createSupplyChainEvidenceFixture } from './helpers/supply-chain-evidence-fixture';

type Fixture = ReturnType<typeof createSupplyChainEvidenceFixture>;
type JsonObject = Record<string, any>;

const fixtures: Fixture[] = [];
const externalRoots: string[] = [];

const createFixture = () => {
  const fixture = createSupplyChainEvidenceFixture();
  fixtures.push(fixture);
  return fixture;
};

const readJson = (filePath: string) => JSON.parse(readFileSync(filePath, 'utf8')) as JsonObject;

const restoreEnvironment = (name: string, value: string | undefined) => {
  if (value === undefined) delete process.env[name];
  else process.env[name] = value;
};

afterEach(() => {
  fixtures.splice(0).forEach(fixture => fixture.cleanup());
  externalRoots.splice(0).forEach(root => rmSync(root, { recursive: true, force: true }));
});

describe('B00-3B independent hermetic fixture corners', () => {
  test('keeps simultaneous fixture roots, sources, Docker states, and checker runs independent', () => {
    const originalAuthorDate = process.env.GIT_AUTHOR_DATE;
    const originalCommitterDate = process.env.GIT_COMMITTER_DATE;
    try {
      for (const second of [1, 2, 3]) {
        const timestamp = `2026-07-12T00:00:0${second}Z`;
        process.env.GIT_AUTHOR_DATE = timestamp;
        process.env.GIT_COMMITTER_DATE = timestamp;
        createFixture();
      }
    } finally {
      restoreEnvironment('GIT_AUTHOR_DATE', originalAuthorDate);
      restoreEnvironment('GIT_COMMITTER_DATE', originalCommitterDate);
    }

    expect(new Set(fixtures.map(fixture => fixture.root))).toHaveLength(3);
    expect(new Set(fixtures.map(fixture => fixture.sourceSha))).toHaveLength(3);

    const states = fixtures.map(fixture => readJson(path.join(fixture.root, 'bin/docker-state.json')));
    for (const [index, fixture] of fixtures.entries()) {
      const report = fixture.readReport();
      expect(fixture.reportPath.startsWith(`${fixture.root}${path.sep}`)).toBe(true);
      expect(fixture.evidenceDirectory.startsWith(`${fixture.root}${path.sep}`)).toBe(true);
      expect(report.sourceSha).toBe(fixture.sourceSha);
      expect(report.images.every((image: JsonObject) => image.sourceSha === fixture.sourceSha)).toBe(true);
      expect(states[index].images.every((image: JsonObject) => (
        image.tag.endsWith(`:${fixture.sourceSha.slice(0, 12)}`)
      ))).toBe(true);
      for (const other of fixtures.filter(candidate => candidate !== fixture)) {
        expect(JSON.stringify(states[index])).not.toContain(other.sourceSha.slice(0, 12));
      }

      const result = fixture.runChecker();
      expect(result.status, `${result.stdout}\n${result.stderr}`).toBe(0);
    }

    expect(new Set(states.map(state => JSON.stringify(state)))).toHaveLength(3);
  });

  test('makes cleanup idempotent, preserves sibling roots, and removes constructor failures', () => {
    const first = createFixture();
    const sibling = createFixture();
    first.cleanup();
    first.cleanup();
    expect(existsSync(first.root)).toBe(false);
    expect(existsSync(sibling.root)).toBe(true);
    const siblingResult = sibling.runChecker();
    expect(siblingResult.status, `${siblingResult.stdout}\n${siblingResult.stderr}`).toBe(0);

    const isolatedTmp = mkdtempSync(path.join(tmpdir(), 'lobsterai-p03-constructor-failure-'));
    externalRoots.push(isolatedTmp);
    const emptyPath = path.join(isolatedTmp, 'empty-path');
    const originalTmpdir = process.env.TMPDIR;
    const originalTmp = process.env.TMP;
    const originalTemp = process.env.TEMP;
    const originalPath = process.env.PATH;
    try {
      process.env.TMPDIR = isolatedTmp;
      process.env.TMP = isolatedTmp;
      process.env.TEMP = isolatedTmp;
      process.env.PATH = emptyPath;
      expect(() => createSupplyChainEvidenceFixture()).toThrow('fixture Git command failed');
    } finally {
      restoreEnvironment('TMPDIR', originalTmpdir);
      restoreEnvironment('TMP', originalTmp);
      restoreEnvironment('TEMP', originalTemp);
      restoreEnvironment('PATH', originalPath);
    }
    expect(readdirSync(isolatedTmp).filter(name => name.startsWith('lobsterai-p03-evidence-')))
      .toEqual([]);
  });

  test('writes report, SPDX, and Grype files as 0600 without tokens or environment secrets', () => {
    const npmSecret = 'npm_SYNTHETIC_TESTER_SECRET_7f83c1';
    const dockerSecret = 'docker-auth-SYNTHETIC_TESTER_SECRET_4e19aa';
    const originalNpmToken = process.env.NPM_TOKEN;
    const originalDockerAuth = process.env.DOCKER_AUTH_CONFIG;
    let fixture: Fixture;
    try {
      process.env.NPM_TOKEN = npmSecret;
      process.env.DOCKER_AUTH_CONFIG = dockerSecret;
      fixture = createFixture();
    } finally {
      restoreEnvironment('NPM_TOKEN', originalNpmToken);
      restoreEnvironment('DOCKER_AUTH_CONFIG', originalDockerAuth);
    }

    const report = fixture.readReport();
    const evidencePaths = report.images.flatMap((image: JsonObject) => [
      path.join(fixture.evidenceDirectory, image.sbom.path),
      path.join(fixture.evidenceDirectory, image.vulnerabilityScan.path),
    ]);
    const generatedPaths = [fixture.reportPath, ...evidencePaths];
    expect(generatedPaths).toHaveLength(11);
    for (const generatedPath of generatedPaths) {
      expect(statSync(generatedPath).mode & 0o777, generatedPath).toBe(0o600);
      const content = readFileSync(generatedPath, 'utf8');
      expect(content, generatedPath).not.toMatch(/__[A-Z0-9_]+__/);
      expect(content, generatedPath).not.toContain(npmSecret);
      expect(content, generatedPath).not.toContain(dockerSecret);
      expect(content, generatedPath).not.toMatch(/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/);
    }
  });

  test('returns exit 64 for unknown, incomplete, malformed, and non-hardened Docker calls', () => {
    const fixture = createFixture();
    const dockerPath = path.join(fixture.root, 'bin/docker');
    const statePath = path.join(fixture.root, 'bin/docker-state.json');
    const state = readJson(statePath);
    const environment = { ...process.env, P03_FIXTURE_DOCKER_STATE: statePath };
    const exactRun = [
      'run', '--rm', '--network=none', '--read-only', '--cap-drop=ALL',
      '--security-opt=no-new-privileges', '--user=10001:10001',
      '--entrypoint=/usr/local/bin/node', state.openClawTag,
      '-e', state.pluginInspectionScript, JSON.stringify(state.declaredPluginIds),
    ];
    const valid = spawnSync(dockerPath, exactRun, { env: environment, encoding: 'utf8' });
    expect(valid.status, valid.stderr).toBe(0);

    const invalidCalls = [
      [],
      ['version'],
      ['image', 'inspect'],
      ['image', 'inspect', 'unknown:tag', '--format', '{{json .}}'],
      exactRun.slice(0, -1),
      exactRun.map((argument, index) => index === 3 ? '--read-only=false' : argument),
      exactRun.map((argument, index) => index === 10 ? `${argument}\n// weakened` : argument),
      exactRun.map((argument, index) => index === 11 ? '{malformed-json' : argument),
    ];
    for (const args of invalidCalls) {
      const result = spawnSync(dockerPath, args, { env: environment, encoding: 'utf8' });
      expect(result.status, `${args.join(' ')}\n${result.stdout}\n${result.stderr}`).toBe(64);
    }

    const reportAsState = spawnSync(dockerPath, exactRun, {
      env: { ...environment, P03_FIXTURE_DOCKER_STATE: fixture.reportPath },
      encoding: 'utf8',
    });
    expect(reportAsState.status, reportAsState.stderr).toBe(64);
  });

  test('ignores a malicious external Docker state path when report and fake state are coordinated', () => {
    const fixture = createFixture();
    const internalStatePath = path.join(fixture.root, 'bin/docker-state.json');
    const internalStateBefore = readFileSync(internalStatePath);
    const report = fixture.readReport();
    const openClaw = report.images.find(
      (image: JsonObject) => image.imageName === 'openclaw-runtime',
    );
    openClaw.pluginInstallations.find(
      (plugin: JsonObject) => plugin.id === 'moltbot-popo',
    ).status = 'installed';
    fixture.writeReport(report);

    const externalRoot = mkdtempSync(path.join(tmpdir(), 'lobsterai-p03-malicious-state-'));
    externalRoots.push(externalRoot);
    const externalStatePath = path.join(externalRoot, 'docker-state.json');
    const externalState = readJson(internalStatePath);
    externalState.installedPluginIds.push('moltbot-popo');
    writeFileSync(externalStatePath, `${JSON.stringify(externalState, null, 2)}\n`, { mode: 0o600 });

    const originalStatePath = process.env.P03_FIXTURE_DOCKER_STATE;
    try {
      process.env.P03_FIXTURE_DOCKER_STATE = externalStatePath;
      const result = fixture.runChecker();
      expect(result.status, `${result.stdout}\n${result.stderr}`).not.toBe(0);
      expect(`${result.stdout}\n${result.stderr}`).toContain('plugin directory/status mismatch');
    } finally {
      restoreEnvironment('P03_FIXTURE_DOCKER_STATE', originalStatePath);
    }
    expect(readFileSync(internalStatePath)).toEqual(internalStateBefore);
  });
});
