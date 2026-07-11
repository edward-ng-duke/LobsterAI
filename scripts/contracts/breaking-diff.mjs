import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse as parseYaml } from 'yaml';

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

const readCurrent = (relativePath) =>
  parseYaml(readFileSync(path.join(repositoryRoot, relativePath), 'utf8'));

const readBase = (baseRef, relativePath, bootstrapPath) => {
  const show = spawnSync('git', ['show', `${baseRef}:${relativePath}`], {
    cwd: repositoryRoot,
    encoding: 'utf8',
  });
  if (show.status === 0) return { document: parseYaml(show.stdout), mode: 'git' };
  return {
    document: parseYaml(readFileSync(path.join(repositoryRoot, bootstrapPath), 'utf8')),
    mode: 'bootstrap',
  };
};

const operations = (document) =>
  new Set(
    Object.entries(document.paths ?? {}).flatMap(([routePath, item]) =>
      Object.keys(item).map((method) => `${method.toUpperCase()} ${routePath}`),
    ),
  );

const checkSchemaCompatibility = (base, current, pointer, breaking) => {
  if (!current) {
    breaking.push(`removed schema ${pointer}`);
    return;
  }
  const baseRequired = new Set(base.required ?? []);
  for (const required of current.required ?? []) {
    if (!baseRequired.has(required)) breaking.push(`new required field ${pointer}.${required}`);
  }
  for (const [name, property] of Object.entries(base.properties ?? {})) {
    const currentProperty = current.properties?.[name];
    if (!currentProperty) {
      breaking.push(`removed field ${pointer}.${name}`);
      continue;
    }
    if (Array.isArray(property.enum) && Array.isArray(currentProperty.enum)) {
      const currentEnum = new Set(currentProperty.enum);
      const removed = property.enum.filter((value) => !currentEnum.has(value));
      if (removed.length > 0) breaking.push(`narrowed enum ${pointer}.${name}: ${removed.join(',')}`);
    }
  }
};

export const analyzeBreakingDiff = (baseOpenapi, currentOpenapi, baseAsyncapi, currentAsyncapi) => {
  const breaking = [];
  const currentOperations = operations(currentOpenapi);
  for (const operation of operations(baseOpenapi)) {
    if (!currentOperations.has(operation)) breaking.push(`removed operation ${operation}`);
  }
  for (const [name, schema] of Object.entries(baseOpenapi.components?.schemas ?? {})) {
    checkSchemaCompatibility(schema, currentOpenapi.components?.schemas?.[name], `#/components/schemas/${name}`, breaking);
  }
  const baseErrorCodes = new Set(
    baseOpenapi.components?.schemas?.ErrorEnvelope?.properties?.error?.properties?.code?.enum ?? [],
  );
  const currentErrorCodes = new Set(
    currentOpenapi.components?.schemas?.ErrorEnvelope?.properties?.error?.properties?.code?.enum ?? [],
  );
  for (const code of baseErrorCodes) if (!currentErrorCodes.has(code)) breaking.push(`removed error code ${code}`);
  const currentMessages = new Set(Object.keys(currentAsyncapi.components?.messages ?? {}));
  for (const message of Object.keys(baseAsyncapi.components?.messages ?? {})) {
    if (!currentMessages.has(message)) breaking.push(`removed event ${message}`);
  }
  return breaking;
};

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const baseRef = process.env.CONTRACT_BASE_REF;
  if (!baseRef) {
    console.error(JSON.stringify({ status: 'BLOCKED', reason: 'CONTRACT_BASE_REF is required' }));
    process.exit(2);
  }
  const verify = spawnSync('git', ['rev-parse', '--verify', `${baseRef}^{commit}`], {
    cwd: repositoryRoot,
    encoding: 'utf8',
  });
  if (verify.status !== 0) {
    console.error(JSON.stringify({ status: 'BLOCKED', reason: `base ref unavailable: ${baseRef}` }));
    process.exit(2);
  }
  const baseOpenapi = readBase(
    baseRef,
    'libs/shared/contracts/openapi.yaml',
    'libs/shared/contracts/baselines/bootstrap/openapi.yaml',
  );
  const baseAsyncapi = readBase(
    baseRef,
    'libs/shared/contracts/asyncapi.yaml',
    'libs/shared/contracts/baselines/bootstrap/asyncapi.yaml',
  );
  const breaking = analyzeBreakingDiff(
    baseOpenapi.document,
    readCurrent('libs/shared/contracts/openapi.yaml'),
    baseAsyncapi.document,
    readCurrent('libs/shared/contracts/asyncapi.yaml'),
  );
  if (breaking.length > 0) {
    console.error(JSON.stringify({ status: 'BREAKING', baseRef, breaking }, null, 2));
    process.exit(1);
  }
  console.log(JSON.stringify({
    status: 'PASS',
    baseRef,
    openapiBaseMode: baseOpenapi.mode,
    asyncapiBaseMode: baseAsyncapi.mode,
  }));
}
