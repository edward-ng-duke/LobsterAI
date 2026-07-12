import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dependencyName = 'form-data';
const expectedVersion = '4.0.4';
const expectedIntegrity = 'sha512-KrGhL9Q4zjj0kiUt5OO4Mr/A/jlI2jDYs5eHBpYHPcBEVSiipAvn2Ko2HnPe20rmcuuvMHNdZFp+4IlGTMF0Ow==';
const defaultPluginRoot = path.join(
  repositoryRoot,
  'vendor/openclaw-runtime/current/third-party-extensions/dingtalk-connector',
);

const readJson = filePath => JSON.parse(readFileSync(filePath, 'utf8'));

export const verifyHardenedDependency = (pluginRoot) => {
  const errors = [];
  const lockPath = path.join(pluginRoot, 'package-lock.json');
  if (!existsSync(lockPath)) return ['DingTalk dependency hardening did not produce package-lock.json'];

  const lock = readJson(lockPath);
  const locked = Object.entries(lock.packages ?? {})
    .filter(([entryPath, entry]) => entryPath.endsWith(`node_modules/${dependencyName}`)
      && entry?.name !== '__never__');
  if (locked.length === 0) errors.push(`${dependencyName} is missing from the DingTalk package lock`);
  for (const [entryPath, entry] of locked) {
    if (entry.version !== expectedVersion) errors.push(`${entryPath} lock version must be ${expectedVersion}`);
    if (entry.integrity !== expectedIntegrity) errors.push(`${entryPath} lock integrity mismatch`);
  }

  const nodeModulesRoot = path.join(pluginRoot, 'node_modules');
  const installed = existsSync(nodeModulesRoot)
    ? readdirSync(nodeModulesRoot, { recursive: true })
      .filter(entry => typeof entry === 'string' && entry.endsWith('package.json'))
      .map(entry => path.join(nodeModulesRoot, entry))
      .map(filePath => ({ filePath, pkg: readJson(filePath) }))
      .filter(({ pkg }) => pkg.name === dependencyName)
    : [];
  if (installed.length === 0) errors.push(`${dependencyName} is missing from the DingTalk runtime`);
  for (const { filePath, pkg } of installed) {
    if (pkg.version !== expectedVersion) {
      errors.push(`${path.relative(pluginRoot, filePath)} runtime version must be ${expectedVersion}`);
    }
  }
  return [...new Set(errors)];
};

export const hardenOpenClawRuntimeDependencies = (pluginRoot = defaultPluginRoot) => {
  if (!existsSync(path.join(pluginRoot, 'package.json'))) {
    throw new Error(`DingTalk plugin root is missing: ${pluginRoot}`);
  }
  const packagePath = path.join(pluginRoot, 'package.json');
  const pluginPackage = readJson(packagePath);
  pluginPackage.dependencies = {
    ...(pluginPackage.dependencies ?? {}),
    [dependencyName]: expectedVersion,
  };
  pluginPackage.overrides = {
    ...(pluginPackage.overrides ?? {}),
    [dependencyName]: expectedVersion,
  };
  writeFileSync(packagePath, `${JSON.stringify(pluginPackage, null, 2)}\n`);
  rmSync(path.join(pluginRoot, 'package-lock.json'), { force: true });
  const install = spawnSync('npm', [
    'install',
    '--omit=dev',
    '--ignore-scripts',
    '--no-audit',
    '--no-fund',
    '--legacy-peer-deps',
  ], {
    cwd: pluginRoot,
    encoding: 'utf8',
  });
  if (install.status !== 0) {
    throw new Error(`failed to harden DingTalk dependencies: ${install.stderr || install.stdout}`);
  }
  const dedupe = spawnSync('npm', [
    'dedupe',
    '--omit=dev',
    '--ignore-scripts',
    '--no-audit',
    '--no-fund',
    '--legacy-peer-deps',
  ], {
    cwd: pluginRoot,
    encoding: 'utf8',
  });
  if (dedupe.status !== 0) {
    throw new Error(`failed to dedupe DingTalk dependencies: ${dedupe.stderr || dedupe.stdout}`);
  }
  const errors = verifyHardenedDependency(pluginRoot);
  if (errors.length > 0) throw new Error(errors.join('; '));
  console.log(`[openclaw-runtime-hardening] ${dependencyName}@${expectedVersion} integrity verified`);
};

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    hardenOpenClawRuntimeDependencies(process.argv[2] && path.resolve(process.argv[2]));
  } catch (error) {
    console.error(`[openclaw-runtime-hardening] ${String(error)}`);
    process.exitCode = 1;
  }
}
