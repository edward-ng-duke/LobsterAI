import type { ZodType } from 'zod';
import { z } from 'zod';
import {
  AsrAudioChunkSchema,
  AsrErrorEventSchema,
  AsrFinalEventSchema,
  AsrPartialEventSchema,
  MediaTaskStatusResponseSchema,
} from '../domains/deferred.schema.js';
import { WsClientControlSchema } from '../envelope.schema.js';
import { CoworkStreamRegistry } from './cowork-stream.js';

export const ChannelDirection = {
  ClientToServer: 'client-to-server',
  ServerToClient: 'server-to-client',
} as const;
export type ChannelDirection = (typeof ChannelDirection)[keyof typeof ChannelDirection];

export interface ChannelRegistryEntry {
  readonly channelId: string;
  readonly path: string;
  readonly direction: ChannelDirection;
  readonly messageType: string;
  readonly schema: ZodType;
  readonly scope: 'session' | 'user' | 'resource' | 'asr';
  readonly replayable: boolean;
  readonly sourceRefs: readonly string[];
}

const event = (
  messageType: string,
  schema: ZodType = z.object({}).catchall(z.unknown()),
  scope: ChannelRegistryEntry['scope'] = 'user',
): ChannelRegistryEntry => ({
  channelId: messageType,
  path: '/api/v1/stream',
  direction: ChannelDirection.ServerToClient,
  messageType,
  schema,
  scope,
  replayable: true,
  sourceRefs: ['附录A:A.3'],
});

export const ChannelRegistry = [
  {
    channelId: 'clientControl',
    path: '/api/v1/stream',
    direction: ChannelDirection.ClientToServer,
    messageType: 'clientControl',
    schema: WsClientControlSchema,
    scope: 'user',
    replayable: false,
    sourceRefs: ['04§5.3'],
  },
  ...CoworkStreamRegistry.map((entry) => event(entry.wireType, entry.schema, 'session')),
  event('apiStreamChunk', z.strictObject({ requestId: z.string().min(1), chunk: z.unknown() })),
  event('apiStreamDone', z.strictObject({ requestId: z.string().min(1), done: z.literal(true) })),
  event('apiStreamError', z.strictObject({ requestId: z.string().min(1), error: z.unknown() })),
  event('apiStreamAbort', z.strictObject({ requestId: z.string().min(1), aborted: z.literal(true) })),
  event('sessionsChanged'),
  event('mediaStatusPollUpdate', MediaTaskStatusResponseSchema),
  event('openSessionFromNotification'),
  event('filesChanged', z.strictObject({
    workspaceId: z.string().min(1),
    relPath: z.string().min(1),
    kind: z.enum(['created', 'changed', 'deleted']),
  }), 'resource'),
  event('skillsChanged'),
  event('mcpChanged'),
  event('quotaChanged'),
  event('pluginsInstallLog'),
  event('openclawEngineProgress'),
  event('taskStatus'),
  event('taskRun'),
  event('taskRefresh'),
  {
    channelId: 'asrAudioChunk',
    path: '/api/v1/asr/sessions/{asrSessionId}/stream',
    direction: ChannelDirection.ClientToServer,
    messageType: 'asrAudioChunk',
    schema: AsrAudioChunkSchema,
    scope: 'asr',
    replayable: false,
    sourceRefs: ['附录A:A.2.16'],
  },
  ...[
    ['asrPartial', AsrPartialEventSchema],
    ['asrFinal', AsrFinalEventSchema],
    ['asrError', AsrErrorEventSchema],
  ].map(([messageType, schema]) => ({
    channelId: messageType as string,
    path: '/api/v1/asr/sessions/{asrSessionId}/stream',
    direction: ChannelDirection.ServerToClient,
    messageType: messageType as string,
    schema: schema as ZodType,
    scope: 'asr' as const,
    replayable: false,
    sourceRefs: ['附录A:A.2.16'],
  })),
] as const satisfies readonly ChannelRegistryEntry[];

