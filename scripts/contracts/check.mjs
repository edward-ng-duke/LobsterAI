import SwaggerParser from '@apidevtools/swagger-parser';
import { Parser as AsyncApiParser } from '@asyncapi/parser';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';
import { parse as parseYaml } from 'yaml';
import { z } from 'zod';

import * as Schemas from '../../libs/shared/contracts/dist/index.schemas.js';
import {
  ErrorEnvelopeSchema,
  StreamEnvelopeSchema,
  StreamTicketRequestSchema,
  StreamTicketResponseSchema,
  WsClientControlSchema,
} from '../../libs/shared/contracts/dist/envelope.schema.js';
import { ErrorRegistry } from '../../libs/shared/contracts/dist/errors.js';
import { BridgeRegistry } from '../../libs/shared/contracts/dist/registry/bridge.js';
import { ChannelRegistry } from '../../libs/shared/contracts/dist/registry/channels.js';
import { CoworkStreamRegistry } from '../../libs/shared/contracts/dist/registry/cowork-stream.js';
import { IpcGaInventory } from '../../libs/shared/contracts/dist/registry/ipc-ga-inventory.js';
import { RouteRegistry } from '../../libs/shared/contracts/dist/registry/routes.js';

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const openapiPath = path.join(repositoryRoot, 'libs/shared/contracts/openapi.yaml');
const asyncapiPath = path.join(repositoryRoot, 'libs/shared/contracts/asyncapi.yaml');
const openapi = parseYaml(readFileSync(openapiPath, 'utf8'));
const asyncapi = parseYaml(readFileSync(asyncapiPath, 'utf8'));
const failures = [];
const summaries = {};

const fail = (check, message) => failures.push(`${check}: ${message}`);
const assert = (check, condition, message) => {
  if (!condition) fail(check, message);
};
const equalSets = (check, left, right, label) => {
  const missing = [...right].filter((item) => !left.has(item));
  const extra = [...left].filter((item) => !right.has(item));
  assert(check, missing.length === 0 && extra.length === 0, `${label}; missing=${missing.join(',')} extra=${extra.join(',')}`);
};
const canonicalJson = (value) => JSON.stringify(
  Array.isArray(value)
    ? value.map((entry) => JSON.parse(canonicalJson(entry)))
    : value && typeof value === 'object'
      ? Object.fromEntries(Object.entries(value).sort(([left], [right]) => left.localeCompare(right)).map(
          ([key, entry]) => [key, JSON.parse(canonicalJson(entry))],
        ))
      : value,
);

const checkSchema = () => {
  const required = [
    'LoginRequest', 'LoginResponse', 'OAuthTokenRequest', 'TokenResponse', 'RefreshRequest',
    'LogoutResponse', 'StartSessionRequest', 'StartSessionResponse', 'ContinueTurnRequest',
    'TurnAcceptedResponse', 'PermissionRespondRequest', 'ModelDetailResponse',
    'PricingCatalogResponse', 'MediaTaskStatusResponse', 'MediaCancelResponse',
    'AsrSessionCreateRequest', 'AsrSessionCreateResponse', 'StreamTicketRequest',
    'StreamTicketResponse',
  ];
  for (const name of required) assert('schema', name in Schemas, `missing schema ${name}`);
  assert('schema', Object.values(Schemas).every((schema) => typeof schema?.safeParse === 'function'), 'export graph contains a non-Zod schema');
  assert('schema', Schemas.StartSessionRequest.safeParse({ agentId: 'main' }).success === false, 'start session accepted no first prompt');
  assert('schema', Schemas.StartSessionRequest.safeParse({ agentId: 'main', prompt: 'go', extra: true }).success === false, 'strict DTO accepted unknown field');
  summaries.schemaCount = Object.keys(Schemas).length;
};

const checkRoutes = () => {
  const operationIds = RouteRegistry.map((route) => route.operationId);
  const methodPaths = RouteRegistry.map((route) => `${route.method} ${route.path}`);
  assert('routes', new Set(operationIds).size === operationIds.length, 'duplicate operationId');
  assert('routes', new Set(methodPaths).size === methodPaths.length, 'duplicate method/path');
  for (const route of RouteRegistry) {
    assert('routes', /^\/(?:api\/v1\/|auth\/|oauth\/|\.well-known\/)/.test(route.path), `unversioned formal route ${route.path}`);
    assert('routes', !/:([A-Za-z]|$)/.test(route.path), `colon parameter/action in ${route.path}`);
    assert('routes', route.request && route.response, `missing schema reference for ${route.operationId}`);
    assert('routes', !route.requestName.startsWith('Generic'), `generic request schema ${route.operationId}`);
    assert('routes', !route.responseName.startsWith('Generic'), `generic response schema ${route.operationId}`);
  }
  summaries.routeCount = RouteRegistry.length;
};

const checkAppendixCoverage = () => {
  const routeTargets = new Set(RouteRegistry.map((route) => route.operationId));
  const channelTargets = new Set(ChannelRegistry.map((channel) => channel.channelId));
  const inventoryIds = new Set();
  const appendixLines = readFileSync(
    path.join(repositoryRoot, '改造计划/附录A-IPC通道与接口映射.md'),
    'utf8',
  ).split(/\r?\n/);
  let section = '';
  const expectedSourceRefs = new Set();
  appendixLines.forEach((line, index) => {
    if (line.startsWith('### ')) section = line.slice(4);
    if (!line.startsWith('|') || /^\|[- :]+\|/.test(line) || !line.includes('✅')) return;
    const cells = line.split('|').slice(1, -1).map((cell) => cell.trim());
    if (/IPC|事件（send）|GA 主线/.test(cells[0])) return;
    if (/^A\.(?:2|3)/.test(section) || line.includes('`app:getVersion`')) {
      expectedSourceRefs.add(`附录A:${index + 1}`);
    }
  });
  const domains = {};
  for (const row of IpcGaInventory) {
    assert('appendix-a-coverage', !inventoryIds.has(row.id), `duplicate inventory id ${row.id}`);
    inventoryIds.add(row.id);
    assert('appendix-a-coverage', row.targets.length > 0, `inventory row ${row.id} has no target`);
    const targets = row.kind === 'route' ? routeTargets : channelTargets;
    for (const target of row.targets) assert('appendix-a-coverage', targets.has(target), `${row.id} points to missing ${row.kind} ${target}`);
    const domain = row.legacyIpc.split(':')[0];
    domains[domain] = (domains[domain] ?? 0) + 1;
  }
  equalSets(
    'appendix-a-coverage',
    new Set(IpcGaInventory.map((row) => row.sourceRef)),
    expectedSourceRefs,
    'Appendix A GA/partial row denominator mismatch',
  );
  const referencedRoutes = new Set(IpcGaInventory.filter((row) => row.kind === 'route').flatMap((row) => row.targets));
  const referencedChannels = new Set(IpcGaInventory.filter((row) => row.kind === 'channel').flatMap((row) => row.targets));
  const supplementalRoutes = new Set([
    'get_api_v1_workspaces', 'post_api_v1_workspaces', 'post_api_v1_workspaces_wid_uploads',
    'post_api_v1_workspaces_wid_uploads_id_complete', 'delete_api_v1_workspaces_wid_files',
    'get_api_v1_models_id', 'get_api_v1_billing_usage', 'get_api_v1_billing_plan',
    'post_api_v1_billing_byok', 'delete_api_v1_billing_byok_provider',
    'post_api_v1_privacy_exports', 'get_api_v1_privacy_exports_exportId',
    'post_api_v1_privacy_deletions', 'get_api_v1_privacy_deletions_deletionId',
    'post_api_v1_stream_ticket', 'post_api_v1_share_deployments_node',
  ]);
  for (const target of routeTargets) assert('appendix-a-coverage', referencedRoutes.has(target) || supplementalRoutes.has(target), `orphan route ${target}`);
  const supplementalChannels = new Set(['asrAudioChunk', 'asrPartial', 'asrFinal', 'asrError']);
  for (const target of channelTargets) assert('appendix-a-coverage', referencedChannels.has(target) || supplementalChannels.has(target), `orphan channel ${target}`);
  summaries.inventoryCount = IpcGaInventory.length;
  summaries.appendixExpectedCount = expectedSourceRefs.size;
  summaries.inventoryDomains = domains;
};

const legacyPaths = [
  '/api/model/proxy', '/api/model/stream', '/model/config', '/api/model/config',
  '/model/config:check', '/skills/install', '/skills/sync', '/model/catalog',
  '/api/models/{id}', '/model/{id}', '/api/v1/media/models', '/media/tasks/{taskId}',
  '/media/tasks/{taskId}/cancel', '/asr/sessions', '/billing/pricing', '/billing/account',
  '/billing/usage', '/billing/plan', '/billing/byok', '/api/v1/billing/quota',
  '/api/v1/privacy/export', '/api/v1/privacy/delete', '/api/v1/privacy/delete/{deletionId}',
  '/api/v1/workspaces/{wid}/tree', '/api/v1/workspaces/tree', '/plugins', '/plugins/detect',
  '/plugins/sync', '/plugins/install', '/plugins/{id}/update', '/plugins:detect',
  '/plugins:sync', '/plugins:install', '/artifacts/preview-sessions', '/html-shares',
  '/share-deployments/static', '/scheduled-tasks/{id}/run', '/tasks/{id}:run',
  '/api/v1/sessions/{id}:stop', '/api/v1/runtime:restart', '/api/v1/files:upload',
];
const legacyPathSet = new Set(legacyPaths);
const isCanonicalRoute = (routePath) =>
  !legacyPathSet.has(routePath) &&
  /^\/(?:api\/v1\/|auth\/|oauth\/|\.well-known\/)/.test(routePath) &&
  !/:([A-Za-z]|$)/.test(routePath);
const checkRouteNegative = () => {
  for (const routePath of legacyPaths) assert('route-negative', !isCanonicalRoute(routePath), `accepted legacy path ${routePath}`);
  for (const routePath of RouteRegistry.map((route) => route.path)) assert('route-negative', isCanonicalRoute(routePath), `rejected canonical path ${routePath}`);
  for (const canonical of ['/api/v1/media/tasks/{taskId}/cancel', '/api/v1/share-deployments/static', '/api/v1/share-deployments/node']) {
    assert('route-negative', isCanonicalRoute(canonical), `substring false-positive ${canonical}`);
  }
};

const checkErrors = () => {
  const errorCodes = new Set(Object.keys(ErrorRegistry));
  assert('errors', ErrorEnvelopeSchema.safeParse({ error: { code: 'NOT_REAL', message: 'x', requestId: 'r' } }).success === false, 'unknown error code accepted');
  assert('errors', ErrorEnvelopeSchema.safeParse({ error: { code: 'NOT_FOUND', message: 'x', requestId: 'r' } }).success, 'details was not optional');
  for (const [code, metadata] of Object.entries(ErrorRegistry)) {
    assert('errors', Number.isInteger(metadata.httpStatus), `${code} has invalid httpStatus`);
    assert('errors', typeof metadata.retryable === 'boolean' && typeof metadata.userVisible === 'boolean', `${code} missing policy metadata`);
    assert('errors', metadata.i18nKey.length > 0, `${code} missing i18n key`);
  }
  const responseCodes = new Set();
  for (const pathItem of Object.values(openapi.paths)) for (const operation of Object.values(pathItem)) {
    for (const [status, response] of Object.entries(operation.responses)) {
      if (Number(status) >= 400) {
        assert('errors', response.content?.['application/json']?.schema?.$ref === '#/components/schemas/ErrorEnvelope', `non-envelope ${operation.operationId} ${status}`);
        responseCodes.add(response.description);
      }
    }
  }
  for (const code of responseCodes) assert('errors', errorCodes.has(code), `OpenAPI uses unknown error ${code}`);
  equalSets(
    'errors',
    new Set(RouteRegistry.flatMap((route) => route.errors)),
    errorCodes,
    'ErrorRegistry/RouteRegistry error set',
  );
  equalSets(
    'errors',
    new Set(Object.values(openapi.paths).flatMap((pathItem) => Object.values(pathItem).flatMap(
      (operation) => operation['x-lobster-error-codes'] ?? [],
    ))),
    errorCodes,
    'ErrorRegistry/OpenAPI operation error set',
  );
};

const checkOpenapi = async () => {
  await SwaggerParser.validate(openapiPath);
  assert('openapi', openapi.openapi === '3.1.0', `expected 3.1.0, got ${openapi.openapi}`);
  const registry = new Set(RouteRegistry.map((route) => `${route.method.toLowerCase()} ${route.path}`));
  const spec = new Set(Object.entries(openapi.paths).flatMap(([routePath, item]) => Object.keys(item).map((method) => `${method} ${routePath}`)));
  equalSets('openapi', spec, registry, 'route registry/spec mismatch');
  const routesByOperation = new Map(RouteRegistry.map((route) => [route.operationId, route]));
  for (const [routePath, item] of Object.entries(openapi.paths)) for (const operation of Object.values(item)) {
    const route = routesByOperation.get(operation.operationId);
    assert('openapi', route !== undefined, `unknown operation ${operation.operationId}`);
    if (route) {
      const expectedSecurity = route.auth === 'access-token' ? [{ accessToken: [] }] : [];
      assert('openapi', JSON.stringify(operation.security ?? []) === JSON.stringify(expectedSecurity), `security mismatch ${operation.operationId}`);
      assert('openapi', operation.responses[String(route.successStatus)] !== undefined, `success status mismatch ${operation.operationId}`);
      equalSets('openapi', new Set(operation['x-lobster-error-codes'] ?? []), new Set(route.errors), `error policy mismatch ${operation.operationId}`);
    }
    for (const name of [...routePath.matchAll(/\{([^}]+)\}/g)].map((match) => match[1])) {
      assert('openapi', operation.parameters?.some((parameter) => parameter.name === name && parameter.in === 'path' && parameter.required === true), `${operation.operationId} missing required path parameter ${name}`);
    }
  }
};

const checkAsyncapi = async () => {
  const parser = new AsyncApiParser();
  const result = await parser.parse(readFileSync(asyncapiPath, 'utf8'));
  const errorDiagnostics = result.diagnostics.filter((diagnostic) => diagnostic.severity === 0);
  assert('asyncapi', result.document !== undefined && errorDiagnostics.length === 0, `parser errors: ${errorDiagnostics.map((item) => item.message).join('; ')}`);
  assert('asyncapi', asyncapi.asyncapi === '2.6.0', `expected 2.6.0, got ${asyncapi.asyncapi}`);
  const registry = new Set(ChannelRegistry.map((channel) => channel.messageType));
  const spec = new Set(Object.keys(asyncapi.components.messages));
  equalSets('asyncapi', spec, registry, 'channel registry/spec mismatch');
};

const extractBridgePaths = () => {
  const file = path.join(repositoryRoot, 'src/renderer/types/electron.d.ts');
  const source = ts.createSourceFile(file, readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true);
  const declaration = source.statements.find((node) => ts.isInterfaceDeclaration(node) && node.name.text === 'IElectronAPI');
  const rows = [];
  const walk = (members, prefix, optionalParent = false) => {
    for (const member of members) {
      if (!ts.isPropertySignature(member) || !member.name) continue;
      const name = member.name.getText(source).replace(/^['"]|['"]$/g, '');
      const propertyPath = [...prefix, name];
      const optional = optionalParent || Boolean(member.questionToken);
      if (member.type && ts.isTypeLiteralNode(member.type)) walk(member.type.members, propertyPath, optional);
      else rows.push({ propertyPath: propertyPath.join('.'), optional });
    }
  };
  walk(declaration.members, []);
  return rows;
};

const checkCoworkStream = () => {
  const expected = new Set(['message', 'messageUpdate', 'sessionStatus', 'contextUsage', 'goal', 'contextMaintenance', 'permission', 'permissionDismiss', 'complete', 'error']);
  equalSets('cowork-stream', new Set(CoworkStreamRegistry.map((entry) => entry.wireType)), expected, 'wire events');
  equalSets('cowork-stream', new Set(CoworkStreamRegistry.map((entry) => entry.wireType)), new Set(ChannelRegistry.filter((entry) => entry.path === '/api/v1/stream' && expected.has(entry.messageType)).map((entry) => entry.messageType)), 'AsyncAPI registry');
  equalSets('cowork-stream', new Set(CoworkStreamRegistry.map((entry) => entry.wireType)), new Set(Object.keys(asyncapi.components.messages).filter((name) => expected.has(name))), 'AsyncAPI messages');
  const bridgePaths = new Map(BridgeRegistry.map((entry) => [entry.propertyPath, entry]));
  for (const entry of CoworkStreamRegistry) {
    assert('cowork-stream', bridgePaths.has(entry.bridgeMethod), `bridge missing ${entry.bridgeMethod}`);
    const valid = JSON.parse(readFileSync(path.join(repositoryRoot, `libs/shared/contracts/fixtures/valid/cowork/${entry.wireType}.json`), 'utf8'));
    const invalid = JSON.parse(readFileSync(path.join(repositoryRoot, `libs/shared/contracts/fixtures/invalid/cowork/${entry.wireType}.json`), 'utf8'));
    assert('cowork-stream', entry.schema.safeParse(valid).success, `valid fixture rejected ${entry.wireType}`);
    assert('cowork-stream', entry.schema.safeParse(invalid).success === false, `invalid fixture accepted ${entry.wireType}`);
    const message = asyncapi.components.messages[entry.wireType];
    assert('cowork-stream', message['x-lobster-ipc-topic'] === entry.ipcTopic, `IPC topic mismatch ${entry.wireType}`);
    assert('cowork-stream', message['x-lobster-async-channel'] === entry.asyncChannel, `AsyncAPI channel mismatch ${entry.wireType}`);
    assert('cowork-stream', message['x-lobster-bridge-method'] === entry.bridgeMethod, `bridge extension mismatch ${entry.wireType}`);
    const expectedPayload = z.toJSONSchema(entry.schema, { target: 'draft-7', unrepresentable: 'any' });
    delete expectedPayload.$schema;
    delete expectedPayload.title;
    const actualPayload = structuredClone(message.payload.properties.data);
    delete actualPayload.title;
    assert('cowork-stream', canonicalJson(actualPayload) === canonicalJson(expectedPayload), `payload schema mismatch ${entry.wireType}`);
    const signature = bridgePaths.get(entry.bridgeMethod)?.signature ?? '';
    for (const field of Object.keys(valid)) assert('cowork-stream', signature.includes(field), `bridge payload missing ${entry.wireType}.${field}`);
  }
  assert('cowork-stream', ![...expected].some((name) => ['delta', 'tool', 'thinking', 'done', 'abort'].includes(name)), 'internal event leaked');
  const dismiss = CoworkStreamRegistry.find((entry) => entry.wireType === 'permissionDismiss');
  assert('cowork-stream', dismiss.schema.safeParse({ requestId: 'r' }).success, 'permissionDismiss payload invalid');
  assert('cowork-stream', dismiss.schema.safeParse({ requestId: 'r', sessionId: 's' }).success === false, 'permissionDismiss data includes envelope field');
  summaries.coworkStreamCount = CoworkStreamRegistry.length;
};

const checkBridge = () => {
  const sourceRows = extractBridgePaths();
  const source = new Map(sourceRows.map((row) => [row.propertyPath, row.optional]));
  const registry = new Map(BridgeRegistry.map((row) => [row.propertyPath, row.optional]));
  equalSets('bridge', new Set(registry.keys()), new Set(source.keys()), 'IElectronAPI/bridge property set');
  assert('bridge', registry.size === BridgeRegistry.length, 'duplicate bridge property path');
  for (const [propertyPath, optional] of source) assert('bridge', registry.get(propertyPath) === optional, `optional mismatch ${propertyPath}`);
  assert('bridge', registry.has('api.onStreamError') && registry.has('cowork.onStreamError'), 'same leaf names collapsed');
  assert('bridge', BridgeRegistry.every((row) => row.signature.length > 0), 'bridge return signature missing');
  const routeTargets = new Set(RouteRegistry.map((route) => route.operationId));
  const channelTargets = new Set(ChannelRegistry.map((channel) => channel.messageType));
  const inventoryPaths = new Set(IpcGaInventory.flatMap((row) => row.bridgePaths));
  const generatedBridge = readFileSync(path.join(repositoryRoot, 'libs/client/bridge/src/electronBridge.ts'), 'utf8');
  assert('bridge', !/^type .* = unknown;$/m.test(generatedBridge), 'generated bridge erased a named type');
  for (const row of BridgeRegistry) {
    assert('bridge', row.disposition !== 'ga' || row.targets.length > 0, `GA bridge has no target ${row.propertyPath}`);
    for (const target of row.targets) assert('bridge', routeTargets.has(target) || channelTargets.has(target), `bridge has invalid target ${row.propertyPath}:${target}`);
    assert('bridge', row.disposition === 'ga' ? inventoryPaths.has(row.propertyPath) : !inventoryPaths.has(row.propertyPath), `bridge disposition mismatch ${row.propertyPath}`);
  }
  for (const inventory of IpcGaInventory) {
    for (const propertyPath of inventory.bridgePaths) {
      const bridge = BridgeRegistry.find((row) => row.propertyPath === propertyPath);
      assert('bridge', bridge !== undefined, `inventory missing bridge ${inventory.id}:${propertyPath}`);
      for (const target of inventory.targets) assert('bridge', bridge?.targets.includes(target), `inventory/bridge target mismatch ${inventory.id}:${target}`);
    }
  }
  summaries.bridgePropertyCount = registry.size;
};

const checkStreamTicket = () => {
  const valid = [
    {},
    { sessions: ['s1'] },
    { resourceSubscriptions: [{ channel: 'files:changed', params: { workspaceId: 'w1' } }] },
    { sessions: ['s1'], resourceSubscriptions: [{ channel: 'files:changed', params: { workspaceId: 'w1', path: 'docs/a' } }] },
  ];
  const invalid = [
    { tenantId: 't1' }, { jwt: 'token' }, { sessions: [''] },
    { sessions: ['s1', 's1'] },
    { resourceSubscriptions: [{ channel: 'unknown', params: { workspaceId: 'w1' } }] },
    { resourceSubscriptions: [{ channel: 'files:changed', params: {} }] },
    { resourceSubscriptions: [
      { channel: 'files:changed', params: { workspaceId: 'w1', path: 'a' } },
      { channel: 'files:changed', params: { workspaceId: 'w1', path: 'a' } },
    ] },
  ];
  valid.forEach((fixture, index) => assert('stream-ticket', StreamTicketRequestSchema.safeParse(fixture).success, `valid fixture ${index} rejected`));
  invalid.forEach((fixture, index) => assert('stream-ticket', StreamTicketRequestSchema.safeParse(fixture).success === false, `invalid fixture ${index} accepted`));
  assert('stream-ticket', StreamTicketResponseSchema.safeParse({ ticket: 't', expiresAt: new Date().toISOString() }).success, 'response rejected');
  for (const frame of [
    { type: 'subscribe', sessionId: 's', cursor: '1-0' },
    { type: 'subscribe', sessionId: 's', lastSeq: '1-0' },
    { type: 'subscribe', sessionId: 's', sinceSeq: '' },
  ]) assert('stream-ticket', WsClientControlSchema.safeParse(frame).success === false, `legacy cursor frame accepted ${JSON.stringify(frame)}`);
};

const checkEnvelope = () => {
  const valid = { type: 'message', version: 1, tenantId: 't', sessionId: 's', seq: '1-0', emittedAt: new Date().toISOString(), data: {} };
  assert('envelope', StreamEnvelopeSchema.safeParse(valid).success, 'valid envelope rejected');
  assert('envelope', StreamEnvelopeSchema.safeParse({ ...valid, seq: 1 }).success === false, 'numeric seq accepted');
  assert('envelope', StreamEnvelopeSchema.safeParse({ ...valid, data: undefined }).success === false, 'missing data accepted');
  assert('envelope', StreamEnvelopeSchema.safeParse({ ...valid, futureOptional: true }).success, 'unknown optional envelope field rejected');
};

const checkCoreDto = () => {
  assert('core-dto', Schemas.StartSessionRequest.safeParse({ agentId: 'main', prompt: '' }).success === false, 'empty prompt accepted');
  assert('core-dto', Schemas.ContinueTurnRequest.safeParse({ prompt: 'next' }).success, 'continue rejected');
  assert('core-dto', Schemas.TurnAcceptedResponse.safeParse({ requestId: 'r' }).success, 'requestId missing from response contract');
  assert('core-dto', Schemas.PermissionRespondRequest.safeParse({ kind: 'tool', requestId: 'r', result: { behavior: 'deny', message: 'no' } }).success, 'deny union rejected');
  assert('core-dto', Schemas.PermissionRespondRequest.safeParse({ kind: 'tool', requestId: 'r', result: { behavior: 'allow', message: 'no' } }).success === false, 'allow/deny fields mixed');
};

const checkDeferredContracts = () => {
  for (const name of ['ModelDetailResponse', 'PricingCatalogResponse', 'MediaTaskStatusResponse', 'MediaCancelResponse', 'AsrSessionCreateRequest', 'AsrSessionCreateResponse', 'BillingAccountResponse', 'QuotaBuckets', 'QuotaBucketDeltas']) assert('deferred-contracts', name in Schemas, `missing ${name}`);
  const nodeRoute = RouteRegistry.find((route) => route.path === '/api/v1/share-deployments/node');
  assert('deferred-contracts', nodeRoute?.support === 'unsupported', 'node deployment does not freeze 501 unsupported contract');
  const forbiddenImports = ["from 'axios'", 'fetch(', 'billingLedger', 'providerAdapter'];
  const source = readFileSync(path.join(repositoryRoot, 'libs/shared/contracts/src/domains/deferred.schema.ts'), 'utf8');
  for (const fragment of forbiddenImports) assert('deferred-contracts', !source.includes(fragment), `behavior implementation leaked: ${fragment}`);
  assert('deferred-contracts', Schemas.BillingAccountResponse.safeParse({ creditsRemaining: 10, creditsLimit: 14, creditsUsed: 4, breakdown: { daily: 1, monthly: 2, granted: 3, topup: 4 } }).success, 'D12 billing account response rejected');
};

const checkGenerated = () => {
  const generatedFiles = [
    'libs/shared/contracts/openapi.yaml', 'libs/shared/contracts/asyncapi.yaml',
    'libs/shared/contracts/generated/types.ts', 'libs/shared/contracts/generated/validators.ts',
    'libs/shared/contracts/generated/error-codes.ts', 'libs/shared/contracts/generated/contract-manifest.ts',
    'libs/client/bridge/src/electronBridge.ts', 'libs/client/bridge/src/generated/bridge-map.ts',
    'apps/api/src/generated/openapi-types.ts', 'apps/api/src/generated/ws-events.ts',
    'apps/web/src/generated/api-client.ts', 'apps/web/src/generated/stream-events.ts',
  ];
  for (const relativePath of generatedFiles) {
    const absolutePath = path.join(repositoryRoot, relativePath);
    assert('generated-consumers', existsSync(absolutePath), `missing ${relativePath}`);
    if (!existsSync(absolutePath)) continue;
    const firstLine = readFileSync(absolutePath, 'utf8').split(/\r?\n/, 1)[0];
    assert('generated-consumers', firstLine.includes('Generated file. Do not edit.'), `missing header ${relativePath}`);
    const content = readFileSync(absolutePath, 'utf8');
    if (relativePath.includes('/generated/')) assert('generated-consumers', !/from ['"][^'"]*(?:apps\/|src\/renderer)/.test(content), `reverse app import ${relativePath}`);
  }
  const generatedCheck = spawnSync(process.execPath, ['scripts/contracts/generate.mjs', '--check'], { cwd: repositoryRoot, encoding: 'utf8' });
  assert('generated-consumers', generatedCheck.status === 0, generatedCheck.stdout + generatedCheck.stderr);
};

const checkBreaking = () => {
  const baseRef = process.env.CONTRACT_BASE_REF;
  if (!baseRef) return;
  const result = spawnSync(process.execPath, ['scripts/contracts/breaking-diff.mjs'], {
    cwd: repositoryRoot,
    encoding: 'utf8',
    env: process.env,
  });
  if (result.status === 2) {
    process.stdout.write(result.stdout);
    process.stderr.write(result.stderr);
    process.exit(2);
  }
  assert('breaking', result.status === 0, result.stdout + result.stderr);
};

const checks = new Map([
  ['schema', checkSchema], ['routes', checkRoutes], ['appendix-a-coverage', checkAppendixCoverage],
  ['route-negative', checkRouteNegative], ['errors', checkErrors], ['openapi', checkOpenapi],
  ['asyncapi', checkAsyncapi], ['cowork-stream', checkCoworkStream], ['bridge', checkBridge],
  ['stream-ticket', checkStreamTicket], ['envelope', checkEnvelope], ['core-dto', checkCoreDto],
  ['deferred-contracts', checkDeferredContracts], ['generated-consumers', checkGenerated], ['breaking', checkBreaking],
]);
const onlyIndex = process.argv.indexOf('--only');
const only = onlyIndex >= 0 ? process.argv[onlyIndex + 1] : undefined;
const selected = only ? [...checks].filter(([name]) => name === only || name.includes(only)) : [...checks];
if (selected.length === 0) {
  console.error(`Unknown contract check: ${only}`);
  process.exit(1);
}
for (const [name, check] of selected) {
  try {
    await check();
    if (!failures.some((failure) => failure.startsWith(`${name}:`))) console.log(`${name}: PASS`);
  } catch (error) {
    fail(name, error instanceof Error ? error.stack ?? error.message : String(error));
  }
}
if (failures.length > 0) {
  failures.forEach((failure) => console.error(failure));
  process.exit(1);
}
const inventoryHash = createHash('sha256').update(JSON.stringify(IpcGaInventory)).digest('hex');
console.log(JSON.stringify({ status: 'PASS', checks: selected.map(([name]) => name), inventoryHash, ...summaries }));
