import { z } from 'zod';
import { AskUserQuestionSchema } from '../domains/core.schema.js';

const messagePayload = z.strictObject({
  sessionId: z.string().min(1),
  message: z.record(z.string(), z.unknown()),
  beforeMessageId: z.string().min(1).optional(),
});
const messageUpdatePayload = z.strictObject({
  sessionId: z.string().min(1),
  messageId: z.string().min(1),
  content: z.string(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});
const sessionStatusPayload = z.strictObject({
  sessionId: z.string().min(1),
  status: z.enum(['idle', 'running', 'completed', 'error']),
});
const contextUsagePayload = z.strictObject({
  sessionId: z.string().min(1),
  usage: z.record(z.string(), z.unknown()),
});
const goalPayload = z.strictObject({ sessionId: z.string().min(1), goal: z.unknown() });
const contextMaintenancePayload = z.strictObject({
  sessionId: z.string().min(1),
  active: z.boolean(),
});
const permissionPayload = z.strictObject({
  sessionId: z.string().min(1),
  request: AskUserQuestionSchema.or(z.record(z.string(), z.unknown())),
});
const permissionDismissPayload = z.strictObject({ requestId: z.string().min(1) });
const completePayload = z.strictObject({
  sessionId: z.string().min(1),
  claudeSessionId: z.string().min(1).optional(),
});
const errorPayload = z.strictObject({
  sessionId: z.string().min(1),
  error: z.strictObject({ code: z.string().min(1), message: z.string() }),
});

export const CoworkStreamRegistry = [
  { wireType: 'message', ipcTopic: 'cowork:stream:message', asyncChannel: 'cowork/stream/message', bridgeMethod: 'cowork.onStreamMessage', schema: messagePayload },
  { wireType: 'messageUpdate', ipcTopic: 'cowork:stream:messageUpdate', asyncChannel: 'cowork/stream/message-update', bridgeMethod: 'cowork.onStreamMessageUpdate', schema: messageUpdatePayload },
  { wireType: 'sessionStatus', ipcTopic: 'cowork:stream:sessionStatus', asyncChannel: 'cowork/stream/session-status', bridgeMethod: 'cowork.onStreamSessionStatus', schema: sessionStatusPayload },
  { wireType: 'contextUsage', ipcTopic: 'cowork:stream:contextUsage', asyncChannel: 'cowork/stream/context-usage', bridgeMethod: 'cowork.onStreamContextUsage', runtimeAliases: ['contextUsageUpdate'], schema: contextUsagePayload },
  { wireType: 'goal', ipcTopic: 'cowork:stream:goal', asyncChannel: 'cowork/stream/goal', bridgeMethod: 'cowork.onStreamGoal', runtimeAliases: ['goalUpdate'], schema: goalPayload },
  { wireType: 'contextMaintenance', ipcTopic: 'cowork:stream:contextMaintenance', asyncChannel: 'cowork/stream/context-maintenance', bridgeMethod: 'cowork.onStreamContextMaintenance', schema: contextMaintenancePayload },
  { wireType: 'permission', ipcTopic: 'cowork:stream:permission', asyncChannel: 'cowork/stream/permission', bridgeMethod: 'cowork.onStreamPermission', schema: permissionPayload },
  { wireType: 'permissionDismiss', ipcTopic: 'cowork:stream:permissionDismiss', asyncChannel: 'cowork/stream/permission-dismiss', bridgeMethod: 'cowork.onStreamPermissionDismiss', schema: permissionDismissPayload },
  { wireType: 'complete', ipcTopic: 'cowork:stream:complete', asyncChannel: 'cowork/stream/complete', bridgeMethod: 'cowork.onStreamComplete', schema: completePayload },
  { wireType: 'error', ipcTopic: 'cowork:stream:error', asyncChannel: 'cowork/stream/error', bridgeMethod: 'cowork.onStreamError', schema: errorPayload },
] as const;

export const CoworkStreamChannel = Object.fromEntries(
  CoworkStreamRegistry.map((entry) => [entry.wireType, entry.ipcTopic]),
) as { [Entry in (typeof CoworkStreamRegistry)[number] as Entry['wireType']]: Entry['ipcTopic'] };

export type CoworkStreamWireType = (typeof CoworkStreamRegistry)[number]['wireType'];

