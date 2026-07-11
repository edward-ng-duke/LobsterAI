import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

import { repositoryRoot as defaultRepositoryRoot } from './common.mjs';
import { validateEvidenceOnlyDescendant } from './evidence-provenance.mjs';

const argument = (name) => {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
};
const root = path.resolve(argument('--root') ?? defaultRepositoryRoot);
const gitRoot = path.resolve(argument('--git-root') ?? root);
const schemaPath = path.join(root, 'scripts/db/evidence-bundle.schema.json');

if (!/^[a-f0-9]{40}$/.test(process.env.P02_EVIDENCE_BOOTSTRAPPED ?? '')) {
  console.error(JSON.stringify({
    status: 'FAILED',
    errors: ['evidence validator must run through the trusted bootstrap'],
  }));
  process.exit(1);
}

if (process.argv.includes('--print-schema')) {
  process.stdout.write(readFileSync(schemaPath, 'utf8'));
  process.exit(0);
}

const evidenceDirectory = path.join(root, 'docs/db/20260711_P02_Prisma与RLS脚手架证据');
const reportFiles = {
  contractsPreflight: 'contracts-preflight.json',
  preflight: 'preflight.json',
  integration: 'integration.json',
  validation: 'validation.json',
};
if (existsSync(path.join(evidenceDirectory, 'prisma-stage-gate.json'))) {
  reportFiles.prismaStageGate = 'prisma-stage-gate.json';
}

const readJson = (target) => JSON.parse(readFileSync(target, 'utf8'));
const schema = readJson(schemaPath);
const bundle = Object.fromEntries(
  Object.entries(reportFiles).map(([key, file]) => [key, readJson(path.join(evidenceDirectory, file))]),
);
bundle.manifest = readJson(path.join(evidenceDirectory, 'evidence-manifest.json'));

const resolveReference = (reference) => {
  if (!reference.startsWith('#/')) throw new Error(`unsupported schema reference ${reference}`);
  return reference
    .slice(2)
    .split('/')
    .reduce((value, key) => value[key.replaceAll('~1', '/').replaceAll('~0', '~')], schema);
};

const errors = [];
const validate = (value, definition, location) => {
  if (definition.$ref) return validate(value, resolveReference(definition.$ref), location);
  if ('const' in definition && value !== definition.const) {
    errors.push(`${location}: expected constant ${JSON.stringify(definition.const)}`);
    return;
  }
  if (definition.type === 'object') {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      errors.push(`${location}: expected object`);
      return;
    }
    const allowed = new Set(Object.keys(definition.properties ?? {}));
    for (const required of definition.required ?? []) {
      if (!(required in value)) errors.push(`${location}: missing required property ${required}`);
    }
    if (definition.additionalProperties === false) {
      for (const key of Object.keys(value)) {
        if (!allowed.has(key)) errors.push(`${location}: unknown property ${key}`);
      }
    }
    for (const [key, child] of Object.entries(definition.properties ?? {})) {
      if (key in value) validate(value[key], child, `${location}.${key}`);
    }
    return;
  }
  if (definition.type === 'array') {
    if (!Array.isArray(value)) {
      errors.push(`${location}: expected array`);
      return;
    }
    if (value.length < (definition.minItems ?? 0)) errors.push(`${location}: too few items`);
    value.forEach((entry, index) => validate(entry, definition.items, `${location}[${index}]`));
    return;
  }
  if (definition.type === 'string' && typeof value !== 'string') errors.push(`${location}: expected string`);
  if (definition.type === 'boolean' && typeof value !== 'boolean') errors.push(`${location}: expected boolean`);
  if (definition.type === 'integer' && !Number.isInteger(value)) errors.push(`${location}: expected integer`);
  if (definition.pattern && typeof value === 'string' && !new RegExp(definition.pattern).test(value)) {
    errors.push(`${location}: does not match ${definition.pattern}`);
  }
};
validate(bundle, schema, '$');

const sha256File = (target) => createHash('sha256').update(readFileSync(target)).digest('hex');
const manifest = bundle.manifest;
if (process.env.P02_EVIDENCE_BOOTSTRAPPED !== manifest.codeEvidenceSha) {
  errors.push('trusted bootstrap source SHA does not match codeEvidenceSha');
}
const codeReports = ['contracts-preflight.json', 'preflight.json', 'integration.json', 'validation.json'];
for (const file of codeReports) {
  const report = readJson(path.join(evidenceDirectory, file));
  const entry = manifest.reports?.[file];
  if (report.sourceSha !== manifest.codeEvidenceSha || entry?.sourceSha !== report.sourceSha) {
    errors.push(`${file}: source SHA does not match codeEvidenceSha`);
  }
  if (entry?.sha256 !== sha256File(path.join(evidenceDirectory, file))) {
    errors.push(`${file}: manifest report digest mismatch`);
  }
}
const stageFile = path.join(evidenceDirectory, 'prisma-stage-gate.json');
if (existsSync(stageFile)) {
  const stage = bundle.prismaStageGate;
  const entry = manifest.reports?.['prisma-stage-gate.json'];
  if (!manifest.stageEvidenceSha || stage.sourceSha !== manifest.stageEvidenceSha) {
    errors.push('prisma-stage-gate.json: source SHA does not match stageEvidenceSha');
  }
  if (entry?.sourceSha !== stage.sourceSha || entry?.sha256 !== sha256File(stageFile)) {
    errors.push('prisma-stage-gate.json: manifest provenance mismatch');
  }
  if (
    stage.runnerSha256 !== sha256File(path.join(root, 'scripts/run-saas-stage-gate.mjs')) ||
    stage.manifestSha256 !== sha256File(path.join(root, 'scripts/saas-stage-gates.json'))
  ) {
    errors.push('prisma-stage-gate.json: outer runner or gate manifest digest mismatch');
  }
} else if (manifest.stageEvidenceSha || manifest.reports?.['prisma-stage-gate.json']) {
  errors.push('stage evidence manifest entry exists without prisma-stage-gate.json');
}

for (const [file, entry] of Object.entries(manifest.reports ?? {})) {
  const runnerPath = path.join(root, entry.runner ?? '');
  if (!existsSync(runnerPath) || entry.runnerSha256 !== sha256File(runnerPath)) {
    errors.push(`${file}: runner SHA mismatch`);
  }
}

const evidenceRelativeDirectory = 'docs/db/20260711_P02_Prisma与RLS脚手架证据';
for (const file of codeReports) {
  const relativePath = `${evidenceRelativeDirectory}/${file}`;
  const history = spawnSync(
    'git',
    [
      'log',
      '--first-parent',
      '--reverse',
      '--format=%H',
      `${manifest.codeEvidenceSha}..HEAD`,
      '--',
      relativePath,
    ],
    { cwd: gitRoot, encoding: 'utf8' },
  );
  const commits = history.stdout.trim().split(/\r?\n/).filter(Boolean);
  if (history.status !== 0 || commits.length !== 1) {
    errors.push(`${file}: raw report must be written exactly once after codeEvidenceSha`);
    continue;
  }
  const anchored = spawnSync('git', ['show', `${commits[0]}:${relativePath}`], { cwd: gitRoot });
  if (
    anchored.status !== 0 ||
    createHash('sha256').update(anchored.stdout).digest('hex') !==
      sha256File(path.join(evidenceDirectory, file))
  ) {
    errors.push(`${file}: current report differs from its first evidence commit`);
  }
}

const expectedValidationCommands = [
  ['node', 'scripts/db/validate-static.mjs'],
  ['node', 'scripts/db/preflight.mjs', '--contracts'],
  ['npx', 'prisma', 'validate', '--schema', 'prisma/schema.prisma'],
  ['npm', 'run', '--silent', 'prisma:generate'],
  ['npm', 'run', '--silent', 'prisma:generate'],
  ['npm', 'run', '--silent', 'test:db:core'],
  ['npm', 'run', '--silent', 'test:db:preflight'],
  ['npm', 'run', '--silent', 'test:db:integration'],
];
const validationCommands = bundle.validation.commands ?? [];
const normalizedCommands = validationCommands.map((entry) => {
  const [executable, ...arguments_] = entry.command ?? [];
  const executableName = path.basename(executable ?? '').replace(/\.exe$/i, '');
  return [executableName, ...arguments_];
});
if (JSON.stringify(normalizedCommands) !== JSON.stringify(expectedValidationCommands)) {
  errors.push('validation.json: command sequence does not match the trusted eight-command gate');
}
const outputHashes = validationCommands.map((entry) => entry.outputSha256);
if (
  outputHashes.some((hash) => hash === '0'.repeat(64)) ||
  new Set(outputHashes).size !== outputHashes.length
) {
  errors.push('validation.json: command output hashes must be nonzero and run-specific');
}

const allowedEvidencePath = (file) =>
  file.startsWith('docs/db/20260711_P02_Prisma与RLS脚手架证据/') ||
  /^改造计划\/20260711_V2单租户Web闭环开发\/任务\/[^/]+\/(?:开发记录|审核意见|审核记录|测试记录|测试报告)\.md$/.test(file);
for (const provenanceError of validateEvidenceOnlyDescendant({
  gitRoot,
  sourceSha: manifest.codeEvidenceSha,
  allowedEvidencePath,
})) {
  errors.push(`codeEvidenceSha: ${provenanceError}`);
}
if (manifest.stageEvidenceSha) {
  const stageErrors = validateEvidenceOnlyDescendant({
    gitRoot,
    sourceSha: manifest.stageEvidenceSha,
    allowedEvidencePath,
  });
  for (const provenanceError of stageErrors) {
    errors.push(`stageEvidenceSha: ${provenanceError}`);
  }
}

if (errors.length > 0) {
  console.error(JSON.stringify({ status: 'FAILED', errors }));
  process.exit(1);
}
console.log(JSON.stringify({
  status: 'PASS',
  codeEvidenceSha: manifest.codeEvidenceSha,
  stageEvidenceSha: manifest.stageEvidenceSha ?? null,
  reports: Object.keys(manifest.reports),
}));
