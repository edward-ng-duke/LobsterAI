import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import {
  chmodSync,
  cpSync,
  lstatSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  realpathSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

import {
  buildManifest,
  p03EvidenceRelativeDirectory,
  p03HardenedPluginInspectionScript,
  requiredProductionImages,
} from '../../scripts/check-supply-chain.mjs';

type JsonObject = Record<string, any>;
type DockerMode = 'valid' | 'unavailable' | 'digest-drift';

const repositoryRoot = path.resolve(import.meta.dirname, '../..');
const templateDirectory = path.join(
  repositoryRoot,
  'tests/fixtures/supply_chain/exact-five-template',
);

const sha256 = (content: string | Buffer) =>
  `sha256:${createHash('sha256').update(content).digest('hex')}`;

const readJson = (filePath: string) => JSON.parse(readFileSync(filePath, 'utf8')) as JsonObject;

const writeJson = (filePath: string, value: unknown) => {
  mkdirSync(path.dirname(filePath), { recursive: true });
  writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, { mode: 0o600 });
};

const writeText = (filePath: string, value: string) => {
  mkdirSync(path.dirname(filePath), { recursive: true });
  writeFileSync(filePath, value);
};

const copyTrackedFile = (root: string, relativePath: string) => {
  const destination = path.join(root, relativePath);
  mkdirSync(path.dirname(destination), { recursive: true });
  cpSync(path.join(repositoryRoot, relativePath), destination);
};

const runGit = (root: string, args: string[]) => {
  const result = spawnSync('git', args, { cwd: root, encoding: 'utf8' });
  if (result.status !== 0) {
    throw new Error(`fixture Git command failed: git ${args.join(' ')}\n${result.stderr}`);
  }
  return result.stdout.trim();
};

const renderTemplate = (filePath: string, replacements: Record<string, string>) => {
  let content = readFileSync(filePath, 'utf8');
  for (const [token, value] of Object.entries(replacements)) {
    content = content.replaceAll(token, value);
  }
  return JSON.parse(content) as JsonObject;
};

const pluginInstallations = (plugins: JsonObject[]) => plugins.map(plugin => ({
  id: plugin.id,
  optional: Boolean(plugin.optional),
  status: plugin.id === 'moltbot-popo' ? 'skipped' : 'installed',
}));

const buildImageEvidence = (
  imageName: string,
  sourceSha: string,
  evidenceDirectory: string,
  plugins: JsonObject[],
) => {
  const sourcePrefix = sourceSha.slice(0, 12);
  const localImageId = sha256(`synthetic-config:${imageName}:${sourceSha}`);
  const digest = sha256(`synthetic-manifest:${imageName}:${sourceSha}`);
  const replacements = {
    __IMAGE_NAME__: imageName,
    __SOURCE_PREFIX__: sourcePrefix,
    __IMAGE_DIGEST__: digest,
    __LOCAL_IMAGE_ID__: localImageId,
    __IMAGE_DIGEST_HEX__: digest.slice('sha256:'.length),
    __ENCODED_IMAGE_DIGEST__: encodeURIComponent(digest),
  };
  const spdxPath = path.join(evidenceDirectory, `${imageName}.spdx.json`);
  const grypePath = path.join(evidenceDirectory, `${imageName}.grype.json`);
  const spdx = renderTemplate(path.join(templateDirectory, `${imageName}.spdx.json`), replacements);
  const grype = renderTemplate(path.join(templateDirectory, `${imageName}.grype.json`), replacements);
  writeJson(spdxPath, spdx);
  writeJson(grypePath, grype);
  const findings = grype.matches.map((match: JsonObject) => ({
    id: match.vulnerability.id,
    severity: match.vulnerability.severity,
    artifactId: match.artifact.id,
    package: match.artifact.name,
    version: match.artifact.version,
  }));
  const gracefulStopRequired = ['worker', 'runtime-orchestrator', 'openclaw-runtime']
    .includes(imageName);
  const openClaw = imageName === 'openclaw-runtime';
  const tag = `lobsterai-p03-${imageName}:${sourcePrefix}`;
  return {
    imageName,
    image: `${tag}@${digest}`,
    digest,
    localImageId,
    sourceSha,
    buildEvidence: {
      dockerfile: `docker/${imageName}/Dockerfile`,
      noCache: true,
      pull: false,
      platform: 'linux/amd64',
    },
    runtimeEvidence: {
      status: 'PASSED',
      effectiveUser: '10001:10001',
      platform: 'linux/amd64',
      networkMode: 'none',
      readOnlyRootFilesystem: true,
      capDrop: ['ALL'],
      noNewPrivileges: true,
      tmpfs: openClaw
        ? [
          '/tmp:rw,noexec,nosuid,size=16m',
          '/state:rw,noexec,nosuid,size=256m',
          '/workspace:rw,noexec,nosuid,size=1g',
        ]
        : ['/tmp:rw,noexec,nosuid,size=16m'],
      health: 'healthy',
      ...(openClaw ? { gatewayReady: true } : {}),
      gracefulStop: {
        required: gracefulStopRequired,
        timeoutSeconds: openClaw ? 15 : 10,
        durationMs: 10,
        completedWithinTimeout: true,
        exitCode: 0,
        oomKilled: false,
      },
      logsSha256: sha256(`synthetic-logs:${imageName}:${sourceSha}`),
    },
    imageHistoryScan: {
      status: 'PASSED',
      secretLikeFindings: 0,
      sha256: sha256(`synthetic-history:${imageName}:${sourceSha}`),
    },
    sbom: {
      format: 'spdx-json',
      path: path.basename(spdxPath),
      sha256: sha256(readFileSync(spdxPath)),
      imageDigest: digest,
      sourceSha,
    },
    vulnerabilityScan: {
      scanner: 'grype',
      scannerVersion: '0.112.0',
      path: path.basename(grypePath),
      sha256: sha256(readFileSync(grypePath)),
      imageDigest: digest,
      sourceSha,
      findings,
    },
    criticalFindings: 0,
    ...(openClaw ? { pluginInstallations: pluginInstallations(plugins) } : {}),
  };
};

const fakeDockerProgram = `#!/usr/bin/env node
const fs = require('node:fs');

const args = process.argv.slice(2);
const isInspect = args.length === 5
  && args[0] === 'image'
  && args[1] === 'inspect'
  && args[3] === '--format'
  && args[4] === '{{json .}}';
const hardenedRunPrefix = [
  'run', '--rm', '--network=none', '--read-only', '--cap-drop=ALL',
  '--security-opt=no-new-privileges', '--user=10001:10001',
  '--entrypoint=/usr/local/bin/node',
];
const isHardenedRun = args.length === 12
  && hardenedRunPrefix.every((value, index) => args[index] === value)
  && args[9] === '-e';
if (!isInspect && !isHardenedRun) process.exit(64);

let state;
try {
  state = JSON.parse(fs.readFileSync(process.env.P03_FIXTURE_DOCKER_STATE, 'utf8'));
} catch {
  process.exit(64);
}

if (isInspect) {
  const image = state.images.find(candidate => candidate.tag === args[2]);
  if (!image) process.exit(64);
  if (process.env.P03_FIXTURE_DOCKER_MODE === 'unavailable') process.exit(1);
  const localImageId = process.env.P03_FIXTURE_DOCKER_MODE === 'digest-drift'
    ? 'sha256:' + '0'.repeat(64)
    : image.localImageId;
  process.stdout.write(JSON.stringify({
    Id: localImageId,
    RepoDigests: [],
  }));
  process.exit(0);
}

if (args[8] !== state.openClawTag
  || args[10] !== state.pluginInspectionScript) process.exit(64);
let requestedIds;
try {
  requestedIds = JSON.parse(args[11]);
} catch {
  process.exit(64);
}
if (JSON.stringify(requestedIds) !== JSON.stringify(state.declaredPluginIds)) process.exit(64);
process.stdout.write(JSON.stringify(state.installedPluginIds));
`;

export const createSupplyChainEvidenceFixture = (
  options: { dockerMode?: DockerMode } = {},
) => {
  const dockerMode = options.dockerMode ?? 'valid';
  const root = mkdtempSync(path.join(tmpdir(), 'lobsterai-p03-evidence-'));
  let cleaned = false;
  try {
    copyTrackedFile(root, 'scripts/check-supply-chain.mjs');
    copyTrackedFile(root, 'libs/shared/contracts/assets/supply-chain-inventory.schema.json');

    const productionPackage = readJson(path.join(repositoryRoot, 'package.json'));
    const plugins = structuredClone(productionPackage.openclaw?.plugins ?? []) as JsonObject[];
    if (plugins.length !== 10) {
      throw new Error(`synthetic fixture requires exactly 10 declared plugins; received ${plugins.length}`);
    }
    writeJson(path.join(root, 'package.json'), {
      name: 'lobsterai-synthetic-supply-chain-fixture',
      private: true,
      openclaw: { plugins },
    });
    writeText(path.join(root, '.gitignore'), '.reports\nbin\nnode_modules\n');
    writeText(
      path.join(root, 'src/main/computerUse/computerUseKit.ts'),
      'export const syntheticComputerUseKit = true;\n',
    );
    writeText(
      path.join(root, 'src/main/computerUse/computerUseRuntime.ts'),
      "export const syntheticComputerUseRuntime = { Version: 'synthetic-1.0.0' };\n",
    );
    writeText(
      path.join(root, 'src/shared/computerUse/constants.ts'),
      "export const syntheticComputerUseConstant = 'fixture';\n",
    );
    writeJson(path.join(root, 'src/renderer/data/mcpRegistry.json'), { servers: [] });
    mkdirSync(path.join(root, 'SKILLs'), { recursive: true });
    mkdirSync(path.join(root, 'openclaw-extensions'), { recursive: true });
    writeJson(
      path.join(root, 'docs/supply-chain/skills-and-plugins.manifest.json'),
      buildManifest(root),
    );

    runGit(root, ['init', '--initial-branch=main', '--quiet']);
    runGit(root, ['config', 'user.name', 'LobsterAI Synthetic Fixture']);
    runGit(root, ['config', 'user.email', 'synthetic-fixture@invalid.example']);
    runGit(root, ['add', '--all']);
    runGit(root, ['commit', '--quiet', '--no-gpg-sign', '-m', 'synthetic supply-chain baseline']);
    const sourceSha = runGit(root, ['rev-parse', 'HEAD']);
    if (!/^[a-f0-9]{40}$/.test(sourceSha)) throw new Error('fixture source SHA is invalid');

    const evidenceDirectory = path.join(root, p03EvidenceRelativeDirectory);
    mkdirSync(evidenceDirectory, { recursive: true });
    const reportTemplate = readJson(path.join(templateDirectory, 'docker-build-check.template.json'));
    const imageNames = reportTemplate.images.map((image: JsonObject) => image.imageName) as string[];
    if (imageNames.length !== 5
      || new Set(imageNames).size !== 5
      || requiredProductionImages.some(imageName => !imageNames.includes(imageName))) {
      throw new Error('synthetic report template must declare the exact five production images');
    }
    const images = imageNames.map(imageName => buildImageEvidence(
      imageName,
      sourceSha,
      evidenceDirectory,
      plugins,
    ));
    const report = {
      ...reportTemplate,
      checkoutSha: sourceSha,
      productSourceSha: sourceSha,
      sourceSha,
      images,
    };
    const reportPath = path.join(evidenceDirectory, 'docker-build-check.json');
    writeJson(reportPath, report);
    const canonicalEvidenceDocuments = new Map<string, {
      relativePath: string;
      absolutePath: string;
    }>();
    for (const image of images) {
      for (const kind of ['sbom', 'vulnerabilityScan'] as const) {
        const relativePath = image[kind].path;
        canonicalEvidenceDocuments.set(`${image.imageName}:${kind}`, {
          relativePath,
          absolutePath: path.join(evidenceDirectory, relativePath),
        });
      }
    }

    const binDirectory = path.join(root, 'bin');
    mkdirSync(binDirectory, { recursive: true });
    const dockerStatePath = path.join(binDirectory, 'docker-state.json');
    const openClaw = images.find(image => image.imageName === 'openclaw-runtime');
    writeJson(dockerStatePath, {
      images: images.map(image => ({
        tag: `lobsterai-p03-${image.imageName}:${sourceSha.slice(0, 12)}`,
        repository: `lobsterai-p03-${image.imageName}`,
        digest: image.digest,
        localImageId: image.localImageId,
      })),
      openClawTag: `lobsterai-p03-openclaw-runtime:${sourceSha.slice(0, 12)}`,
      pluginInspectionScript: p03HardenedPluginInspectionScript,
      declaredPluginIds: plugins.map(plugin => plugin.id),
      installedPluginIds: openClaw?.pluginInstallations
        .filter((plugin: JsonObject) => plugin.status === 'installed')
        .map((plugin: JsonObject) => plugin.id),
    });
    const dockerPath = path.join(binDirectory, 'docker');
    writeFileSync(dockerPath, fakeDockerProgram, { mode: 0o755 });
    chmodSync(dockerPath, 0o755);
    symlinkSync(path.join(repositoryRoot, 'node_modules'), path.join(root, 'node_modules'), 'junction');

    const readReport = () => readJson(reportPath);
    const writeReport = (value: unknown) => writeJson(reportPath, value);
    const mutateEvidenceDocument = (
      imageName: string,
      kind: 'sbom' | 'vulnerabilityScan',
      mutate: (document: JsonObject) => void,
    ) => {
      const currentReport = readReport();
      const image = currentReport.images.find(
        (candidate: JsonObject) => candidate.imageName === imageName,
      );
      if (!image) throw new Error(`unknown fixture image: ${imageName}`);
      const canonical = canonicalEvidenceDocuments.get(`${imageName}:${kind}`);
      if (!canonical || image[kind]?.path !== canonical.relativePath) {
        throw new Error(`fixture evidence path changed for ${imageName}:${kind}`);
      }
      const relativeToEvidence = path.relative(evidenceDirectory, canonical.absolutePath);
      if (!relativeToEvidence
        || relativeToEvidence.startsWith(`..${path.sep}`)
        || path.isAbsolute(relativeToEvidence)) {
        throw new Error(`fixture evidence path escapes its directory for ${imageName}:${kind}`);
      }
      const stat = lstatSync(canonical.absolutePath);
      if (!stat.isFile() || stat.isSymbolicLink()
        || path.dirname(realpathSync(canonical.absolutePath)) !== realpathSync(evidenceDirectory)) {
        throw new Error(`fixture evidence document is not a contained regular file for ${imageName}:${kind}`);
      }
      const documentPath = canonical.absolutePath;
      const document = readJson(documentPath);
      mutate(document);
      writeJson(documentPath, document);
      image[kind].sha256 = sha256(readFileSync(documentPath));
      writeReport(currentReport);
    };
    const cleanup = () => {
      if (cleaned) return;
      cleaned = true;
      rmSync(root, { recursive: true, force: true });
    };
    const runChecker = () => spawnSync(
      process.execPath,
      ['scripts/check-supply-chain.mjs'],
      {
        cwd: root,
        encoding: 'utf8',
        timeout: 10_000,
        env: {
          ...process.env,
          PATH: `${binDirectory}${path.delimiter}${process.env.PATH ?? ''}`,
          P03_FIXTURE_DOCKER_MODE: dockerMode,
          P03_FIXTURE_DOCKER_STATE: dockerStatePath,
        },
      },
    );

    return {
      root,
      reportPath,
      evidenceDirectory,
      sourceSha,
      runChecker,
      readReport,
      writeReport,
      mutateEvidenceDocument,
      cleanup,
    };
  } catch (error) {
    rmSync(root, { recursive: true, force: true });
    throw error;
  }
};
