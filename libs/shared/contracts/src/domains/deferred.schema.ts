import { z } from 'zod';

export const AgentDtoSchema = z.strictObject({
  id: z.string().min(1),
  name: z.string().min(1),
  model: z.string().min(1).optional(),
  skillIds: z.array(z.string()),
  workingDirectory: z.string().optional(),
});
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
  subscription: z.number().nonnegative(),
  purchased: z.number().nonnegative(),
  promotional: z.number().nonnegative(),
  overdraft: z.number().nonpositive(),
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
  bucketDeltas: QuotaBucketsSchema,
});

export const WorkspaceCreateRequestSchema = z.strictObject({ name: z.string().min(1) });
export const FileUploadIntentSchema = z.strictObject({
  path: z.string().min(1),
  sizeBytes: z.number().int().nonnegative(),
  mimeType: z.string().min(1),
});
export const SaveInlineFileRequestSchema = z.strictObject({
  dataBase64: z.string().max(35_000_000),
  fileName: z.string().min(1),
  mimeType: z.string().min(1),
  cwd: z.string().min(1),
});
export const PreviewTokenResponseSchema = z.strictObject({
  previewSessionId: z.string().min(1),
  tokenPrefix: z.string().min(1),
  expiresAt: z.iso.datetime(),
  cspMode: z.enum(['strict', 'script-enabled']),
});

