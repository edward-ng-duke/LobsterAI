import { z } from 'zod';

import {
  AgentDtoSchema,
  McpServerConfigSchema,
  ModelDtoSchema,
  ScheduledTaskDtoSchema,
  SkillManifestSchema,
  TaskRunDtoSchema,
} from './deferred.schema.js';

export const ActionSuccessResponseSchema = z.strictObject({ success: z.literal(true) });
export const AgentListResponseSchema = z.strictObject({ agents: z.array(AgentDtoSchema) });
export const AgentPresetInstallRequestSchema = z.strictObject({ workingDirectory: z.string().min(1).optional() });
export const AppInfoResponseSchema = z.strictObject({ version: z.string().min(1), platform: z.string().min(1), arch: z.string().min(1) });
export const EnterpriseConfigResponseSchema = z.strictObject({ version: z.string().min(1), name: z.string().min(1), disableUpdate: z.boolean().optional() });

export const ByokUpsertRequestSchema = z.strictObject({ provider: z.string().min(1), secret: z.string().min(1) });
export const ByokResponseSchema = z.strictObject({ provider: z.string().min(1), configured: z.boolean() });
export const BillingPlanResponseSchema = z.strictObject({ planId: z.string().min(1), planName: z.string().min(1) });
export const BillingUsageResponseSchema = z.strictObject({ period: z.string().min(1), creditsUsed: z.number().nonnegative() });

export const BootstrapFileResponseSchema = z.strictObject({ content: z.string(), updatedAt: z.iso.datetime() });
export const BootstrapFileWriteRequestSchema = z.strictObject({ content: z.string() });
export const CoworkConfigSchema = z.strictObject({ workingDirectory: z.string(), executionMode: z.enum(['auto', 'local', 'sandbox']), memoryEnabled: z.boolean() });
export const CoworkConfigUpdateRequestSchema = CoworkConfigSchema.partial();
export const DreamingDiaryResponseSchema = z.strictObject({ content: z.string(), date: z.iso.date() });
export const DreamingStatusResponseSchema = z.strictObject({ enabled: z.boolean(), running: z.boolean() });
export const MemoryEntrySchema = z.strictObject({ id: z.string().min(1), text: z.string().min(1), section: z.string().optional() });
export const MemoryEntryCreateRequestSchema = MemoryEntrySchema.omit({ id: true });
export const MemoryEntryUpdateRequestSchema = MemoryEntryCreateRequestSchema.partial();
export const MemoryEntryListResponseSchema = z.strictObject({ entries: z.array(MemoryEntrySchema) });
export const MemoryStatsResponseSchema = z.strictObject({ total: z.number().int().nonnegative(), stale: z.number().int().nonnegative() });

export const HtmlShareCreateRequestSchema = z.strictObject({ source: z.enum(['html', 'artifact']), clientSourceKey: z.string().min(1), sessionId: z.string().min(1).optional(), artifactId: z.string().min(1).optional(), title: z.string().optional() });
export const HtmlShareUpdateRequestSchema = HtmlShareCreateRequestSchema.partial();
export const HtmlSharePatchAccessRequestSchema = z.strictObject({ accessMode: z.enum(['public', 'code']), shareCode: z.string().min(1).optional() });
export const HtmlSharePatchStatusRequestSchema = z.strictObject({ status: z.enum(['active', 'disabled']) });
export const HtmlShareDtoSchema = z.strictObject({ id: z.string().min(1), url: z.url(), status: z.enum(['active', 'disabled']), accessMode: z.enum(['public', 'code']) });
export const HtmlShareListResponseSchema = z.strictObject({ shares: z.array(HtmlShareDtoSchema) });
export const HtmlShareLookupQuerySchema = z.strictObject({ source: z.enum(['html', 'artifact']).optional(), clientSourceKey: z.string().min(1).optional() });

export const InstalledKitSchema = z.strictObject({ id: z.string().min(1), version: z.string().min(1), skillIds: z.array(z.string().min(1)) });
export const KitInstallRequestSchema = z.strictObject({ kitId: z.string().min(1), bundleUrl: z.url(), version: z.string().min(1), skillListIds: z.array(z.string().min(1)) });
export const KitListResponseSchema = z.strictObject({ kits: z.array(InstalledKitSchema) });
export const KeyValueResponseSchema = z.strictObject({ key: z.string().min(1), value: z.string() });
export const KeyValueWriteRequestSchema = z.strictObject({ value: z.string() });
export const McpServerListResponseSchema = z.strictObject({ servers: z.array(McpServerConfigSchema) });
export const McpLaunchRetryRequestSchema = z.strictObject({ force: z.boolean().optional() });

export const ModelConfigWriteRequestSchema = z.strictObject({ provider: z.string().min(1), model: z.string().min(1), baseUrl: z.url().optional(), apiKeySecretRef: z.string().min(1).optional() });
export const ModelConfigResponseSchema = z.strictObject({ provider: z.string().min(1), model: z.string().min(1), baseUrl: z.url().optional(), configured: z.boolean() });
export const ModelConfigCheckRequestSchema = z.strictObject({ provider: z.string().min(1).optional(), model: z.string().min(1).optional(), probeModel: z.boolean().optional() });
export const ModelConfigCheckResponseSchema = z.strictObject({ valid: z.boolean(), model: z.string().min(1).optional() });
export const ModelProxyRequestSchema = z.strictObject({ model: z.string().min(1), messages: z.array(z.strictObject({ role: z.enum(['system', 'user', 'assistant', 'tool']), content: z.string() })).min(1), maxTokens: z.number().int().positive().optional() });
export const ModelProxyResponseSchema = z.strictObject({ content: z.string(), inputTokens: z.number().int().nonnegative(), outputTokens: z.number().int().nonnegative() });
export const ModelStreamRequestSchema = ModelProxyRequestSchema.extend({ requestId: z.string().min(1) });
export const ModelStreamAcceptedResponseSchema = z.strictObject({ requestId: z.string().min(1) });
export const ModelStreamAbortRequestSchema = z.strictObject({ reason: z.string().optional() });
export const ModelStreamAbortResponseSchema = z.strictObject({ aborted: z.literal(true) });
export const ModelListResponseSchema = z.strictObject({ models: z.array(ModelDtoSchema) });

export const PluginDtoSchema = z.strictObject({ id: z.string().min(1), name: z.string().min(1), version: z.string().min(1), enabled: z.boolean() });
export const PluginListResponseSchema = z.strictObject({ plugins: z.array(PluginDtoSchema) });
export const PluginUpdateRequestSchema = z.strictObject({ enabled: z.boolean().optional(), version: z.string().min(1).optional() });
export const PluginConfigRequestSchema = z.strictObject({ config: z.record(z.string(), z.unknown()) });
export const PluginConfigSchemaResponseSchema = z.strictObject({ fields: z.array(z.strictObject({ key: z.string().min(1), sensitive: z.boolean() })) });
export const PluginInstallRequestSchema = z.strictObject({ source: z.string().min(1), integrity: z.string().min(1).optional() });
export const PluginBatchSaveRequestSchema = z.strictObject({ toggles: z.array(z.strictObject({ pluginId: z.string().min(1), enabled: z.boolean() })).optional(), configs: z.array(z.strictObject({ pluginId: z.string().min(1), config: z.record(z.string(), z.unknown()) })).optional() });
export const PluginMutationResponseSchema = z.strictObject({ success: z.boolean(), plugin: PluginDtoSchema.optional() });
export const PluginUpdatesResponseSchema = z.strictObject({ updates: z.array(z.strictObject({ pluginId: z.string().min(1), version: z.string().min(1) })) });

export const PrivacyJobRequestSchema = z.strictObject({ confirmation: z.literal(true) });
export const PrivacyJobResponseSchema = z.strictObject({ jobId: z.string().min(1), status: z.enum(['queued', 'running', 'completed', 'failed']) });
export const RuntimeActionRequestSchema = z.strictObject({ force: z.boolean().optional() });
export const RuntimeStatusResponseSchema = z.strictObject({ status: z.enum(['stopped', 'starting', 'ready', 'error']), version: z.string().min(1).optional() });
export const RuntimeSessionPolicySchema = z.strictObject({ keepAlive: z.enum(['1d', '7d', '30d', '365d']) });
export const RuntimeMigrationRequestSchema = z.strictObject({ backupPath: z.string().min(1).optional() });
export const RuntimeMigrationResponseSchema = z.strictObject({ backupPath: z.string().min(1), completedAt: z.iso.datetime() });

export const ScheduledTaskListResponseSchema = z.strictObject({ tasks: z.array(ScheduledTaskDtoSchema) });
export const TaskRunListResponseSchema = z.strictObject({ runs: z.array(TaskRunDtoSchema) });
export const TaskRunCountResponseSchema = z.strictObject({ count: z.number().int().nonnegative() });
export const TaskStopRequestSchema = z.strictObject({ reason: z.string().optional() });
export const TaskChannelListResponseSchema = z.strictObject({ channels: z.array(z.string().min(1)) });
export const TaskConversationListResponseSchema = z.strictObject({ conversations: z.array(z.strictObject({ id: z.string().min(1), title: z.string() })) });
export const TaskSessionResponseSchema = z.strictObject({ sessionId: z.string().min(1) });
export const TaskRunQuerySchema = z.strictObject({ status: z.enum(['queued', 'running', 'succeeded', 'failed', 'stopped']).optional(), limit: z.number().int().min(1).max(100).optional(), cursor: z.string().min(1).optional() });

export const SessionListResponseSchema = z.strictObject({ sessions: z.array(z.strictObject({ id: z.string().min(1), title: z.string(), status: z.enum(['idle', 'running', 'completed', 'error']) })) });
export const SessionListQuerySchema = z.strictObject({ limit: z.number().int().min(1).max(100).optional(), cursor: z.string().min(1).optional(), pinned: z.boolean().optional() });
export const MessageListQuerySchema = z.strictObject({ limit: z.number().int().min(1).max(100).optional(), cursor: z.string().min(1).optional(), direction: z.enum(['before', 'after']).optional() });
export const SessionCompactRequestSchema = z.strictObject({ reason: z.string().optional() });
export const SessionContextUsageResponseSchema = z.strictObject({ usedTokens: z.number().int().nonnegative(), contextTokens: z.number().int().positive(), percent: z.number().min(0).max(100) });
export const SessionExportRequestSchema = z.strictObject({ format: z.string().min(1).optional() });
export const SessionExportResponseSchema = z.strictObject({ path: z.string().min(1) });
export const SessionForkRequestSchema = z.strictObject({ messageId: z.string().min(1).optional(), mode: z.enum(['conversation', 'worktree']).optional() });
export const SessionForkResponseSchema = z.strictObject({ sessionId: z.string().min(1) });
export const SessionManagedResponseSchema = z.strictObject({ managed: z.boolean() });
export const SessionRailIndexResponseSchema = z.strictObject({ items: z.array(z.strictObject({ messageId: z.string().min(1), index: z.number().int().nonnegative() })) });
export const ResultImageChunkRequestSchema = z.strictObject({ chunkBase64: z.string().min(1), index: z.number().int().nonnegative() });
export const ResultImageFileRequestSchema = z.strictObject({ dataBase64: z.string().min(1), fileName: z.string().min(1) });
export const SessionRuntimePatchRequestSchema = z.strictObject({ model: z.string().min(1).optional(), executionMode: z.enum(['auto', 'local', 'sandbox']).optional() });
export const SessionStopRequestSchema = z.strictObject({ reason: z.string().optional() });
export const SubagentListResponseSchema = z.strictObject({ subagents: z.array(z.strictObject({ runId: z.string().min(1), status: z.string().min(1) })) });
export const SessionTitleRequestSchema = z.strictObject({ userInput: z.string().nullable() });
export const SessionTitleResponseSchema = z.strictObject({ title: z.string().min(1) });
export const SessionViewedRequestSchema = z.strictObject({ viewedAt: z.iso.datetime() });
export const SessionBatchDeleteRequestSchema = z.strictObject({ sessionIds: z.array(z.string().min(1)).min(1) });

export const ShareDeploymentRequestSchema = z.strictObject({ projectPath: z.string().min(1), shareId: z.string().min(1).optional() });
export const ShareDeploymentResponseSchema = z.strictObject({ deploymentId: z.string().min(1), status: z.enum(['queued', 'deploying', 'ready', 'failed']) });
export const SkillDtoSchema = SkillManifestSchema.extend({ name: z.string().min(1), enabled: z.boolean() });
export const SkillListResponseSchema = z.strictObject({ skills: z.array(SkillDtoSchema) });
export const SkillUpdateRequestSchema = z.strictObject({ enabled: z.boolean() });
export const SkillConfigRequestSchema = z.strictObject({ config: z.record(z.string(), z.string()) });
export const SkillConfigResponseSchema = z.strictObject({ config: z.record(z.string(), z.string()) });
export const SkillInstallRequestSchema = z.strictObject({ source: z.string().min(1), integrity: z.string().min(1).optional() });
export const SkillUpgradeRequestSchema = z.strictObject({ downloadUrl: z.url() });
export const SkillConfirmRequestSchema = z.strictObject({ pendingId: z.string().min(1), action: z.enum(['install', 'cancel']) });
export const SkillTestRequestSchema = z.strictObject({ config: z.record(z.string(), z.string()) });
export const SkillTestResponseSchema = z.strictObject({ success: z.boolean(), checks: z.array(z.string()) });
export const SkillMarketplaceResponseSchema = z.strictObject({ skills: z.array(SkillDtoSchema) });
export const SkillRoutingPromptResponseSchema = z.strictObject({ prompt: z.string().nullable() });
export const SkillSyncRequestSchema = z.strictObject({ force: z.boolean().optional() });

export const WorkspaceRecentResponseSchema = z.strictObject({ workspaces: z.array(z.strictObject({ path: z.string().min(1), lastUsedAt: z.iso.datetime() })) });
export const FileDownloadResponseSchema = z.strictObject({ url: z.url().optional(), text: z.string().optional() });
export const FileDownloadQuerySchema = z.strictObject({ path: z.string().min(1), as: z.enum(['text', 'url']).optional() });
export const FilePathQuerySchema = z.strictObject({ path: z.string().min(1) });
export const FileStatResponseSchema = z.strictObject({ path: z.string().min(1), sizeBytes: z.number().int().nonnegative(), modifiedAt: z.iso.datetime() });
export const FileThumbnailResponseSchema = z.strictObject({ dataUrl: z.string().min(1) });
export const AuthMeResponseSchema = z.strictObject({ userId: z.string().min(1), email: z.email() });
export const AuthProfileSummaryResponseSchema = z.strictObject({ nickname: z.string(), avatarUrl: z.url().nullable(), creditsRemaining: z.number().nonnegative() });
