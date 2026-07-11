import { createHash, randomUUID } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import {
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { resolveProductSourceSha, validateVulnerabilityReport } from './check-supply-chain.mjs';

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const productionImages = ['web', 'api', 'worker', 'runtime-orchestrator', 'openclaw-runtime'];
const pinnedBasePattern = /^FROM\s+[^\s]+@sha256:[a-f0-9]{64}\s+AS\s+[a-z0-9-]+\s*$/gim;
const dynamicInstallPattern = /\b(?:npm|pnpm|yarn|pip3?|npx)\s+(?:install|add|ci)|\bcurl\b|\bwget\b|git\s+clone/i;
const forbiddenProductionPattern = /(?:xvfb|x11vnc|novnc|chromium|electron|:latest|\bdebug\b)/i;
const secretPattern = /(?:-----BEGIN [A-Z ]+PRIVATE KEY-----|npm_[A-Za-z0-9]{20,}|ghp_[A-Za-z0-9]{20,}|AKIA[0-9A-Z]{16})/;

class BlockedError extends Error {}

const run = (command, args, options = {}) => spawnSync(command, args, {
  cwd: repositoryRoot,
  encoding: 'utf8',
  ...options,
});

const productionStage = (dockerfile) =>
  dockerfile.match(/\nFROM\s+[^\n]+\s+AS\s+production\s*\n([\s\S]*)$/i)?.[1] ?? '';

export const validateDockerfile = (imageName, dockerfile) => {
  const errors = [];
  const bases = dockerfile.match(pinnedBasePattern) ?? [];
  if (bases.length < 2) errors.push(`${imageName}: requires at least two digest-pinned stages`);
  const runtime = productionStage(dockerfile);
  if (!runtime) errors.push(`${imageName}: missing final AS production stage`);
  if (!/^USER\s+[1-9][0-9]*:[1-9][0-9]*\s*$/m.test(runtime)) {
    errors.push(`${imageName}: final USER must be a numeric non-root UID:GID`);
  }
  if (!/^HEALTHCHECK\s+/m.test(runtime)) errors.push(`${imageName}: missing HEALTHCHECK`);
  if (!/^(?:ENTRYPOINT|CMD)\s+\[[^\n]+\]\s*$/m.test(runtime)) {
    errors.push(`${imageName}: final entrypoint must use exec-array form`);
  }
  if (dynamicInstallPattern.test(runtime)) errors.push(`${imageName}: production stage performs a dynamic install/download`);
  if (forbiddenProductionPattern.test(runtime)) errors.push(`${imageName}: production stage contains GUI/latest/debug content`);
  if (/COPY\s+\.\s+\./i.test(runtime)) errors.push(`${imageName}: production stage copies an unbounded build context`);
  if (secretPattern.test(dockerfile)) errors.push(`${imageName}: Dockerfile contains a secret-like value`);
  return errors;
};

const validateEntrypoints = (root) => {
  const errors = [];
  for (const relativePath of [
    'docker/worker/entrypoint.sh',
    'docker/openclaw-runtime/entrypoint.sh',
  ]) {
    const absolutePath = path.join(root, relativePath);
    if (!existsSync(absolutePath)) {
      errors.push(`missing entrypoint: ${relativePath}`);
      continue;
    }
    const content = readFileSync(absolutePath, 'utf8');
    if (dynamicInstallPattern.test(content)) errors.push(`${relativePath}: runtime download/install is forbidden`);
    if (!content.startsWith('#!/bin/sh\nset -eu')) errors.push(`${relativePath}: entrypoint must fail closed`);
  }
  const worker = path.join(root, 'docker/worker/entrypoint.sh');
  if (existsSync(worker) && !/trap\s+\w+\s+INT TERM/.test(readFileSync(worker, 'utf8'))) {
    errors.push('worker entrypoint must forward SIGINT and SIGTERM');
  }
  return errors;
};

const validateDockerignore = (root) => {
  const ignorePath = path.join(root, '.dockerignore');
  if (!existsSync(ignorePath)) return ['missing root .dockerignore'];
  const entries = new Set(readFileSync(ignorePath, 'utf8').split(/\r?\n/).map(value => value.trim()));
  return ['.git', '.env', '.env.*', '.npmrc', 'node_modules', '**/node_modules', '.reports']
    .filter(entry => !entries.has(entry))
    .map(entry => `.dockerignore must exclude ${entry}`);
};

const validateOpenClaw = (root, dockerfile) => {
  const errors = [];
  const packageJson = JSON.parse(readFileSync(path.join(root, 'package.json'), 'utf8'));
  if (!dockerfile.includes(`OPENCLAW_VERSION=${packageJson.openclaw.version}`)) {
    errors.push('openclaw-runtime: image version does not match package.json.openclaw.version');
  }
  for (const script of [
    'ensure-openclaw-version.cjs',
    'apply-openclaw-patches.cjs',
    'run-build-openclaw-runtime.cjs',
    'sync-openclaw-runtime-current.cjs',
    'bundle-openclaw-gateway.cjs',
    'ensure-openclaw-plugins.cjs',
    'sync-local-openclaw-extensions.cjs',
    'precompile-openclaw-extensions.cjs',
    'install-openclaw-channel-deps.cjs',
    'prune-openclaw-runtime.cjs',
  ]) {
    if (!dockerfile.includes(script)) errors.push(`openclaw-runtime: missing build step ${script}`);
  }
  if (!dockerfile.includes('TARGETARCH') || !dockerfile.includes('linux-x64') || !dockerfile.includes('linux-arm64')) {
    errors.push('openclaw-runtime: linux architecture mapping is incomplete');
  }
  if (/mac-(?:x64|arm64)|win-(?:x64|arm64)/i.test(dockerfile)) {
    errors.push('openclaw-runtime: host desktop binaries must not enter the image');
  }
  return errors;
};

export const checkDockerStatic = (root = repositoryRoot) => {
  const errors = [...validateDockerignore(root), ...validateEntrypoints(root)];
  for (const imageName of productionImages) {
    const dockerfilePath = path.join(root, 'docker', imageName, 'Dockerfile');
    if (!existsSync(dockerfilePath)) {
      errors.push(`${imageName}: missing Dockerfile`);
      continue;
    }
    const dockerfile = readFileSync(dockerfilePath, 'utf8');
    errors.push(...validateDockerfile(imageName, dockerfile));
    if (imageName === 'openclaw-runtime') errors.push(...validateOpenClaw(root, dockerfile));
  }
  const productionRuntime = path.join(root, 'docker/openclaw-runtime/Dockerfile');
  const debugRuntime = path.join(root, 'docker/openclaw-runtime/Dockerfile.debug');
  if (!existsSync(debugRuntime)) errors.push('openclaw-runtime: missing physically separate Dockerfile.debug');
  if (existsSync(productionRuntime) && forbiddenProductionPattern.test(readFileSync(productionRuntime, 'utf8'))) {
    errors.push('openclaw-runtime: production file contains debug/GUI content');
  }
  return errors;
};

const requireTool = (command, args) => {
  const result = run(command, args);
  if (result.status !== 0) {
    throw new BlockedError(`missing or unusable ${command}: ${result.stderr || result.stdout}`);
  }
  return (result.stdout || result.stderr).trim();
};

const waitForHealthy = (containerId, timeoutMs = 45_000) => {
  const deadline = Date.now() + timeoutMs;
  const waitBuffer = new Int32Array(new SharedArrayBuffer(4));
  while (Date.now() < deadline) {
    const inspect = run('docker', ['inspect', '--format', '{{.State.Status}} {{if .State.Health}}{{.State.Health.Status}}{{end}}', containerId]);
    const status = inspect.stdout.trim();
    if (status === 'running healthy') return;
    if (/^(?:exited|dead)/.test(status)) throw new Error(`container exited before healthy: ${status}`);
    Atomics.wait(waitBuffer, 0, 0, 250);
  }
  throw new Error(`container did not become healthy within ${timeoutMs}ms`);
};

const smokeImage = (imageName, tag, metadata) => {
  const isOpenClaw = imageName === 'openclaw-runtime';
  const gracefulStopRequired = ['worker', 'runtime-orchestrator', 'openclaw-runtime'].includes(imageName);
  const stopTimeoutSeconds = isOpenClaw ? 15 : 10;
  const tmpfs = isOpenClaw
    ? ['/tmp:rw,noexec,nosuid,size=16m', '/state:rw,noexec,nosuid,size=256m', '/workspace:rw,noexec,nosuid,size=1g']
    : ['/tmp:rw,noexec,nosuid,size=16m'];
  const args = [
    'run', '--detach', '--network=none', '--read-only', '--cap-drop=ALL',
    '--security-opt=no-new-privileges', '--user=10001:10001',
    ...tmpfs.map(mount => `--tmpfs=${mount}`),
  ];
  if (isOpenClaw) {
    args.push('--env=OPENCLAW_GATEWAY_TOKEN=p03-offline-smoke-token', '--env=OPENCLAW_GATEWAY_PORT=18789');
  }
  args.push(tag);
  const started = run('docker', args);
  if (started.status !== 0) throw new Error(`${imageName}: offline production entrypoint failed: ${started.stderr}`);
  const containerId = started.stdout.trim();
  try {
    waitForHealthy(containerId, isOpenClaw ? 90_000 : 45_000);
    const logs = run('docker', ['logs', containerId]);
    if (logs.status !== 0) throw new Error(`${imageName}: unable to capture healthy-container logs`);
    const combinedLogs = `${logs.stdout}\n${logs.stderr}`;
    if (isOpenClaw && !/\[gateway\] ready/.test(combinedLogs)) {
      throw new Error(`${imageName}: healthy container logs do not contain gateway ready`);
    }
    const stopStartedAt = Date.now();
    const stopped = run('docker', ['stop', `--time=${stopTimeoutSeconds}`, containerId]);
    const stopDurationMs = Date.now() - stopStartedAt;
    if (stopped.status !== 0) throw new Error(`${imageName}: graceful stop failed`);
    const stateInspect = run('docker', ['inspect', '--format', '{{json .State}}', containerId]);
    if (stateInspect.status !== 0) throw new Error(`${imageName}: stopped container state inspect failed`);
    const state = JSON.parse(stateInspect.stdout);
    const completedWithinTimeout = stopDurationMs <= (stopTimeoutSeconds + 2) * 1000;
    if (state.Status !== 'exited' || state.OOMKilled !== false
      || (gracefulStopRequired
        && (!completedWithinTimeout || ![0, 143].includes(state.ExitCode)))) {
      throw new Error(`${imageName}: unhealthy stop state ${stateInspect.stdout.trim()}`);
    }
    return {
      status: 'PASSED',
      effectiveUser: metadata.Config.User,
      platform: `${metadata.Os}/${metadata.Architecture}`,
      networkMode: 'none',
      readOnlyRootFilesystem: true,
      capDrop: ['ALL'],
      noNewPrivileges: true,
      tmpfs,
      health: 'healthy',
      gatewayReady: isOpenClaw ? true : undefined,
      gracefulStop: {
        required: gracefulStopRequired,
        timeoutSeconds: stopTimeoutSeconds,
        durationMs: stopDurationMs,
        completedWithinTimeout,
        exitCode: state.ExitCode,
        oomKilled: state.OOMKilled,
      },
      logsSha256: `sha256:${createHash('sha256').update(combinedLogs).digest('hex')}`,
    };
  } finally {
    run('docker', ['rm', '--force', containerId]);
  }
};

const inspectPluginInstallations = (imageName, tag, declaredPlugins) => {
  if (imageName !== 'openclaw-runtime') return undefined;
  const ids = declaredPlugins.map(plugin => plugin.id);
  const script = [
    "const fs = require('node:fs');",
    "const root = '/opt/openclaw/third-party-extensions';",
    'const ids = JSON.parse(process.argv[1]);',
    'process.stdout.write(JSON.stringify(ids.filter(id => fs.existsSync(`${root}/${id}/package.json`))));',
  ].join(' ');
  const inspected = run('docker', [
    'run', '--rm', '--network=none', '--read-only', '--cap-drop=ALL',
    '--security-opt=no-new-privileges', '--user=10001:10001',
    '--entrypoint=/usr/local/bin/node', tag, '-e', script, JSON.stringify(ids),
  ]);
  if (inspected.status !== 0) {
    throw new Error(`${imageName}: unable to inspect final-image plugin installations: ${inspected.stderr}`);
  }
  let installedIds;
  try {
    installedIds = JSON.parse(inspected.stdout);
  } catch {
    throw new Error(`${imageName}: plugin installation inspection returned invalid JSON`);
  }
  const installedSet = new Set(installedIds);
  const evidence = declaredPlugins.map(plugin => ({
    id: plugin.id,
    optional: Boolean(plugin.optional),
    status: installedSet.has(plugin.id) ? 'installed' : 'skipped',
  }));
  const missingRequired = evidence.filter(plugin => !plugin.optional && plugin.status !== 'installed');
  if (missingRequired.length > 0) {
    throw new Error(`${imageName}: required plugins missing from final image: ${missingRequired.map(plugin => plugin.id).join(', ')}`);
  }
  return evidence;
};

const buildAndSmoke = (imageName, sourceSha, reportDirectory, scannerPolicy, waivers, declaredPlugins) => {
  const tag = `lobsterai-p03-${imageName}:${sourceSha.slice(0, 12)}`;
  const dockerfile = `docker/${imageName}/Dockerfile`;
  const build = run('docker', ['build', '--no-cache', '--pull=false', '--file', dockerfile, '--tag', tag, '.'], {
    stdio: 'inherit',
  });
  if (build.status !== 0) throw new Error(`${imageName}: docker build failed with exit ${build.status}`);
  const inspect = run('docker', ['image', 'inspect', tag, '--format', '{{json .}}']);
  if (inspect.status !== 0) throw new Error(`${imageName}: image inspect failed`);
  const metadata = JSON.parse(inspect.stdout);
  if (metadata.Config?.User !== '10001:10001') throw new Error(`${imageName}: effective image user is not 10001:10001`);
  if (metadata.Os !== 'linux' || !['amd64', 'arm64'].includes(metadata.Architecture)) {
    throw new Error(`${imageName}: image must contain Linux amd64/arm64 content`);
  }
  const history = run('docker', ['history', '--no-trunc', '--format', '{{.CreatedBy}}', tag]);
  if (history.status !== 0) throw new Error(`${imageName}: image history scan failed`);
  if (secretPattern.test(history.stdout)) throw new Error(`${imageName}: secret-like content found in image history`);
  const runtimeEvidence = smokeImage(imageName, tag, metadata);
  const pluginInstallations = inspectPluginInstallations(imageName, tag, declaredPlugins);

  const imageDigest = metadata.Id;
  const sbomPath = path.join(reportDirectory, `${imageName}.spdx.json`);
  const dockerContext = run('docker', ['context', 'inspect', '--format', '{{.Endpoints.docker.Host}}']);
  if (dockerContext.status !== 0 || !dockerContext.stdout.trim()) {
    throw new Error(`${imageName}: unable to resolve Docker context for SBOM scan`);
  }
  const sbom = run('syft', [`docker:${tag}`, '--output', `spdx-json=${sbomPath}`], {
    env: { ...process.env, DOCKER_HOST: dockerContext.stdout.trim() },
  });
  if (sbom.status !== 0) throw new Error(`${imageName}: SBOM generation failed: ${sbom.stderr}`);
  const sbomSha256 = `sha256:${createHash('sha256').update(readFileSync(sbomPath)).digest('hex')}`;
  const scanPath = path.join(reportDirectory, `${imageName}.grype.json`);
  const scan = run('grype', [`docker:${tag}`, '--output', 'json'], {
    env: { ...process.env, DOCKER_HOST: dockerContext.stdout.trim(), GRYPE_CHECK_FOR_APP_UPDATE: 'false' },
  });
  if (scan.status !== 0) throw new Error(`${imageName}: Grype scan failed: ${scan.stderr}`);
  writeFileSync(scanPath, scan.stdout, { mode: 0o600 });
  const scanDocument = JSON.parse(scan.stdout);
  const findings = (scanDocument.matches ?? []).map(match => ({
    id: match.vulnerability?.id ?? '<unknown>',
    severity: match.vulnerability?.severity ?? 'Unknown',
    package: match.artifact?.name ?? '<unknown>',
    version: match.artifact?.version ?? '<unknown>',
  }));
  const vulnerabilityErrors = validateVulnerabilityReport({ imageDigest, findings }, waivers);
  if (vulnerabilityErrors.length > 0) throw new Error(`${imageName}: ${vulnerabilityErrors.join('; ')}`);
  const scanSha256 = `sha256:${createHash('sha256').update(readFileSync(scanPath)).digest('hex')}`;
  return {
    imageName,
    image: `${tag}@${imageDigest}`,
    digest: imageDigest,
    sourceSha,
    buildEvidence: {
      dockerfile,
      noCache: true,
      pull: false,
      platform: `${metadata.Os}/${metadata.Architecture}`,
    },
    runtimeEvidence,
    imageHistoryScan: {
      status: 'PASSED',
      secretLikeFindings: 0,
      sha256: `sha256:${createHash('sha256').update(history.stdout).digest('hex')}`,
    },
    sbom: {
      format: 'spdx-json',
      path: path.basename(sbomPath),
      sha256: sbomSha256,
      imageDigest,
      sourceSha,
    },
    vulnerabilityScan: {
      scanner: scannerPolicy.scanner,
      scannerVersion: scannerPolicy.version,
      path: path.basename(scanPath),
      sha256: scanSha256,
      imageDigest,
      sourceSha,
      findings,
    },
    criticalFindings: findings.filter(finding => String(finding.severity).toLowerCase() === 'critical').length,
    ...(pluginInstallations ? { pluginInstallations } : {}),
  };
};

const writeReport = (report) => {
  const reportDirectory = path.join(repositoryRoot, '.reports/supply-chain/20260712_PR3部署供应链证据');
  mkdirSync(reportDirectory, { recursive: true });
  const reportPath = path.join(reportDirectory, 'docker-build-check.json');
  const temporaryPath = `${reportPath}.${report.invocationId}.tmp`;
  writeFileSync(temporaryPath, `${JSON.stringify(report, null, 2)}\n`, { mode: 0o600 });
  renameSync(temporaryPath, reportPath);
  return { reportDirectory, reportPath };
};

const main = () => {
  const staticErrors = checkDockerStatic();
  if (staticErrors.length > 0) {
    console.error(JSON.stringify({ status: 'FAILED', check: 'docker-build', errors: staticErrors }, null, 2));
    process.exitCode = 1;
    return;
  }
  if (process.argv.includes('--static')) {
    console.log(JSON.stringify({ status: 'PASSED', check: 'docker-build-static', imagesChecked: productionImages }));
    return;
  }
  const dockerVersion = requireTool('docker', ['version', '--format', '{{.Client.Version}}']);
  const syftVersion = requireTool('syft', ['version']);
  const grypeVersion = requireTool('grype', ['version']);
  const scannerPolicy = JSON.parse(readFileSync(path.join(repositoryRoot, 'docs/supply-chain/scanner-policy.json'), 'utf8'));
  if (!grypeVersion.includes(scannerPolicy.version)) {
    throw new BlockedError(`Grype version must be ${scannerPolicy.version}; received ${grypeVersion}`);
  }
  const inventoryManifest = JSON.parse(readFileSync(
    path.join(repositoryRoot, 'docs/supply-chain/skills-and-plugins.manifest.json'),
    'utf8',
  ));
  const sourceSha = resolveProductSourceSha(repositoryRoot);
  if (!/^[a-f0-9]{40}$/.test(sourceSha ?? '')) throw new Error('unable to bind build to product source SHA');
  const worktree = run('git', ['status', '--porcelain', '--untracked-files=all']);
  if (worktree.status !== 0 || worktree.stdout.trim()) {
    throw new Error('Docker evidence requires a clean checkout with no tracked or untracked changes');
  }
  const invocationId = randomUUID();
  const { reportDirectory } = writeReport({
    schemaVersion: 1,
    status: 'RUNNING',
    invocationId,
    generatedAt: new Date().toISOString(),
    sourceSha,
    dockerVersion,
    syftVersion,
    grypeVersion,
    images: [],
  });
  const images = [];
  try {
    for (const imageName of productionImages) {
      images.push(buildAndSmoke(
        imageName,
        sourceSha,
        reportDirectory,
        scannerPolicy,
        inventoryManifest.waivers ?? [],
        inventoryManifest.assets
          .filter(asset => asset.kind === 'openclaw-plugin')
          .map(asset => ({ id: asset.id.replace(/^openclaw-plugin:/, ''), optional: asset.optional })),
      ));
    }
    const report = {
      schemaVersion: 1,
      status: 'PASSED',
      invocationId,
      generatedAt: new Date().toISOString(),
      sourceSha,
      dockerVersion,
      syftVersion,
      grypeVersion,
      productionNetwork: 'offline',
      images,
      signature: { status: 'BLOCKED', reason: 'Internal trust identity is not frozen; publish is forbidden.' },
    };
    const { reportPath } = writeReport(report);
    console.log(JSON.stringify({ ...report, reportPath }));
  } catch (error) {
    rmSync(path.join(reportDirectory, 'docker-build-check.json'), { force: true });
    throw error;
  }
};

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    main();
  } catch (error) {
    const blocked = error instanceof BlockedError;
    console.error(JSON.stringify({ status: blocked ? 'BLOCKED' : 'FAILED', check: 'docker-build', reason: String(error) }));
    process.exitCode = blocked ? 2 : 1;
  }
}
