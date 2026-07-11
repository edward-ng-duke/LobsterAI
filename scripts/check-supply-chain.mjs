import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import {
  existsSync,
  lstatSync,
  readFileSync,
  readdirSync,
  realpathSync,
} from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const manifestRelativePath = 'docs/supply-chain/skills-and-plugins.manifest.json';
const digestPattern = /^sha256:[a-f0-9]{64}$/;
const sourceShaPattern = /^[a-f0-9]{40}$/;
const unpinnedPattern = /(?:^|@)(?:latest|next|canary)$|^[~^*]|^[<>]=?|\s\|\||git\+(?![^#]+#[a-f0-9]{40}$)/i;
const publicRegistryPattern = /(?:registry\.npmjs\.org|github\.com|gitlab\.com)/i;
export const requiredProductionImages = ['api', 'openclaw-runtime', 'runtime-orchestrator', 'web', 'worker'];

const sha256 = (content) => `sha256:${createHash('sha256').update(content).digest('hex')}`;

const readJson = (root, relativePath) =>
  JSON.parse(readFileSync(path.join(root, relativePath), 'utf8'));

const fileDigest = (root, relativePath) => sha256(readFileSync(path.join(root, relativePath)));

const parseFrontmatterValue = (content, key) => {
  const match = content.match(new RegExp(`^${key}:\\s*["']?([^\\n"']+)["']?\\s*$`, 'm'));
  return match?.[1]?.trim();
};

const assertContainedRealPath = (root, relativePath, errors) => {
  const absolutePath = path.join(root, relativePath);
  if (!existsSync(absolutePath)) {
    errors.push(`missing discovered asset: ${relativePath}`);
    return false;
  }
  const rootRealPath = `${realpathSync(root)}${path.sep}`;
  const assetRealPath = realpathSync(absolutePath);
  if (!assetRealPath.startsWith(rootRealPath)) {
    errors.push(`asset escapes repository through symlink: ${relativePath}`);
    return false;
  }
  return true;
};

const discoverSkills = (root, errors) => {
  const skillsRoot = path.join(root, 'SKILLs');
  if (!existsSync(skillsRoot)) return [];
  return readdirSync(skillsRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() || entry.isSymbolicLink())
    .flatMap((entry) => {
      const sourcePath = path.posix.join('SKILLs', entry.name, 'SKILL.md');
      if (!assertContainedRealPath(root, sourcePath, errors)) return [];
      const content = readFileSync(path.join(root, sourcePath), 'utf8');
      const skillId = parseFrontmatterValue(content, 'name') ?? entry.name;
      const version = parseFrontmatterValue(content, 'version') ?? '0.0.0+bundled';
      const license = parseFrontmatterValue(content, 'license') ?? 'repository-license';
      return [{
        id: `skill:${skillId}`.toLowerCase(),
        kind: 'skill',
        sourcePath,
        source: 'repository:bundled-skill',
        version,
        integrity: fileDigest(root, sourcePath),
        license,
        scanStatus: 'platform-reviewed',
        productionEligible: true,
        optional: false,
      }];
    });
};

const discoverThirdPartyPlugins = (root) => {
  const packageJson = readJson(root, 'package.json');
  return (packageJson.openclaw?.plugins ?? []).map((plugin) => {
    const source = String(plugin.npm);
    const version = String(plugin.version);
    return {
      id: `openclaw-plugin:${plugin.id}`.toLowerCase(),
      kind: 'openclaw-plugin',
      sourcePath: 'package.json',
      source,
      version,
      integrity: sha256(`${source}@${version}`),
      license: 'registry-metadata-required',
      scanStatus: 'platform-reviewed',
      productionEligible: true,
      optional: Boolean(plugin.optional),
    };
  });
};

const discoverLocalExtensions = (root, errors) => {
  const extensionRoot = path.join(root, 'openclaw-extensions');
  if (!existsSync(extensionRoot)) return [];
  return readdirSync(extensionRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .flatMap((entry) => {
      const manifestPath = path.posix.join('openclaw-extensions', entry.name, 'openclaw.plugin.json');
      const packagePath = path.posix.join('openclaw-extensions', entry.name, 'package.json');
      if (!assertContainedRealPath(root, manifestPath, errors)
        || !assertContainedRealPath(root, packagePath, errors)) return [];
      const manifest = readJson(root, manifestPath);
      const packageJson = readJson(root, packagePath);
      const content = `${readFileSync(path.join(root, manifestPath), 'utf8')}\n${readFileSync(path.join(root, packagePath), 'utf8')}`;
      return [{
        id: `openclaw-extension:${manifest.id}`.toLowerCase(),
        kind: 'openclaw-extension',
        sourcePath: manifestPath,
        source: 'repository:openclaw-extension',
        version: String(packageJson.version),
        integrity: sha256(content),
        license: 'repository-license',
        scanStatus: 'platform-reviewed',
        productionEligible: true,
        optional: false,
      }];
    });
};

const discoverKit = (root) => {
  const sourcePath = 'src/main/computerUse/computerUseKit.ts';
  const inputPaths = [
    sourcePath,
    'src/main/computerUse/computerUseRuntime.ts',
    'src/shared/computerUse/constants.ts',
  ];
  const content = inputPaths.map(relativePath => readFileSync(path.join(root, relativePath), 'utf8')).join('\n');
  const version = readFileSync(path.join(root, 'src/main/computerUse/computerUseRuntime.ts'), 'utf8')
    .match(/Version:\s*'([^']+)'/)?.[1] ?? 'UNPINNED';
  return [{
    id: 'kit:computer-use',
    kind: 'kit',
    sourcePath,
    source: 'repository:built-in-kit',
    version,
    integrity: sha256(content),
    license: 'repository-license',
    scanStatus: 'platform-reviewed',
    productionEligible: false,
    optional: true,
  }];
};

const packageSpecFromArgs = (args) =>
  [...args].reverse().find((value) => typeof value === 'string' && !value.startsWith('-'));

const splitPackageSpec = (spec) => {
  if (!spec) return { source: 'unknown', version: 'UNPINNED' };
  const separator = spec.startsWith('@') ? spec.indexOf('@', 1) : spec.lastIndexOf('@');
  if (separator <= 0) return { source: spec, version: 'UNPINNED' };
  return { source: spec.slice(0, separator), version: spec.slice(separator + 1) || 'UNPINNED' };
};

const discoverMcpDefaults = (root) => {
  const sourcePath = 'src/renderer/data/mcpRegistry.json';
  const registry = readJson(root, sourcePath);
  return (registry.servers ?? []).map((server) => {
    const spec = server.transportType === 'stdio'
      ? splitPackageSpec(packageSpecFromArgs(server.defaultArgs ?? []))
      : { source: String(server.command), version: 'endpoint-v1' };
    const pinned = spec.version !== 'UNPINNED' && !unpinnedPattern.test(spec.version);
    return {
      id: `mcp-package:${server.id}`.toLowerCase(),
      kind: 'mcp-package',
      sourcePath,
      source: spec.source,
      version: spec.version,
      integrity: sha256(JSON.stringify(server)),
      license: 'registry-metadata-required',
      scanStatus: pinned ? 'needs-rescan' : 'blocked',
      productionEligible: false,
      optional: true,
    };
  });
};

export const discoverAssets = (root = repositoryRoot) => {
  const errors = [];
  const assets = [
    ...discoverSkills(root, errors),
    ...discoverThirdPartyPlugins(root),
    ...discoverLocalExtensions(root, errors),
    ...discoverKit(root),
    ...discoverMcpDefaults(root),
  ].sort((left, right) => left.id.localeCompare(right.id));
  return { assets, errors };
};

const validateAsset = (asset, errors) => {
  const label = asset?.id ?? '<missing-id>';
  if (!asset || typeof asset !== 'object') {
    errors.push('inventory contains a non-object asset');
    return;
  }
  if (!digestPattern.test(asset.integrity ?? '')) errors.push(`${label}: invalid integrity digest`);
  if (unpinnedPattern.test(asset.version ?? '') || asset.version === 'UNPINNED') {
    if (asset.scanStatus !== 'blocked' || asset.productionEligible !== false) {
      errors.push(`${label}: unpinned/latest assets must remain blocked and production-ineligible`);
    }
  }
  if (asset.productionEligible && asset.scanStatus !== 'platform-reviewed') {
    errors.push(`${label}: production asset is not platform-reviewed`);
  }
  if (asset.productionEligible && /^https?:\/\//i.test(asset.source ?? '')
    && publicRegistryPattern.test(asset.source)) {
    errors.push(`${label}: production asset points at an unapproved public source`);
  }
};

export const validateVulnerabilityReport = (report, waivers = [], now = new Date()) => {
  const errors = [];
  const findings = report.findings ?? [];
  for (const waiver of waivers) {
    if (waiver.imageDigest !== report.imageDigest) {
      if (findings.some(finding => finding.id === waiver.findingId)) {
        errors.push(`waiver ${waiver.findingId}: image digest mismatch`);
      }
      continue;
    }
    if (!findings.some(finding => finding.id === waiver.findingId)) {
      errors.push(`waiver ${waiver.findingId}: finding mismatch`);
    }
    if (new Date(waiver.expiresAt).getTime() <= now.getTime()) {
      errors.push(`waiver ${waiver.findingId}: waiver is expired`);
    }
  }
  for (const finding of findings) {
    if (String(finding.severity).toLowerCase() !== 'critical') continue;
    const validWaiver = waivers.some(waiver => waiver.findingId === finding.id
      && waiver.imageDigest === report.imageDigest
      && waiver.owner && waiver.reason
      && new Date(waiver.expiresAt).getTime() > now.getTime());
    if (!validWaiver) errors.push(`${report.imageDigest}: unwaived Critical finding ${finding.id}`);
  }
  return errors;
};

export const validateEvidence = (manifest, now = new Date(), expectedSourceSha) => {
  const errors = [];
  for (const waiver of manifest.waivers ?? []) {
    if (!waiver.owner || !waiver.reason || !waiver.expiresAt) {
      errors.push(`waiver ${waiver.findingId ?? '<unknown>'}: owner, reason and expiresAt are required`);
    } else if (new Date(waiver.expiresAt).getTime() <= now.getTime()) {
      errors.push(`waiver ${waiver.findingId ?? '<unknown>'}: waiver is expired`);
    }
  }
  const evidenceNames = (manifest.imageEvidence ?? []).map(evidence => evidence.imageName);
  const duplicates = evidenceNames.filter((name, index) => evidenceNames.indexOf(name) !== index);
  if (duplicates.length > 0) errors.push(`duplicate image evidence: ${[...new Set(duplicates)].join(', ')}`);
  for (const required of requiredProductionImages) {
    if (!evidenceNames.includes(required)) errors.push(`missing image evidence: ${required}`);
  }
  for (const actual of evidenceNames) {
    if (!requiredProductionImages.includes(actual)) errors.push(`unexpected image evidence: ${actual}`);
  }
  for (const evidence of manifest.imageEvidence ?? []) {
    if (!digestPattern.test(evidence.digest ?? '')) errors.push(`${evidence.image}: invalid image digest`);
    if (!sourceShaPattern.test(evidence.sourceSha ?? '')) errors.push(`${evidence.image}: invalid source SHA`);
    const buildEvidence = evidence.buildEvidence ?? {};
    if (buildEvidence.noCache !== true || buildEvidence.pull !== false) {
      errors.push(`${evidence.image}: build must record --no-cache and --pull=false`);
    }
    if (buildEvidence.dockerfile !== `docker/${evidence.imageName}/Dockerfile`) {
      errors.push(`${evidence.image}: Dockerfile evidence mismatch`);
    }
    if (!['linux/amd64', 'linux/arm64'].includes(buildEvidence.platform)) {
      errors.push(`${evidence.image}: invalid build platform evidence`);
    }
    const runtimeEvidence = evidence.runtimeEvidence ?? {};
    if (runtimeEvidence.status !== 'PASSED'
      || !/^[1-9][0-9]*:[1-9][0-9]*$/.test(runtimeEvidence.effectiveUser ?? '')
      || runtimeEvidence.platform !== buildEvidence.platform
      || runtimeEvidence.networkMode !== 'none'
      || runtimeEvidence.readOnlyRootFilesystem !== true
      || !(runtimeEvidence.capDrop ?? []).includes('ALL')
      || runtimeEvidence.noNewPrivileges !== true
      || runtimeEvidence.health !== 'healthy') {
      errors.push(`${evidence.image}: incomplete hardened runtime smoke evidence`);
    }
    if (!(runtimeEvidence.tmpfs ?? []).some(mount => mount.startsWith('/tmp:'))) {
      errors.push(`${evidence.image}: runtime smoke must record a restricted /tmp tmpfs`);
    }
    if (evidence.imageName === 'openclaw-runtime'
      && (runtimeEvidence.gatewayReady !== true
        || !(runtimeEvidence.tmpfs ?? []).some(mount => mount.startsWith('/state:'))
        || !(runtimeEvidence.tmpfs ?? []).some(mount => mount.startsWith('/workspace:')))) {
      errors.push(`${evidence.image}: OpenClaw gateway/state/workspace runtime evidence is incomplete`);
    }
    const gracefulStopRequired = ['worker', 'runtime-orchestrator', 'openclaw-runtime']
      .includes(evidence.imageName);
    if (runtimeEvidence.gracefulStop?.required !== gracefulStopRequired
      || (gracefulStopRequired
        && (runtimeEvidence.gracefulStop?.completedWithinTimeout !== true
          || ![0, 143].includes(runtimeEvidence.gracefulStop?.exitCode)))
      || !Number.isInteger(runtimeEvidence.gracefulStop?.exitCode)
      || !Number.isInteger(runtimeEvidence.gracefulStop?.durationMs)
      || runtimeEvidence.gracefulStop?.oomKilled !== false
      || !Number.isInteger(runtimeEvidence.gracefulStop?.timeoutSeconds)
      || !digestPattern.test(runtimeEvidence.logsSha256 ?? '')) {
      errors.push(`${evidence.image}: graceful stop/log evidence is incomplete`);
    }
    const historyScan = evidence.imageHistoryScan ?? {};
    if (historyScan.status !== 'PASSED'
      || historyScan.secretLikeFindings !== 0
      || !digestPattern.test(historyScan.sha256 ?? '')) {
      errors.push(`${evidence.image}: image history secret-scan evidence is incomplete`);
    }
    if (evidence.sbom?.imageDigest !== evidence.digest) errors.push(`${evidence.image}: SBOM digest mismatch`);
    if (evidence.sbom?.sourceSha !== evidence.sourceSha) errors.push(`${evidence.image}: SBOM source SHA mismatch`);
    if (expectedSourceSha && evidence.sourceSha !== expectedSourceSha) errors.push(`${evidence.image}: source SHA mismatch`);
    if (!evidence.vulnerabilityScan) errors.push(`${evidence.image}: vulnerability scan evidence is required`);
    else {
      if (evidence.vulnerabilityScan.imageDigest !== evidence.digest) errors.push(`${evidence.image}: vulnerability scan digest mismatch`);
      if (evidence.vulnerabilityScan.sourceSha !== evidence.sourceSha) errors.push(`${evidence.image}: vulnerability scan source SHA mismatch`);
      if (!digestPattern.test(evidence.vulnerabilityScan.sha256 ?? '')) errors.push(`${evidence.image}: invalid vulnerability scan hash`);
      errors.push(...validateVulnerabilityReport({
        imageDigest: evidence.digest,
        findings: evidence.vulnerabilityScan.findings ?? [],
      }, manifest.waivers ?? [], now));
    }
    if ((evidence.criticalFindings ?? 0) > 0
      && !(manifest.waivers ?? []).some(waiver => waiver.imageDigest === evidence.digest)) {
      errors.push(`${evidence.image}: critical findings are not allowed`);
    }
    if (/:latest(?:$|@)/.test(evidence.image ?? '')) errors.push(`${evidence.image}: latest tag is forbidden`);
  }
  if (manifest.signature?.status === 'ACTIVE' && (manifest.signature.trustedIdentities?.length ?? 0) === 0) {
    errors.push('signature policy cannot be ACTIVE without trusted identities');
  }
  if (manifest.signature?.requiredForPublish !== true) errors.push('signatures must be required for publish');
  return errors;
};

export const validateScanReport = (report) => {
  const errors = [];
  for (const finding of report.findings ?? []) {
    if (String(finding.severity).toLowerCase() === 'critical') {
      errors.push(`${report.subject ?? '<unknown>'}: critical finding ${finding.ruleId ?? '<unknown>'}`);
    }
  }
  return errors;
};

export const validateInventory = (root, manifest, options = {}) => {
  const { assets: discovered, errors } = discoverAssets(root);
  if (manifest.schemaVersion !== 2) errors.push('manifest schemaVersion must be 2');
  if (manifest.status !== 'ACTIVE') errors.push('manifest status must be ACTIVE');
  if (manifest.productionNetwork !== 'offline') errors.push('productionNetwork must be offline');
  const declared = Array.isArray(manifest.assets) ? manifest.assets : [];
  const ids = declared.map((asset) => asset?.id);
  const lowerCaseIds = ids.map((id) => String(id).toLocaleLowerCase());
  if (new Set(ids).size !== ids.length) errors.push('duplicate inventory asset ID');
  if (new Set(lowerCaseIds).size !== lowerCaseIds.length) errors.push('case-insensitive inventory asset collision');
  if (JSON.stringify(ids) !== JSON.stringify([...ids].sort((a, b) => String(a).localeCompare(String(b))))) {
    errors.push('inventory assets are not sorted by ID');
  }
  declared.forEach((asset) => validateAsset(asset, errors));
  const discoveredById = new Map(discovered.map((asset) => [asset.id, asset]));
  const declaredById = new Map(declared.map((asset) => [asset.id, asset]));
  for (const asset of discovered) {
    const actual = declaredById.get(asset.id);
    if (!actual) errors.push(`manifest is missing discovered asset: ${asset.id}`);
    else if (JSON.stringify(actual) !== JSON.stringify(asset)) errors.push(`inventory drift: ${asset.id}`);
  }
  for (const asset of declared) {
    if (!discoveredById.has(asset.id)) errors.push(`manifest contains ghost asset: ${asset.id}`);
  }
  if (options.requireEvidence) errors.push(...validateEvidence(manifest, new Date(), options.expectedSourceSha));
  return errors;
};

export const buildManifest = (root = repositoryRoot) => {
  const { assets, errors } = discoverAssets(root);
  if (errors.length > 0) throw new Error(errors.join('\n'));
  return {
    $schema: '../../libs/shared/contracts/assets/supply-chain-inventory.schema.json',
    schemaVersion: 2,
    status: 'ACTIVE',
    activationTask: 'P03-PR3部署供应链',
    productionNetwork: 'offline',
    assets,
    imageEvidence: [],
    signature: {
      status: 'BLOCKED',
      reason: 'Internal registry and trusted signing identities are not frozen; publish and deploy remain blocked.',
      requiredForPublish: true,
      trustedIdentities: [],
    },
    waivers: [],
  };
};

const run = () => {
  const manifest = readJson(repositoryRoot, manifestRelativePath);
  const git = spawnSync('git', ['rev-parse', 'HEAD'], { cwd: repositoryRoot, encoding: 'utf8' });
  const expectedSourceSha = git.status === 0 ? git.stdout.trim() : undefined;
  const evidencePath = path.join(repositoryRoot, '.reports/supply-chain/20260711_PR3部署供应链证据/docker-build-check.json');
  let evidence = [];
  if (existsSync(evidencePath)) {
    const report = JSON.parse(readFileSync(evidencePath, 'utf8'));
    if (report.status === 'PASSED') evidence = report.images ?? [];
  }
  const errors = validateInventory(repositoryRoot, { ...manifest, imageEvidence: evidence }, {
    requireEvidence: true,
    expectedSourceSha,
  });
  if (errors.length > 0) {
    console.error(JSON.stringify({ status: 'FAILED', check: 'supply-chain', errors }, null, 2));
    process.exitCode = 1;
    return;
  }
  console.log(JSON.stringify({
    status: 'PASSED',
    check: 'supply-chain',
    assetsChecked: manifest.assets.length,
    imageEvidenceChecked: evidence.length,
    publishStatus: manifest.signature.status,
  }));
};

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) run();
