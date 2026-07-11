import { z } from 'zod';

import { ErrorCodeSchema } from './errors.js';

export const ErrorEnvelopeSchema = z.strictObject({
  error: z.strictObject({
    code: ErrorCodeSchema,
    message: z.string(),
    requestId: z.string().min(1),
    details: z.record(z.string(), z.unknown()).optional(),
  }),
});

export const StreamEnvelopeSchema = z.object({
  type: z.string().min(1),
  version: z.literal(1),
  tenantId: z.string().min(1),
  sessionId: z.string().min(1).optional(),
  requestId: z.string().min(1).optional(),
  seq: z.string().min(1).optional(),
  idempotencyKey: z.string().min(1).optional(),
  emittedAt: z.iso.datetime(),
  data: z.record(z.string(), z.unknown()),
});

const resourceParams = z.strictObject({
  workspaceId: z.string().min(1),
  path: z.string().min(1).optional(),
});

export const ResourceSubscriptionSchema = z.strictObject({
  channel: z.literal('files:changed'),
  params: resourceParams,
});

export const StreamTicketRequestSchema = z.strictObject({
  sessions: z.array(z.string().min(1)).max(100).optional(),
  resourceSubscriptions: z.array(ResourceSubscriptionSchema).max(100).optional(),
}).superRefine((value, context) => {
  const sessions = value.sessions ?? [];
  if (new Set(sessions).size !== sessions.length) {
    context.addIssue({ code: 'custom', path: ['sessions'], message: 'Duplicate session scope' });
  }
  const resources = (value.resourceSubscriptions ?? []).map(
    (subscription) =>
      `${subscription.channel}\0${subscription.params.workspaceId}\0${subscription.params.path ?? ''}`,
  );
  if (new Set(resources).size !== resources.length) {
    context.addIssue({
      code: 'custom',
      path: ['resourceSubscriptions'],
      message: 'Duplicate resource scope',
    });
  }
});

export const StreamTicketResponseSchema = z.strictObject({
  ticket: z.string().min(1),
  expiresAt: z.iso.datetime(),
});

export const WsClientControlSchema = z.discriminatedUnion('type', [
  z.strictObject({ type: z.literal('auth'), ticket: z.string().min(1) }),
  z.strictObject({
    type: z.literal('subscribe'),
    sessionId: z.string().min(1),
    sinceSeq: z.string().min(1).optional(),
  }),
  z.strictObject({ type: z.literal('unsubscribe'), sessionId: z.string().min(1) }),
  z.strictObject({
    type: z.literal('subscribeEvent'),
    channel: z.literal('files:changed'),
    params: resourceParams,
    sinceSeq: z.string().min(1).optional(),
  }),
  z.strictObject({
    type: z.literal('unsubscribeEvent'),
    channel: z.literal('files:changed'),
    params: resourceParams,
  }),
  z.strictObject({ type: z.literal('ping'), ts: z.number().int() }),
  z.strictObject({
    type: z.literal('ack'),
    sessionId: z.string().min(1).optional(),
    channel: z.string().min(1).optional(),
    seq: z.string().min(1),
  }),
]);
