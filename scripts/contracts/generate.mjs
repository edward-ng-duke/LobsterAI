import { createHash } from 'node:crypto';
import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  renameSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';
import { stringify } from 'yaml';
import { z } from 'zod';

import * as SchemaCatalog from '../../libs/shared/contracts/dist/index.schemas.js';
import { ContractVersion } from '../../libs/shared/contracts/dist/version.js';
import { ErrorRegistry } from '../../libs/shared/contracts/dist/errors.js';
import { BridgeRegistry } from '../../libs/shared/contracts/dist/registry/bridge.js';
import { ChannelRegistry } from '../../libs/shared/contracts/dist/registry/channels.js';
import { CoworkStreamRegistry } from '../../libs/shared/contracts/dist/registry/cowork-stream.js';
import { IpcGaInventory } from '../../libs/shared/contracts/dist/registry/ipc-ga-inventory.js';
import { RouteRegistry } from '../../libs/shared/contracts/dist/registry/routes.js';

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const generatedHeader = 'Generated file. Do not edit.';
const yamlHeader = `# ${generatedHeader}`;
const tsHeader = `// ${generatedHeader}`;

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

const componentSchemas = Object.fromEntries(
  Object.entries(SchemaCatalog)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([name, schema]) => [name, schemaJson(schema, name)]),
);
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
  const pathParameters = [...route.path.matchAll(/\{([^}]+)\}/g)].map((match) => ({
    name: match[1],
    in: 'path',
    required: true,
    schema: { type: 'string', minLength: 1 },
  }));
  const operation = {
    operationId: route.operationId,
    tags: [route.domain],
    'x-lobster-source-refs': route.sourceRefs,
    'x-lobster-support': route.support,
    parameters: pathParameters,
    responses: {
      '200': {
        description: 'Successful response',
        content: { 'application/json': { schema: { $ref: `#/components/schemas/${route.responseName}` } } },
      },
    },
  };
  if (!['GET', 'DELETE'].includes(route.method)) {
    operation.requestBody = {
      required: true,
      content: { 'application/json': { schema: { $ref: `#/components/schemas/${route.requestName}` } } },
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
    securitySchemes: { accessToken: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' } },
    schemas: componentSchemas,
  },
};

const asyncMessages = {};
for (const channel of ChannelRegistry) {
  asyncMessages[channel.messageType] = {
    name: channel.messageType,
    title: channel.messageType,
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
const streamUnion = ChannelRegistry.map(
  (channel) => `  | { type: '${channel.messageType}'; data: unknown }`,
).join('\n');

const createElectronBridgeSource = () => {
  const inputPath = path.join(repositoryRoot, 'src/renderer/types/electron.d.ts');
  const sourceText = readFileSync(inputPath, 'utf8');
  const sourceFile = ts.createSourceFile(inputPath, sourceText, ts.ScriptTarget.Latest, true);
  const importedNames = [];
  const statements = [];
  const printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed });
  for (const statement of sourceFile.statements) {
    if (ts.isImportDeclaration(statement)) {
      const clause = statement.importClause;
      if (clause?.name) importedNames.push(clause.name.text);
      for (const element of clause?.namedBindings?.elements ?? []) importedNames.push(element.name.text);
      continue;
    }
    if (ts.isModuleDeclaration(statement) || ts.isExportDeclaration(statement)) continue;
    let text = statement.getText(sourceFile);
    if (ts.isInterfaceDeclaration(statement) && statement.name.text === 'IElectronAPI') {
      const seenProperties = new Set();
      const members = statement.members.filter((member) => {
        if (!('name' in member) || !member.name) return true;
        const name = member.name.getText(sourceFile);
        if (seenProperties.has(name)) return false;
        seenProperties.add(name);
        return true;
      });
      const electronBridge = ts.factory.updateInterfaceDeclaration(
        statement,
        [ts.factory.createModifier(ts.SyntaxKind.ExportKeyword)],
        ts.factory.createIdentifier('ElectronBridge'),
        statement.typeParameters,
        statement.heritageClauses,
        members,
      );
      text = printer.printNode(ts.EmitHint.Unspecified, electronBridge, sourceFile);
    }
    text = text.replace(/import\([^)]*\)\.[A-Za-z0-9_]+/g, 'unknown');
    statements.push(text);
  }
  const aliases = [...new Set(importedNames)].sort().map((name) => `type ${name} = unknown;`).join('\n');
  return `${tsHeader}\n/* eslint-disable @typescript-eslint/no-explicit-any */\n${aliases}\n\n${statements.join('\n\n')}\n`;
};

const bridgeMapSource = `${tsHeader}\nexport const ElectronBridgeMap = ${JSON.stringify(
  BridgeRegistry,
  null,
  2,
)} as const;\n`;
const apiClientSource = `${tsHeader}\nexport type ApiOperation =\n${routeUnion};\n`;
const streamEventsSource = `${tsHeader}\nexport type StreamEvent =\n${streamUnion};\n`;

const outputs = new Map([
  ['libs/shared/contracts/openapi.yaml', `${yamlHeader}\n${stringify(openapi, { sortMapEntries: true, lineWidth: 0 })}`],
  ['libs/shared/contracts/asyncapi.yaml', `${yamlHeader}\n${stringify(asyncapi, { sortMapEntries: true, lineWidth: 0 })}`],
  ['libs/shared/contracts/generated/types.ts', `${tsHeader}\nimport { z } from 'zod';\nimport * as Schemas from '../src/index.schemas.js';\n${namedSchemaTypes}\n`],
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

const checkOnly = process.argv.includes('--check');
const mismatches = [];
for (const relativePath of managedOutputs) {
  const expected = outputs.get(relativePath);
  if (expected === undefined) throw new Error(`managed output has no renderer: ${relativePath}`);
  const absolutePath = path.join(repositoryRoot, relativePath);
  if (checkOnly) {
    if (!existsSync(absolutePath) || readFileSync(absolutePath, 'utf8') !== expected) mismatches.push(relativePath);
    continue;
  }
  mkdirSync(path.dirname(absolutePath), { recursive: true });
  rmSync(absolutePath, { force: true });
  const temporaryPath = `${absolutePath}.${process.pid}.tmp`;
  writeFileSync(temporaryPath, expected);
  renameSync(temporaryPath, absolutePath);
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
