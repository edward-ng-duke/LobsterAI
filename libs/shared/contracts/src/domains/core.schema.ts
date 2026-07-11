import { z } from 'zod';

export const EmptyRequestSchema = z.strictObject({});
const OperationScalarSchema = z.union([z.string(), z.number(), z.boolean(), z.null()]);
const OperationValueSchema = z.union([
  OperationScalarSchema,
  z.array(OperationScalarSchema),
  z.record(z.string(), OperationScalarSchema),
]);
export const OperationRequestSchema = z.strictObject({
  input: OperationValueSchema.optional(),
  idempotencyKey: z.string().min(1).optional(),
});
export const OperationResponseSchema = z.strictObject({
  success: z.boolean(),
  data: OperationValueSchema.optional(),
});

export const LoginRequestSchema = z.strictObject({
  codeChallenge: z.string().min(43),
  redirectUri: z.url(),
  state: z.string().min(16),
});
export const LoginResponseSchema = z.strictObject({ code: z.string().min(1) });
export const OAuthTokenRequestSchema = z.strictObject({
  code: z.string().min(1),
  verifier: z.string().min(43),
  redirectUri: z.url(),
});
export const TokenResponseSchema = z.strictObject({
  accessToken: z.string().min(1),
  expiresAt: z.iso.datetime(),
  refreshToken: z.string().min(1).optional(),
});
export const RefreshRequestSchema = z.strictObject({ refreshToken: z.string().min(1).optional() });
export const LogoutResponseSchema = z.strictObject({ success: z.literal(true) });

export const RoleSchema = z.enum(['owner', 'admin', 'member', 'viewer']);
export const TenantSummarySchema = z.strictObject({ id: z.string().min(1), name: z.string().min(1) });
export const MembershipSchema = z.strictObject({
  tenantId: z.string().min(1),
  userId: z.string().min(1),
  role: RoleSchema,
});
export const SwitchTenantRequestSchema = z.strictObject({ tenantId: z.string().min(1) });

export const WorkspaceRefSchema = z.strictObject({
  workspaceId: z.string().min(1),
  relRoot: z.string().min(1).optional(),
});
export const StartSessionRequestSchema = z.strictObject({
  agentId: z.string().min(1),
  prompt: z.string().min(1),
  cwd: WorkspaceRefSchema.optional(),
  model: z.string().min(1).optional(),
  executionMode: z.enum(['auto', 'local', 'sandbox']).optional(),
});
export const StartSessionResponseSchema = z.strictObject({
  sessionId: z.string().min(1),
  requestId: z.string().min(1),
});
export const ContinueTurnRequestSchema = z.strictObject({ prompt: z.string().min(1) });
export const TurnAcceptedResponseSchema = z.strictObject({ requestId: z.string().min(1) });
export const SessionSummarySchema = z.strictObject({
  id: z.string().min(1),
  title: z.string(),
  status: z.enum(['idle', 'running', 'completed', 'error']),
  goal: z.unknown().optional(),
  capsule: z.unknown().optional(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});
export const SessionDetailSchema = SessionSummarySchema.extend({
  agentId: z.string().min(1),
  sessionKeys: z.array(z.string().min(1)),
});
export const SessionPatchRequestSchema = z.strictObject({
  title: z.string().min(1).optional(),
  pinned: z.boolean().optional(),
  goal: z.unknown().optional(),
});
export const DeleteSessionResponseSchema = z.strictObject({ deleted: z.literal(true) });

export const MessageCursorSchema = z.string().min(1).brand('MessageCursor');
export const MessageDtoSchema = z.strictObject({
  id: z.string().min(1),
  role: z.enum(['user', 'assistant', 'tool', 'system']),
  content: z.string(),
  sequence: z.number().int().nonnegative(),
  createdAt: z.iso.datetime(),
});
export const PageInfoSchema = z.strictObject({
  nextCursor: MessageCursorSchema.optional(),
  hasMore: z.boolean(),
});
export const MessageListResponseSchema = z.strictObject({
  messages: z.array(MessageDtoSchema),
  pageInfo: PageInfoSchema,
});

export const PermissionUpdateSchema = z.strictObject({
  toolName: z.string().min(1),
  allow: z.boolean(),
});
export const PermissionResultSchema = z.discriminatedUnion('behavior', [
  z.strictObject({
    behavior: z.literal('allow'),
    updatedInput: z.unknown().optional(),
    updatedPermissions: z.array(PermissionUpdateSchema).optional(),
  }),
  z.strictObject({
    behavior: z.literal('deny'),
    message: z.string().min(1),
    interrupt: z.boolean().optional(),
  }),
]);
export const PermissionRespondRequestSchema = z.discriminatedUnion('kind', [
  z.strictObject({
    kind: z.literal('tool'),
    requestId: z.string().min(1),
    result: PermissionResultSchema,
  }),
  z.strictObject({
    kind: z.literal('ask'),
    requestId: z.string().min(1),
    answers: z.record(z.string(), z.string()),
  }),
]);
export const AskUserQuestionSchema = z.strictObject({
  requestId: z.string().min(1),
  question: z.string().min(1),
  choices: z.array(z.string().min(1)).optional(),
});
export const PermissionDismissEventSchema = z.strictObject({ requestId: z.string().min(1) });
export const ApiStreamChunkSchema = z.strictObject({ requestId: z.string().min(1), chunk: z.unknown() });
export const ApiStreamDoneSchema = z.strictObject({ requestId: z.string().min(1), done: z.literal(true) });
export const ApiStreamErrorSchema = z.strictObject({ requestId: z.string().min(1), error: z.unknown() });
export const ApiStreamAbortSchema = z.strictObject({ requestId: z.string().min(1), aborted: z.literal(true) });
export const GoalUpdateSchema = z.strictObject({ sessionId: z.string().min(1), goal: z.unknown() });
export const SessionStoppedSchema = z.strictObject({ sessionId: z.string().min(1), stopped: z.literal(true) });
