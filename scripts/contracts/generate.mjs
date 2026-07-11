import { createHash, randomUUID } from 'node:crypto';
import {
  extendZodWithOpenApi,
  OpenApiGeneratorV31,
  OpenAPIRegistry,
} from '@asteasolutions/zod-to-openapi';
import {
  existsSync,
  closeSync,
  fsyncSync,
  mkdirSync,
  openSync,
  readFileSync,
  readdirSync,
  renameSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { generateDtsBundle } from 'dts-bundle-generator';
import openapiTypeScript, { astToString } from 'openapi-typescript';
import { stringify } from 'yaml';
import { z } from 'zod';

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
extendZodWithOpenApi(z);
const SchemaCatalog = await import('../../libs/shared/contracts/dist/index.schemas.js');
const { ContractVersion } = await import('../../libs/shared/contracts/dist/version.js');
const { ErrorRegistry } = await import('../../libs/shared/contracts/dist/errors.js');
const { BridgeRegistry } = await import('../../libs/shared/contracts/dist/registry/bridge.js');
const { ChannelRegistry } = await import('../../libs/shared/contracts/dist/registry/channels.js');
const { CoworkStreamRegistry } = await import('../../libs/shared/contracts/dist/registry/cowork-stream.js');
const { IpcGaInventory } = await import('../../libs/shared/contracts/dist/registry/ipc-ga-inventory.js');
const { RouteRegistry } = await import('../../libs/shared/contracts/dist/registry/routes.js');
const generatedHeader = 'Generated file. Do not edit.';
const yamlHeader = `# ${generatedHeader}`;
const tsHeader = `// ${generatedHeader}`;
const checkOnly = process.argv.includes('--check');

const managedOutputs = [
  'libs/shared/contracts/openapi.yaml',
  'libs/shared/contracts/asyncapi.yaml',
  'libs/shared/contracts/generated/types.ts',
  'libs/shared/contracts/generated/validators.ts',
  'libs/shared/contracts/generated/error-codes.ts',
  'libs/shared/contracts/generated/contract-manifest.ts',
  'libs/client/bridge/src/electronBridge.ts',
  'libs/client/bridge/src/generated/bridge-map.ts',
  'libs/client/bridge/src/generated/api-client.ts',
  'libs/client/bridge/src/generated/stream-events.ts',
  'apps/api/src/generated/openapi-types.ts',
  'apps/api/src/generated/ws-events.ts',
  'apps/web/src/generated/api-client.ts',
  'apps/web/src/generated/stream-events.ts',
];
const managedGeneratedDirectories = [
  'libs/shared/contracts/generated',
  'libs/client/bridge/src/generated',
  'apps/api/src/generated',
  'apps/web/src/generated',
];

const walk = (directory) =>
  readdirSync(directory, { withFileTypes: true })
    .sort((left, right) => left.name.localeCompare(right.name))
    .flatMap((entry) => {
      const absolute = path.join(directory, entry.name);
      return entry.isDirectory() ? walk(absolute) : [absolute];
    });

const sha256 = (value) => createHash('sha256').update(value).digest('hex');
const sourceFiles = [
  ...walk(path.join(repositoryRoot, 'libs/shared/contracts/src')).filter((file) => file.endsWith('.ts')),
  path.join(repositoryRoot, 'libs/shared/contracts/codegen-policy.json'),
  path.join(repositoryRoot, 'src/renderer/types/electron.d.ts'),
  path.join(repositoryRoot, '改造计划/附录A-IPC通道与接口映射.md'),
  fileURLToPath(import.meta.url),
];
const sourceHash = sha256(
  sourceFiles
    .map((file) => `${path.relative(repositoryRoot, file)}\0${readFileSync(file)}`)
    .join('\0'),
);

const schemaJson = (schema, name) => {
  const json = z.toJSONSchema(schema, { target: 'draft-7', unrepresentable: 'any' });
  delete json.$schema;
  return { title: name, ...json };
};

const openapiRegistry = new OpenAPIRegistry();
for (const [name, schema] of Object.entries(SchemaCatalog).sort(([left], [right]) =>
  left.localeCompare(right),
)) {
  openapiRegistry.register(name, schema);
}
for (const route of RouteRegistry) {
  if (!(route.requestName in SchemaCatalog)) {
    openapiRegistry.register(route.requestName, route.request);
  }
  if (route.responseName !== 'ErrorEnvelope' && !(route.responseName in SchemaCatalog)) {
    openapiRegistry.register(route.responseName, route.response);
  }
}
const componentSchemas = new OpenApiGeneratorV31(
  openapiRegistry.definitions,
).generateComponents().components.schemas;
componentSchemas.ErrorEnvelope = {
  type: 'object',
  additionalProperties: false,
  required: ['error'],
  properties: {
    error: {
      type: 'object',
      additionalProperties: false,
      required: ['code', 'message', 'requestId'],
      properties: {
        code: { type: 'string', enum: Object.keys(ErrorRegistry) },
        message: { type: 'string' },
        requestId: { type: 'string', minLength: 1 },
        details: { type: 'object', additionalProperties: true },
      },
    },
  },
};

const openapiPaths = {};
for (const route of RouteRegistry) {
  const parametersFromSchema = (schema, location, forceRequired = false) => {
    if (!schema) return [];
    const json = schemaJson(schema, `${route.operationId}${location}`);
    const required = new Set(json.required ?? []);
    return Object.entries(json.properties ?? {}).map(([name, propertySchema]) => ({
      name,
      in: location,
      required: forceRequired || required.has(name),
      schema: propertySchema,
    }));
  };
  const pathParameters = parametersFromSchema(route.pathSchema, 'path', true);
  const queryParameters = parametersFromSchema(route.querySchema, 'query');
  const operation = {
    operationId: route.operationId,
    tags: [route.domain],
    'x-lobster-source-refs': route.sourceRefs,
    'x-lobster-support': route.support,
    'x-lobster-error-codes': route.errors,
    parameters: [...pathParameters, ...queryParameters],
    ...(route.pathBodyEquality.length > 0
      ? { 'x-lobster-path-body-equality': route.pathBodyEquality }
      : {}),
    security:
      route.auth === 'access-token'
        ? [{ accessToken: [] }]
        : route.auth === 'refresh-cookie'
          ? [{ refreshCookie: [] }]
          : [],
    responses: {
      [String(route.successStatus)]: {
        description: route.support === 'unsupported' ? 'UNSUPPORTED_FEATURE' : 'Successful response',
        content: { 'application/json': { schema: { $ref: `#/components/schemas/${route.responseName}` } } },
      },
    },
  };
  if (route.bodySchema && route.bodyName) {
    operation.requestBody = {
      required: true,
      content: { 'application/json': { schema: { $ref: `#/components/schemas/${route.bodyName}` } } },
    };
  }
  for (const code of route.errors) {
    const status = String(ErrorRegistry[code].httpStatus);
    operation.responses[status] ??= {
      description: code,
      content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorEnvelope' } } },
    };
  }
  openapiPaths[route.path] ??= {};
  openapiPaths[route.path][route.method.toLowerCase()] = operation;
}

const openapi = {
  openapi: '3.1.0',
  info: { title: 'LobsterAI API', version: ContractVersion },
  'x-lobster-contract-version': ContractVersion,
  servers: [{ url: '/' }],
  paths: openapiPaths,
  components: {
    securitySchemes: {
      accessToken: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      refreshCookie: { type: 'apiKey', in: 'cookie', name: 'refresh_token' },
    },
    schemas: componentSchemas,
  },
};
const generatedOpenapiTypes = astToString(
  await openapiTypeScript(openapi, { alphabetize: true }),
);

const asyncMessages = {};
for (const channel of ChannelRegistry) {
  const coworkStream = CoworkStreamRegistry.find((entry) => entry.wireType === channel.messageType);
  asyncMessages[channel.messageType] = {
    name: channel.messageType,
    title: channel.messageType,
    ...(coworkStream
      ? {
          'x-lobster-ipc-topic': coworkStream.ipcTopic,
          'x-lobster-async-channel': coworkStream.asyncChannel,
          'x-lobster-bridge-method': coworkStream.bridgeMethod,
        }
      : {}),
    payload:
      channel.messageType === 'clientControl'
        ? schemaJson(channel.schema, channel.messageType)
        : {
            type: 'object',
            additionalProperties: true,
            required: ['type', 'version', 'tenantId', 'emittedAt', 'data'],
            properties: {
              type: { const: channel.messageType },
              version: { const: 1 },
              tenantId: { type: 'string', minLength: 1 },
              sessionId: { type: 'string', minLength: 1 },
              requestId: { type: 'string', minLength: 1 },
              seq: { type: 'string', minLength: 1 },
              idempotencyKey: { type: 'string', minLength: 1 },
              emittedAt: { type: 'string', format: 'date-time' },
              data: schemaJson(channel.schema, `${channel.messageType}Data`),
            },
          },
  };
}

const channelGroups = Map.groupBy(ChannelRegistry, (channel) => channel.path);
const asyncChannels = {};
for (const [channelPath, entries] of channelGroups) {
  const publish = entries.filter((entry) => entry.direction === 'client-to-server');
  const subscribe = entries.filter((entry) => entry.direction === 'server-to-client');
  asyncChannels[channelPath] = {};
  if (publish.length > 0) {
    asyncChannels[channelPath].publish = {
      operationId: `publish_${channelPath.replace(/[^A-Za-z0-9]/g, '_')}`,
      message: { oneOf: publish.map((entry) => ({ $ref: `#/components/messages/${entry.messageType}` })) },
    };
  }
  if (subscribe.length > 0) {
    asyncChannels[channelPath].subscribe = {
      operationId: `subscribe_${channelPath.replace(/[^A-Za-z0-9]/g, '_')}`,
      message: { oneOf: subscribe.map((entry) => ({ $ref: `#/components/messages/${entry.messageType}` })) },
    };
  }
}

const asyncapi = {
  asyncapi: '2.6.0',
  info: { title: 'LobsterAI Streams', version: ContractVersion },
  'x-lobster-contract-version': ContractVersion,
  servers: { production: { url: '/', protocol: 'wss' } },
  channels: asyncChannels,
  components: { messages: asyncMessages },
};

const namedSchemaTypes = Object.keys(SchemaCatalog)
  .sort()
  .map((name) => `export type ${name} = z.infer<typeof Schemas.${name}>;`)
  .join('\n');
const routeUnion = RouteRegistry.map(
  (route) => `  | { operationId: '${route.operationId}'; method: '${route.method}'; path: '${route.path}' }`,
).join('\n');
const streamSchemaDocument = {
  openapi: '3.1.0',
  info: { title: 'LobsterAI Stream Payloads', version: ContractVersion },
  paths: {},
  components: {
    schemas: Object.fromEntries(
      ChannelRegistry.map((channel) => [channel.messageType, schemaJson(channel.schema, channel.messageType)]),
    ),
  },
};
const generatedStreamTypes = astToString(
  await openapiTypeScript(streamSchemaDocument, { alphabetize: true }),
);
const streamUnion = ChannelRegistry.map(
  (channel) => `  | { type: '${channel.messageType}'; data: components['schemas']['${channel.messageType}'] }`,
).join('\n');

const createElectronBridgeSource = () => {
  const preferredConfigPath = path.join(repositoryRoot, 'tsconfig.json');
  if (checkOnly && !existsSync(preferredConfigPath)) {
    return readFileSync(path.join(repositoryRoot, 'libs/client/bridge/src/electronBridge.ts'), 'utf8');
  }
  const [bundle] = generateDtsBundle(
    [{
      filePath: path.join(repositoryRoot, 'libs/client/bridge/codegen/electron-bridge-entry.ts'),
      output: { exportReferencedTypes: false, noBanner: true, sortNodes: true },
    }],
    { preferredConfigPath },
  );
  return `${tsHeader}\n/* eslint-disable @typescript-eslint/no-unused-vars -- bundled type declarations retain const companions */\n${bundle}`;
};

const bridgeMapSource = `${tsHeader}\nexport const ElectronBridgeMap = ${JSON.stringify(
  BridgeRegistry,
  null,
  2,
)} as const;\n`;
const apiClientSource = `${tsHeader}\n${generatedOpenapiTypes}\nexport type ApiOperation =\n${routeUnion};\n`;
const streamEventsSource = `${tsHeader}\n${generatedStreamTypes}\nexport type StreamEvent =\n${streamUnion};\n`;

const outputs = new Map([
  ['libs/shared/contracts/openapi.yaml', `${yamlHeader}\n${stringify(openapi, { sortMapEntries: true, lineWidth: 0 })}`],
  ['libs/shared/contracts/asyncapi.yaml', `${yamlHeader}\n${stringify(asyncapi, { sortMapEntries: true, lineWidth: 0 })}`],
  ['libs/shared/contracts/generated/types.ts', `${tsHeader}\nimport { z } from 'zod';\n\nimport * as Schemas from '../src/index.schemas.js';\n${namedSchemaTypes}\n`],
  ['libs/shared/contracts/generated/validators.ts', `${tsHeader}\nexport * from '../src/index.schemas.js';\nexport * from '../src/envelope.schema.js';\n`],
  ['libs/shared/contracts/generated/error-codes.ts', `${tsHeader}\nexport const ErrorCode = ${JSON.stringify(Object.fromEntries(Object.keys(ErrorRegistry).map((code) => [code, code])), null, 2)} as const;\nexport type ErrorCode = (typeof ErrorCode)[keyof typeof ErrorCode];\n`],
  ['libs/client/bridge/src/electronBridge.ts', createElectronBridgeSource()],
  ['libs/client/bridge/src/generated/bridge-map.ts', bridgeMapSource],
  ['libs/client/bridge/src/generated/api-client.ts', apiClientSource],
  ['libs/client/bridge/src/generated/stream-events.ts', streamEventsSource],
  ['apps/api/src/generated/openapi-types.ts', apiClientSource],
  ['apps/api/src/generated/ws-events.ts', streamEventsSource],
  ['apps/web/src/generated/api-client.ts', apiClientSource],
  ['apps/web/src/generated/stream-events.ts', streamEventsSource],
]);

const outputHash = sha256([...outputs.entries()].map(([file, content]) => `${file}\0${content}`).join('\0'));
outputs.set(
  'libs/shared/contracts/generated/contract-manifest.ts',
  `${tsHeader}\nexport const ContractManifest = ${JSON.stringify({
    contractVersion: ContractVersion,
    sourceHash,
    outputHash,
    routeCount: RouteRegistry.length,
    channelCount: ChannelRegistry.length,
    inventoryCount: IpcGaInventory.length,
    bridgePropertyCount: BridgeRegistry.length,
    coworkStreamCount: CoworkStreamRegistry.length,
  }, null, 2)} as const;\n`,
);

const mismatches = [];
const managedAbsolutePaths = new Set(
  managedOutputs.map((relativePath) => path.join(repositoryRoot, relativePath)),
);
const staleOutputs = managedGeneratedDirectories.flatMap((relativeDirectory) => {
  const absoluteDirectory = path.join(repositoryRoot, relativeDirectory);
  if (!existsSync(absoluteDirectory)) return [];
  return walk(absoluteDirectory).filter((file) => !managedAbsolutePaths.has(file));
});
for (const relativePath of managedOutputs) {
  const expected = outputs.get(relativePath);
  if (expected === undefined) throw new Error(`managed output has no renderer: ${relativePath}`);
  const absolutePath = path.join(repositoryRoot, relativePath);
  if (checkOnly) {
    if (!existsSync(absolutePath) || readFileSync(absolutePath, 'utf8') !== expected) mismatches.push(relativePath);
  }
}
if (checkOnly) {
  mismatches.push(...staleOutputs.map((file) => path.relative(repositoryRoot, file)));
} else {
  const staged = [];
  try {
    for (const [relativePath, expected] of outputs) {
      const absolutePath = path.join(repositoryRoot, relativePath);
      mkdirSync(path.dirname(absolutePath), { recursive: true });
      const temporaryPath = `${absolutePath}.${process.pid}.${randomUUID()}.tmp`;
      const descriptor = openSync(temporaryPath, 'wx');
      try {
        writeFileSync(descriptor, expected);
        fsyncSync(descriptor);
      } finally {
        closeSync(descriptor);
      }
      staged.push({ absolutePath, temporaryPath });
    }
    if (process.env.CONTRACT_GENERATE_FAIL_AFTER_STAGE === '1') {
      throw new Error('Injected contract generation failure after staging');
    }
    for (const { absolutePath, temporaryPath } of staged) {
      renameSync(temporaryPath, absolutePath);
    }
    for (const staleOutput of staleOutputs) rmSync(staleOutput, { force: true });
  } catch (error) {
    for (const { temporaryPath } of staged) rmSync(temporaryPath, { force: true });
    throw error;
  }
}

if (mismatches.length > 0) {
  console.error(`Generated contract files are stale or edited:\n${mismatches.join('\n')}`);
  process.exit(1);
}
console.log(JSON.stringify({
  status: 'PASS',
  mode: checkOnly ? 'check' : 'generate',
  contractVersion: ContractVersion,
  sourceHash,
  outputHash,
  routeCount: RouteRegistry.length,
  channelCount: ChannelRegistry.length,
  inventoryCount: IpcGaInventory.length,
  bridgePropertyCount: BridgeRegistry.length,
}));
