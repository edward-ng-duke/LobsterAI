import { createHash } from 'node:crypto';
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
  const sourcePath = 'src/main/computerUse/computerUseRuntime.ts';
  const content = readFileSync(path.join(root, sourcePath), 'utf8');
  const version = content.match(/Version:\s*'([^']+)'/)?.[1] ?? 'UNPINNED';
  return [{
    id: 'kit:computer-use',
    kind: 'kit',
    sourcePath,
    source: 'repository:built-in-kit',
    version,
    integrity: fileDigest(root, sourcePath),
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

export const validateEvidence = (manifest, now = new Date()) => {
  const errors = [];
  for (const waiver of manifest.waivers ?? []) {
    if (!waiver.owner || !waiver.reason || !waiver.expiresAt) {
      errors.push(`waiver ${waiver.findingId ?? '<unknown>'}: owner, reason and expiresAt are required`);
    } else if (new Date(waiver.expiresAt).getTime() <= now.getTime()) {
      errors.push(`waiver ${waiver.findingId ?? '<unknown>'}: waiver is expired`);
    }
  }
  for (const evidence of manifest.imageEvidence ?? []) {
    if (!digestPattern.test(evidence.digest ?? '')) errors.push(`${evidence.image}: invalid image digest`);
    if (!sourceShaPattern.test(evidence.sourceSha ?? '')) errors.push(`${evidence.image}: invalid source SHA`);
    if (evidence.sbom?.imageDigest !== evidence.digest) errors.push(`${evidence.image}: SBOM digest mismatch`);
    if (evidence.sbom?.sourceSha !== evidence.sourceSha) errors.push(`${evidence.image}: SBOM source SHA mismatch`);
    if ((evidence.criticalFindings ?? 0) > 0) errors.push(`${evidence.image}: critical findings are not allowed`);
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

export const validateInventory = (root, manifest) => {
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
  errors.push(...validateEvidence(manifest));
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
  const errors = validateInventory(repositoryRoot, manifest);
  if (errors.length > 0) {
    console.error(JSON.stringify({ status: 'FAILED', check: 'supply-chain', errors }, null, 2));
    process.exitCode = 1;
    return;
  }
  console.log(JSON.stringify({
    status: 'PASSED',
    check: 'supply-chain',
    assetsChecked: manifest.assets.length,
    imageEvidenceChecked: manifest.imageEvidence.length,
    publishStatus: manifest.signature.status,
  }));
};

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) run();
