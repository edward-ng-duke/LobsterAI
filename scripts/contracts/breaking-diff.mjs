import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse as parseYaml } from 'yaml';

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

const readCurrent = (relativePath) =>
  parseYaml(readFileSync(path.join(repositoryRoot, relativePath), 'utf8'));

const bootstrapPolicy = JSON.parse(readFileSync(
  path.join(repositoryRoot, 'libs/shared/contracts/baselines/bootstrap/policy.json'),
  'utf8',
));

const readBase = (baseRef, resolvedCommit, relativePath, bootstrapKey) => {
  const isPreContractRef = bootstrapPolicy.preContractRefs.some(
    (candidate) => baseRef === candidate || resolvedCommit.startsWith(candidate),
  );
  if (isPreContractRef) {
    return {
      document: parseYaml(readFileSync(path.join(repositoryRoot, bootstrapPolicy[bootstrapKey]), 'utf8')),
      mode: 'bootstrap',
    };
  }
  const show = spawnSync('git', ['show', `${baseRef}:${relativePath}`], {
    cwd: repositoryRoot,
    encoding: 'utf8',
  });
  if (show.status === 0) return { document: parseYaml(show.stdout), mode: 'git' };
  return { blockedReason: `base contract unavailable at ${baseRef}:${relativePath}` };
};

const operations = (document) =>
  new Set(
    Object.entries(document.paths ?? {}).flatMap(([routePath, item]) =>
      Object.keys(item).map((method) => `${method.toUpperCase()} ${routePath}`),
    ),
  );

const resolvePointer = (document, pointer) => {
  if (typeof pointer !== 'string' || !pointer.startsWith('#/')) return undefined;
  return pointer
    .slice(2)
    .split('/')
    .map((part) => part.replaceAll('~1', '/').replaceAll('~0', '~'))
    .reduce((value, part) => value?.[part], document);
};

const schemaTypes = (schema) => {
  const types = Array.isArray(schema?.type) ? schema.type : schema?.type ? [schema.type] : [];
  if (schema?.nullable === true && !types.includes('null')) types.push('null');
  return types.sort();
};

const sortJson = (value) => {
  if (Array.isArray(value)) return value.map(sortJson);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).sort(([left], [right]) => left.localeCompare(right)).map(
      ([key, child]) => [key, sortJson(child)],
    ));
  }
  return value;
};
const stableJson = (value) => JSON.stringify(sortJson(value));

const checkSchemaCompatibility = (
  base,
  current,
  pointer,
  breaking,
  baseDocument,
  currentDocument,
  seen = new Set(),
) => {
  if (!current) {
    breaking.push(`removed schema ${pointer}`);
    return;
  }
  const pairKey = `${base?.$ref ?? pointer}|${current?.$ref ?? pointer}`;
  if (seen.has(pairKey)) return;
  seen.add(pairKey);
  const resolvedBase = base?.$ref ? resolvePointer(baseDocument, base.$ref) : base;
  const resolvedCurrent = current?.$ref ? resolvePointer(currentDocument, current.$ref) : current;
  if (!resolvedBase || !resolvedCurrent) {
    breaking.push(`unresolved schema reference ${pointer}`);
    return;
  }

  const baseTypes = schemaTypes(resolvedBase);
  const currentTypes = schemaTypes(resolvedCurrent);
  if (baseTypes.length > 0 && stableJson(baseTypes) !== stableJson(currentTypes)) {
    breaking.push(`changed type ${pointer}: ${baseTypes.join('|')} -> ${currentTypes.join('|')}`);
  }
  if ('const' in resolvedBase && resolvedBase.const !== resolvedCurrent.const) {
    breaking.push(`changed const ${pointer}`);
  }
  if (Array.isArray(resolvedBase.enum)) {
    const currentEnum = new Set(resolvedCurrent.enum ?? []);
    const removed = resolvedBase.enum.filter((value) => !currentEnum.has(value));
    if (removed.length > 0) breaking.push(`narrowed enum ${pointer}: ${removed.join(',')}`);
  }
  const baseRequired = new Set(resolvedBase.required ?? []);
  for (const required of resolvedCurrent.required ?? []) {
    if (!baseRequired.has(required)) breaking.push(`new required field ${pointer}.${required}`);
  }
  for (const [name, property] of Object.entries(resolvedBase.properties ?? {})) {
    const currentProperty = resolvedCurrent.properties?.[name];
    if (!currentProperty) {
      breaking.push(`removed field ${pointer}.${name}`);
      continue;
    }
    checkSchemaCompatibility(
      property,
      currentProperty,
      `${pointer}.${name}`,
      breaking,
      baseDocument,
      currentDocument,
      seen,
    );
  }
  if (resolvedBase.items) {
    checkSchemaCompatibility(
      resolvedBase.items,
      resolvedCurrent.items,
      `${pointer}[]`,
      breaking,
      baseDocument,
      currentDocument,
      seen,
    );
  }
  for (const keyword of ['allOf', 'anyOf', 'oneOf']) {
    const baseOptions = resolvedBase[keyword] ?? [];
    const currentOptions = resolvedCurrent[keyword] ?? [];
    if (currentOptions.length < baseOptions.length) breaking.push(`removed ${keyword} branch ${pointer}`);
    baseOptions.forEach((option, index) => checkSchemaCompatibility(
      option,
      currentOptions[index],
      `${pointer}.${keyword}[${index}]`,
      breaking,
      baseDocument,
      currentDocument,
      seen,
    ));
  }
  if (resolvedBase.additionalProperties !== false && resolvedCurrent.additionalProperties === false) {
    breaking.push(`closed additional properties ${pointer}`);
  }
  if (stableJson(resolvedBase.discriminator) !== stableJson(resolvedCurrent.discriminator)) {
    breaking.push(`changed discriminator ${pointer}`);
  }
};

const operationEntries = (document) => Object.entries(document.paths ?? {}).flatMap(
  ([routePath, pathItem]) => Object.entries(pathItem).map(([method, operation]) => [
    `${method.toUpperCase()} ${routePath}`,
    operation,
  ]),
);

export const analyzeBreakingDiff = (baseOpenapi, currentOpenapi, baseAsyncapi, currentAsyncapi) => {
  const breaking = [];
  const currentOperations = operations(currentOpenapi);
  for (const operation of operations(baseOpenapi)) {
    if (!currentOperations.has(operation)) breaking.push(`removed operation ${operation}`);
  }
  for (const [name, schema] of Object.entries(baseOpenapi.components?.schemas ?? {})) {
    checkSchemaCompatibility(schema, currentOpenapi.components?.schemas?.[name], `#/components/schemas/${name}`, breaking, baseOpenapi, currentOpenapi);
  }
  const currentOperationMap = new Map(operationEntries(currentOpenapi));
  for (const [operationKey, baseOperation] of operationEntries(baseOpenapi)) {
    const currentOperation = currentOperationMap.get(operationKey);
    if (!currentOperation) continue;
    if (stableJson(baseOperation.security ?? []) !== stableJson(currentOperation.security ?? [])) {
      breaking.push(`changed security ${operationKey}`);
    }
    const baseRequest = baseOperation.requestBody?.content?.['application/json']?.schema;
    const currentRequest = currentOperation.requestBody?.content?.['application/json']?.schema;
    if (baseRequest) checkSchemaCompatibility(baseRequest, currentRequest, `${operationKey} request`, breaking, baseOpenapi, currentOpenapi);
    for (const [status, baseResponse] of Object.entries(baseOperation.responses ?? {})) {
      const currentResponse = currentOperation.responses?.[status];
      if (!currentResponse) {
        breaking.push(`removed response ${operationKey} ${status}`);
        continue;
      }
      const baseSchema = baseResponse.content?.['application/json']?.schema;
      if (baseSchema) checkSchemaCompatibility(baseSchema, currentResponse.content?.['application/json']?.schema, `${operationKey} response ${status}`, breaking, baseOpenapi, currentOpenapi);
    }
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
    else if (baseAsyncapi.components.messages[message].payload) {
      checkSchemaCompatibility(
        baseAsyncapi.components.messages[message].payload,
        currentAsyncapi.components.messages[message].payload,
        `#/components/messages/${message}/payload`,
        breaking,
        baseAsyncapi,
        currentAsyncapi,
      );
    }
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
  const resolvedCommit = verify.stdout.trim();
  const baseOpenapi = readBase(
    baseRef,
    resolvedCommit,
    'libs/shared/contracts/openapi.yaml',
    'openapi',
  );
  const baseAsyncapi = readBase(
    baseRef,
    resolvedCommit,
    'libs/shared/contracts/asyncapi.yaml',
    'asyncapi',
  );
  const blockedReason = baseOpenapi.blockedReason ?? baseAsyncapi.blockedReason;
  if (blockedReason) {
    console.error(JSON.stringify({ status: 'BLOCKED', reason: blockedReason }));
    process.exit(2);
  }
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
  }, null, 2));
}
