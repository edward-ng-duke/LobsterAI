import { z } from 'zod';

export const AgentDtoSchema = z.strictObject({
  id: z.string().min(1),
  name: z.string().min(1),
  model: z.string().min(1).optional(),
  skillIds: z.array(z.string()),
  workingDirectory: z.string().optional(),
});
export const AgentCreateRequestSchema = AgentDtoSchema.omit({ id: true });
export const AgentUpdateRequestSchema = AgentCreateRequestSchema.partial();
export const ModelDtoSchema = z.strictObject({
  id: z.string().min(1),
  name: z.string().min(1),
  kind: z.enum(['text', 'image', 'video']),
  costMultiplier: z.number().positive(),
});
export const ModelDetailResponseSchema = ModelDtoSchema.extend({
  inputUnitPrice: z.number().nonnegative(),
  outputUnitPrice: z.number().nonnegative(),
  capabilities: z.array(z.string()),
  fallbackChain: z.array(z.string()),
});
export const ProviderConfigSchema = z.strictObject({
  provider: z.string().min(1),
  configured: z.boolean(),
  secretRef: z.string().min(1).optional(),
});
export const PricingCatalogResponseSchema = z.strictObject({
  textModels: z.array(ModelDtoSchema),
  imageModels: z.array(ModelDtoSchema),
  videoModels: z.array(ModelDtoSchema),
});
export const AuthErrorSchema = z.strictObject({ code: z.string().min(1), requestId: z.string().min(1) });
export const TenantScopedErrorSchema = z.strictObject({ code: z.enum(['NOT_FOUND', 'PERMISSION_DENIED']), requestId: z.string().min(1) });

export const MediaTaskStatusSchema = z.enum([
  'pending',
  'running',
  'succeeded',
  'failed',
  'canceled',
]);
export const MediaTaskDtoSchema = z.strictObject({
  taskId: z.string().min(1),
  status: MediaTaskStatusSchema,
  resultUrl: z.url().optional(),
  resultKey: z.string().min(1).optional(),
});
export const MediaTaskStatusResponseSchema = MediaTaskDtoSchema;
export const MediaCancelResponseSchema = z.strictObject({
  taskId: z.string().min(1),
  status: z.literal('canceled'),
});
export const MediaStatusPollUpdateSchema = MediaTaskDtoSchema;

export const AsrSessionCreateRequestSchema = z.strictObject({
  mimeType: z.string().min(1),
  language: z.string().min(1).optional(),
});
export const AsrStreamTicketSchema = z.strictObject({
  ticket: z.string().min(1),
  tenantId: z.string().min(1),
  userId: z.string().min(1),
  expiresAt: z.iso.datetime(),
});
export const AsrSessionCreateResponseSchema = z.strictObject({
  asrSessionId: z.string().min(1),
  streamTicket: z.string().min(1),
  expiresAt: z.iso.datetime(),
  recommendedMimeType: z.string().min(1),
});
export const AsrAudioChunkSchema = z.strictObject({
  sequence: z.number().int().nonnegative(),
  audioBase64: z.string().min(1),
});
export const AsrPartialEventSchema = z.strictObject({ text: z.string(), isFinal: z.literal(false) });
export const AsrFinalEventSchema = z.strictObject({ text: z.string(), isFinal: z.literal(true) });
export const AsrErrorEventSchema = z.strictObject({ code: z.string().min(1), message: z.string() });

export const QuotaBucketsSchema = z.strictObject({
  daily: z.number().nonnegative(),
  monthly: z.number().nonnegative(),
  granted: z.number().nonnegative(),
  topup: z.number().nonnegative(),
});
export const QuotaBucketDeltasSchema = z.strictObject({
  daily: z.number(),
  monthly: z.number(),
  granted: z.number(),
  topup: z.number(),
});
const BillingAccountBreakdownSchema = z.strictObject({
  daily: z.strictObject({ balance: z.number().nonnegative(), limit: z.number().nonnegative() }),
  monthly: z.strictObject({ balance: z.number().nonnegative(), limit: z.number().nonnegative() }),
  granted: z.strictObject({ balance: z.number().nonnegative(), total: z.number().nonnegative() }),
  topup: z.strictObject({ balance: z.number().nonnegative() }),
});
export const BillingAccountResponseSchema = z.strictObject({
  creditsRemaining: z.number().nonnegative(),
  creditsLimit: z.number().nonnegative(),
  creditsUsed: z.number().nonnegative(),
  breakdown: BillingAccountBreakdownSchema,
}).superRefine((account, context) => {
  const balance = Object.values(account.breakdown).reduce((sum, bucket) => sum + bucket.balance, 0);
  if (Math.abs(balance - account.creditsRemaining) > Number.EPSILON) {
    context.addIssue({ code: 'custom', path: ['creditsRemaining'], message: 'Balance mismatch' });
  }
  const limit = account.breakdown.daily.limit + account.breakdown.monthly.limit +
    account.breakdown.granted.total + account.breakdown.topup.balance;
  if (Math.abs(limit - account.creditsLimit) > Number.EPSILON) {
    context.addIssue({ code: 'custom', path: ['creditsLimit'], message: 'Limit mismatch' });
  }
  if (Math.abs(limit - balance - account.creditsUsed) > Number.EPSILON) {
    context.addIssue({ code: 'custom', path: ['creditsUsed'], message: 'Usage mismatch' });
  }
}).meta({
  'x-lobster-derived-fields': {
    creditsRemaining: 'daily.balance+monthly.balance+granted.balance+topup.balance',
    creditsLimit: 'daily.limit+monthly.limit+granted.total+topup.balance',
    creditsUsed: 'creditsLimit-creditsRemaining',
  },
});
export const BillingLedgerEntrySchema = z.strictObject({
  requestId: z.string().min(1),
  entryType: z.enum(['hold', 'settle', 'release', 'refund', 'topup', 'grant', 'adjust']),
  reason: z.enum([
    'model_usage',
    'media_generation',
    'asr_transcription',
    'usage_correction',
    'payment_refund',
    'chargeback',
    'sandbox_cost',
  ]),
  credits: z.number(),
  bucketDeltas: QuotaBucketDeltasSchema,
}).superRefine((entry, context) => {
  const deltas = Object.values(entry.bucketDeltas);
  const hasPositive = deltas.some((value) => value > 0);
  const hasNegative = deltas.some((value) => value < 0);
  if (hasPositive && hasNegative) {
    context.addIssue({ code: 'custom', path: ['bucketDeltas'], message: 'Mixed delta signs' });
  }
  const total = deltas.reduce((sum, value) => sum + value, 0);
  if (Math.abs(total - entry.credits) > Number.EPSILON) {
    context.addIssue({ code: 'custom', path: ['bucketDeltas'], message: 'Delta sum mismatch' });
  }
});

export const WorkspaceCreateRequestSchema = z.strictObject({ name: z.string().min(1) });
export const WorkspaceListResponseSchema = z.strictObject({ workspaces: z.array(z.strictObject({ id: z.string().min(1), name: z.string().min(1) })) });
export const WorkspaceCreateResponseSchema = z.strictObject({ workspaceId: z.string().min(1), name: z.string().min(1) });
export const WorkspaceTreeRequestSchema = z.strictObject({ path: z.string().optional(), cursor: z.string().min(1).optional(), depth: z.number().int().nonnegative().optional(), sort: z.enum(['type', 'name', 'id']).optional() });
export const WorkspaceTreeResponseSchema = z.strictObject({ entries: z.array(z.strictObject({ id: z.string().min(1), name: z.string(), type: z.enum(['file', 'directory']) })), nextCursor: z.string().min(1).optional() });
export const FileUploadIntentSchema = z.strictObject({
  path: z.string().min(1),
  sizeBytes: z.number().int().nonnegative(),
  mimeType: z.string().min(1),
});
export const UploadCompleteRequestSchema = z.strictObject({ uploadId: z.string().min(1), etag: z.string().min(1) });
export const UploadCompleteResponseSchema = z.strictObject({ path: z.string().min(1), syncStatus: z.enum(['pending', 'synced', 'failed']) });
export const FileDeleteResponseSchema = z.strictObject({ deleted: z.literal(true) });
export const FileSyncStatusSchema = z.strictObject({ path: z.string().min(1), status: z.enum(['pending', 'synced', 'failed']) });
export const SaveInlineFileRequestSchema = z.strictObject({
  dataBase64: z.string().max(35_000_000),
  fileName: z.string().min(1),
  mimeType: z.string().min(1),
  cwd: z.string().min(1),
});
export const SaveInlineFileResponseSchema = z.strictObject({ success: z.boolean(), path: z.string().optional() });
export const ReadFileAsDataUrlResponseSchema = z.strictObject({ success: z.boolean(), dataUrl: z.string().optional() });
export const ArtifactDtoSchema = z.strictObject({ id: z.string().min(1), type: z.enum(['file', 'html', 'svg', 'document']), path: z.string().min(1) });
export const PreviewTokenRequestSchema = z.strictObject({ artifactId: z.string().min(1), cspMode: z.enum(['strict', 'script-enabled']).optional() });
export const PreviewTokenResponseSchema = z.strictObject({
  previewSessionId: z.string().min(1),
  tokenPrefix: z.string().min(1),
  expiresAt: z.iso.datetime(),
  cspMode: z.enum(['strict', 'script-enabled']),
});
export const PreviewEventSchema = z.strictObject({ previewSessionId: z.string().min(1), status: z.enum(['ready', 'expired', 'revoked']) });

export const McpServerConfigSchema = z.strictObject({ id: z.string().min(1), command: z.string().min(1), enabled: z.boolean(), secretRefs: z.array(z.string()) });
export const McpLaunchResolutionSchema = z.strictObject({ serverId: z.string().min(1), resolvedCommand: z.string().min(1), integrity: z.string().min(1), riskLevel: z.enum(['low', 'medium', 'high']) });
export const SkillManifestSchema = z.strictObject({ id: z.string().min(1), version: z.string().min(1), integrity: z.string().min(1), registry: z.string().min(1) });
export const SkillScanResultSchema = z.strictObject({ riskLevel: z.enum(['low', 'medium', 'high']), lifecycleScripts: z.array(z.string()), allowed: z.boolean() });
export const SupplyChainPolicyErrorSchema = z.strictObject({ code: z.literal('PERMISSION_DENIED'), policy: z.literal('mcpCommandPolicy'), reason: z.string().min(1) });

export const TaskScheduleSchema = z.discriminatedUnion('kind', [
  z.strictObject({ kind: z.literal('at'), at: z.iso.datetime() }),
  z.strictObject({
    kind: z.literal('every'),
    everyMs: z.number().int().positive(),
    anchorMs: z.number().int().nonnegative().optional(),
  }),
  z.strictObject({
    kind: z.literal('cron'),
    expr: z.string().min(1),
    tz: z.string().min(1).optional(),
    staggerMs: z.number().int().nonnegative().optional(),
  }),
]);
export const ScheduledTaskDtoSchema = z.strictObject({ id: z.string().min(1), name: z.string().min(1), schedule: TaskScheduleSchema, enabled: z.boolean() });
export const TaskCreateRequestSchema = ScheduledTaskDtoSchema.omit({ id: true });
export const TaskUpdateRequestSchema = TaskCreateRequestSchema.partial();
export const TaskRunDtoSchema = z.strictObject({ runId: z.string().min(1), taskId: z.string().min(1), status: z.enum(['queued', 'running', 'succeeded', 'failed', 'stopped']) });
export const TaskStatusEventSchema = z.strictObject({ taskId: z.string().min(1), status: z.string().min(1) });
export const TaskRunEventSchema = TaskRunDtoSchema;

export const BillingHoldRequestSchema = z.strictObject({ requestId: z.string().min(1), credits: z.number().positive() });
export const BillingHoldResponseSchema = z.strictObject({ holdId: z.string().min(1), bucketDeltas: QuotaBucketDeltasSchema });
export const BillingSettleRequestSchema = z.strictObject({ requestId: z.string().min(1), holdId: z.string().min(1), credits: z.number().nonnegative() });
export const UsageReportSchema = z.strictObject({ requestId: z.string().min(1), tokens: z.number().int().nonnegative(), credits: z.number().nonnegative() });
export const BillingErrorSchema = z.strictObject({ code: z.enum(['QUOTA_EXCEEDED', 'VALIDATION_FAILED']), requestId: z.string().min(1) });

export const RuntimeSessionClaimSchema = z.strictObject({ tenantId: z.string().min(1), sessionId: z.string().min(1), sessionKeys: z.array(z.string().min(1)) });
export const PodLeaseSchema = z.strictObject({ workspaceId: z.string().min(1), holderId: z.string().min(1), expiresAt: z.iso.datetime() });
export const RuntimeClassSchema = z.enum(['gvisor', 'kata']);
export const GatewayRpcRequestSchema = z.strictObject({ method: z.string().min(1), params: z.record(z.string(), z.unknown()) });
export const GatewayRpcResponseSchema = z.strictObject({ requestId: z.string().min(1), result: z.unknown().optional(), error: z.string().optional() });
export const RuntimeHealthEventSchema = z.strictObject({ ready: z.boolean(), runtimeClassName: RuntimeClassSchema });

export const ShareCreateRequestSchema = z.strictObject({ sourceKey: z.string().min(1), accessMode: z.enum(['private', 'unlisted', 'public']) });
export const ShareDtoSchema = z.strictObject({ id: z.string().min(1), url: z.url(), noindex: z.boolean(), status: z.enum(['active', 'disabled', 'takedown']) });
export const ShareAbuseReportSchema = z.strictObject({ shareId: z.string().min(1), reason: z.string().min(1) });
export const ShareTakedownEventSchema = z.strictObject({ shareId: z.string().min(1), status: z.literal('takedown'), cdnInvalidated: z.boolean() });
