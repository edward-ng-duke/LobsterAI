import type { ZodType } from 'zod';

import type { ErrorCode } from '../errors.js';
import * as Schemas from '../index.schemas.js';
import { IpcGaInventory } from './ipc-ga-inventory.js';

export const HttpMethod = { Get: 'GET', Post: 'POST', Put: 'PUT', Patch: 'PATCH', Delete: 'DELETE' } as const;
export type HttpMethod = (typeof HttpMethod)[keyof typeof HttpMethod];
export const RouteSupport = { Ga: 'ga', Unsupported: 'unsupported' } as const;

export interface RouteRegistryEntry {
  readonly operationId: string; readonly method: HttpMethod; readonly path: string; readonly domain: string;
  readonly requestName: string; readonly request: ZodType; readonly responseName: string; readonly response: ZodType;
  readonly successStatus: number; readonly errors: readonly ErrorCode[]; readonly auth: 'public' | 'access-token'; readonly legacyBridgePaths: readonly string[];
  readonly sourceRefs: readonly string[]; readonly support: 'ga' | 'unsupported';
}

const schemaName = (operationId: string, suffix: 'Request' | 'Response') =>
  `${operationId.replace(/(^|_)([a-zA-Z0-9])/g, (_match, _separator, value: string) => value.toUpperCase())}${suffix}`;

const routeErrors = (path: string, auth: RouteRegistryEntry['auth']): ErrorCode[] => {
  const errors: ErrorCode[] = ['VALIDATION_FAILED', 'RATE_LIMITED', 'INTERNAL_ERROR'];
  if (auth === 'access-token') errors.push('UNAUTHENTICATED', 'PERMISSION_DENIED', 'NOT_FOUND');
  if (path.includes('/sessions')) errors.push('SESSION_BUSY', 'IN_PROGRESS');
  if (path === '/api/v1/stream/ticket') errors.push('TICKET_EXPIRED', 'TICKET_ALREADY_USED');
  if (path.includes('/files') || path.includes('/uploads')) {
    errors.push('PAYLOAD_TOO_LARGE', 'STORAGE_QUOTA_EXCEEDED');
  }
  if (path.includes('/billing') || path.includes('/model') || path.includes('/media')) {
    errors.push('QUOTA_EXCEEDED');
  }
  if (path.includes('/scheduled-tasks')) errors.push('TASK_LIMIT_EXCEEDED');
  if (path.includes('/stream')) errors.push('UNSUPPORTED_EVENT_TYPE', 'STREAM_GAP');
  return [...new Set(errors)];
};

const route = (method: HttpMethod, path: string, operationId: string, requestName: keyof typeof Schemas, responseName: keyof typeof Schemas): RouteRegistryEntry => {
  const support = method === 'POST' && path === '/api/v1/share-deployments/node' ? 'unsupported' : 'ga';
  const auth = ['/auth/login', '/oauth/authorize', '/oauth/token'].includes(path)
    ? 'public'
    : 'access-token';
  const defaultRequest = requestName === 'OperationRequest';
  const defaultResponse = responseName === 'OperationResponse';
  const accepted = method === 'POST' && (
    path === '/api/v1/sessions' ||
    path.includes('/turns') ||
    path.startsWith('/api/v1/model/') ||
    path.startsWith('/api/v1/asr/') ||
    path.startsWith('/api/v1/privacy/') ||
    path.startsWith('/api/v1/runtime/')
  );
  const created = method === 'POST' && !accepted && /\/(agents|artifacts|html-shares|mcp\/servers|scheduled-tasks|skills\/install|kits\/install|uploads)$/.test(path);
  return {
    operationId,
    method,
    path,
    domain: path.split('/').filter(Boolean)[2] ?? 'auth',
    requestName: defaultRequest ? schemaName(operationId, 'Request') : requestName,
    request: defaultRequest ? Schemas.OperationRequest : Schemas[requestName],
    responseName: support === 'unsupported'
      ? 'ErrorEnvelope'
      : defaultResponse
        ? schemaName(operationId, 'Response')
        : responseName,
    response: support === 'unsupported'
      ? Schemas.OperationResponse
      : defaultResponse
        ? Schemas.OperationResponse
        : Schemas[responseName],
    successStatus: support === 'unsupported' ? 501 : accepted ? 202 : created ? 201 : 200,
    errors: support === 'unsupported' ? ['UNSUPPORTED_FEATURE'] : routeErrors(path, auth),
    auth,
    legacyBridgePaths: [],
    sourceRefs: ['附录A', '19§3.3'],
    support,
  };
};

const RouteDefinitions = [
  route('GET', '/api/v1/agents', 'get_api_v1_agents', 'EmptyRequest', 'AgentDto'),
  route('POST', '/api/v1/agents', 'post_api_v1_agents', 'AgentCreateRequest', 'AgentDto'),
  route('DELETE', '/api/v1/agents/{id}', 'delete_api_v1_agents_id', 'EmptyRequest', 'OperationResponse'),
  route('GET', '/api/v1/agents/{id}', 'get_api_v1_agents_id', 'EmptyRequest', 'AgentDto'),
  route('PATCH', '/api/v1/agents/{id}', 'patch_api_v1_agents_id', 'AgentUpdateRequest', 'AgentDto'),
  route('GET', '/api/v1/agents/preset-templates', 'get_api_v1_agents_preset_templates', 'EmptyRequest', 'OperationResponse'),
  route('GET', '/api/v1/agents/presets', 'get_api_v1_agents_presets', 'EmptyRequest', 'OperationResponse'),
  route('POST', '/api/v1/agents/presets/{presetId}/install', 'post_api_v1_agents_presets_presetId_install', 'OperationRequest', 'OperationResponse'),
  route('POST', '/api/v1/artifacts/{artifactId}/preview', 'post_api_v1_artifacts_artifactId_preview', 'PreviewTokenRequest', 'PreviewTokenResponse'),
  route('DELETE', '/api/v1/artifacts/preview-sessions/{previewSessionId}', 'delete_api_v1_artifacts_preview_sessions_previewSessionId', 'EmptyRequest', 'OperationResponse'),
  route('POST', '/api/v1/asr/sessions', 'post_api_v1_asr_sessions', 'AsrSessionCreateRequest', 'AsrSessionCreateResponse'),
  route('GET', '/api/v1/billing/account', 'get_api_v1_billing_account', 'EmptyRequest', 'BillingAccountResponse'),
  route('POST', '/api/v1/billing/byok', 'post_api_v1_billing_byok', 'OperationRequest', 'OperationResponse'),
  route('DELETE', '/api/v1/billing/byok/{provider}', 'delete_api_v1_billing_byok_provider', 'EmptyRequest', 'OperationResponse'),
  route('GET', '/api/v1/billing/plan', 'get_api_v1_billing_plan', 'EmptyRequest', 'OperationResponse'),
  route('GET', '/api/v1/billing/usage', 'get_api_v1_billing_usage', 'EmptyRequest', 'OperationResponse'),
  route('GET', '/api/v1/config/app-info', 'get_api_v1_config_app_info', 'EmptyRequest', 'OperationResponse'),
  route('GET', '/api/v1/config/enterprise', 'get_api_v1_config_enterprise', 'EmptyRequest', 'OperationResponse'),
  route('GET', '/api/v1/cowork/bootstrap', 'get_api_v1_cowork_bootstrap', 'EmptyRequest', 'OperationResponse'),
  route('PUT', '/api/v1/cowork/bootstrap', 'put_api_v1_cowork_bootstrap', 'OperationRequest', 'OperationResponse'),
  route('GET', '/api/v1/cowork/config', 'get_api_v1_cowork_config', 'EmptyRequest', 'OperationResponse'),
  route('PATCH', '/api/v1/cowork/config', 'patch_api_v1_cowork_config', 'OperationRequest', 'OperationResponse'),
  route('GET', '/api/v1/cowork/dreaming/diary', 'get_api_v1_cowork_dreaming_diary', 'EmptyRequest', 'OperationResponse'),
  route('GET', '/api/v1/cowork/dreaming/status', 'get_api_v1_cowork_dreaming_status', 'EmptyRequest', 'OperationResponse'),
  route('GET', '/api/v1/cowork/memory/entries', 'get_api_v1_cowork_memory_entries', 'EmptyRequest', 'MessageListResponse'),
  route('POST', '/api/v1/cowork/memory/entries', 'post_api_v1_cowork_memory_entries', 'OperationRequest', 'OperationResponse'),
  route('DELETE', '/api/v1/cowork/memory/entries/{id}', 'delete_api_v1_cowork_memory_entries_id', 'EmptyRequest', 'OperationResponse'),
  route('PATCH', '/api/v1/cowork/memory/entries/{id}', 'patch_api_v1_cowork_memory_entries_id', 'OperationRequest', 'OperationResponse'),
  route('GET', '/api/v1/cowork/memory/stats', 'get_api_v1_cowork_memory_stats', 'EmptyRequest', 'OperationResponse'),
  route('GET', '/api/v1/html-shares', 'get_api_v1_html_shares', 'EmptyRequest', 'OperationResponse'),
  route('POST', '/api/v1/html-shares', 'post_api_v1_html_shares', 'OperationRequest', 'OperationResponse'),
  route('GET', '/api/v1/html-shares/{id}', 'get_api_v1_html_shares_id', 'EmptyRequest', 'OperationResponse'),
  route('PUT', '/api/v1/html-shares/{id}', 'put_api_v1_html_shares_id', 'OperationRequest', 'OperationResponse'),
  route('PATCH', '/api/v1/html-shares/{id}/access-mode', 'patch_api_v1_html_shares_id_access_mode', 'OperationRequest', 'OperationResponse'),
  route('PATCH', '/api/v1/html-shares/{id}/status', 'patch_api_v1_html_shares_id_status', 'OperationRequest', 'OperationResponse'),
  route('GET', '/api/v1/html-shares/{shareId}/deployment', 'get_api_v1_html_shares_shareId_deployment', 'EmptyRequest', 'OperationResponse'),
  route('DELETE', '/api/v1/kits/{id}', 'delete_api_v1_kits_id', 'EmptyRequest', 'OperationResponse'),
  route('POST', '/api/v1/kits/install', 'post_api_v1_kits_install', 'OperationRequest', 'OperationResponse'),
  route('GET', '/api/v1/kits/installed', 'get_api_v1_kits_installed', 'EmptyRequest', 'OperationResponse'),
  route('GET', '/api/v1/kits/marketplace', 'get_api_v1_kits_marketplace', 'EmptyRequest', 'OperationResponse'),
  route('DELETE', '/api/v1/kv/{key}', 'delete_api_v1_kv_key', 'EmptyRequest', 'OperationResponse'),
  route('GET', '/api/v1/kv/{key}', 'get_api_v1_kv_key', 'EmptyRequest', 'OperationResponse'),
  route('PUT', '/api/v1/kv/{key}', 'put_api_v1_kv_key', 'OperationRequest', 'OperationResponse'),
  route('GET', '/api/v1/mcp/marketplace', 'get_api_v1_mcp_marketplace', 'EmptyRequest', 'OperationResponse'),
  route('GET', '/api/v1/mcp/servers', 'get_api_v1_mcp_servers', 'EmptyRequest', 'OperationResponse'),
  route('POST', '/api/v1/mcp/servers', 'post_api_v1_mcp_servers', 'McpServerConfig', 'McpServerConfig'),
  route('DELETE', '/api/v1/mcp/servers/{id}', 'delete_api_v1_mcp_servers_id', 'EmptyRequest', 'OperationResponse'),
  route('PATCH', '/api/v1/mcp/servers/{id}', 'patch_api_v1_mcp_servers_id', 'McpServerConfig', 'McpServerConfig'),
  route('POST', '/api/v1/mcp/servers/{id}/launch-resolution/retry', 'post_api_v1_mcp_servers_id_launch_resolution_retry', 'OperationRequest', 'OperationResponse'),
  route('GET', '/api/v1/media/tasks/{taskId}', 'get_api_v1_media_tasks_taskId', 'EmptyRequest', 'MediaTaskStatusResponse'),
  route('POST', '/api/v1/media/tasks/{taskId}/cancel', 'post_api_v1_media_tasks_taskId_cancel', 'EmptyRequest', 'MediaCancelResponse'),
  route('GET', '/api/v1/model/config', 'get_api_v1_model_config', 'EmptyRequest', 'OperationResponse'),
  route('PUT', '/api/v1/model/config', 'put_api_v1_model_config', 'OperationRequest', 'OperationResponse'),
  route('POST', '/api/v1/model/config/check', 'post_api_v1_model_config_check', 'OperationRequest', 'OperationResponse'),
  route('POST', '/api/v1/model/proxy', 'post_api_v1_model_proxy', 'OperationRequest', 'OperationResponse'),
  route('POST', '/api/v1/model/stream', 'post_api_v1_model_stream', 'OperationRequest', 'OperationResponse'),
  route('POST', '/api/v1/model/stream/{requestId}/abort', 'post_api_v1_model_stream_requestId_abort', 'OperationRequest', 'OperationResponse'),
  route('GET', '/api/v1/models', 'get_api_v1_models', 'EmptyRequest', 'OperationResponse'),
  route('GET', '/api/v1/models/{id}', 'get_api_v1_models_id', 'EmptyRequest', 'ModelDetailResponse'),
  route('GET', '/api/v1/plugins', 'get_api_v1_plugins', 'EmptyRequest', 'OperationResponse'),
  route('DELETE', '/api/v1/plugins/{id}', 'delete_api_v1_plugins_id', 'EmptyRequest', 'OperationResponse'),
  route('PATCH', '/api/v1/plugins/{id}', 'patch_api_v1_plugins_id', 'OperationRequest', 'OperationResponse'),
  route('PUT', '/api/v1/plugins/{id}/config', 'put_api_v1_plugins_id_config', 'OperationRequest', 'OperationResponse'),
  route('GET', '/api/v1/plugins/{id}/config-schema', 'get_api_v1_plugins_id_config_schema', 'EmptyRequest', 'OperationResponse'),
  route('POST', '/api/v1/plugins/{id}/update', 'post_api_v1_plugins_id_update', 'OperationRequest', 'OperationResponse'),
  route('POST', '/api/v1/plugins/batch-save', 'post_api_v1_plugins_batch_save', 'OperationRequest', 'OperationResponse'),
  route('POST', '/api/v1/plugins/detect', 'post_api_v1_plugins_detect', 'OperationRequest', 'OperationResponse'),
  route('POST', '/api/v1/plugins/install', 'post_api_v1_plugins_install', 'OperationRequest', 'OperationResponse'),
  route('POST', '/api/v1/plugins/sync', 'post_api_v1_plugins_sync', 'OperationRequest', 'OperationResponse'),
  route('GET', '/api/v1/plugins/updates/check', 'get_api_v1_plugins_updates_check', 'EmptyRequest', 'OperationResponse'),
  route('GET', '/api/v1/pricing/models', 'get_api_v1_pricing_models', 'EmptyRequest', 'PricingCatalogResponse'),
  route('POST', '/api/v1/privacy/deletions', 'post_api_v1_privacy_deletions', 'OperationRequest', 'OperationResponse'),
  route('GET', '/api/v1/privacy/deletions/{deletionId}', 'get_api_v1_privacy_deletions_deletionId', 'EmptyRequest', 'OperationResponse'),
  route('POST', '/api/v1/privacy/exports', 'post_api_v1_privacy_exports', 'OperationRequest', 'OperationResponse'),
  route('GET', '/api/v1/privacy/exports/{exportId}', 'get_api_v1_privacy_exports_exportId', 'EmptyRequest', 'OperationResponse'),
  route('POST', '/api/v1/runtime/migration/backups', 'post_api_v1_runtime_migration_backups', 'OperationRequest', 'OperationResponse'),
  route('GET', '/api/v1/runtime/migration/last-restore', 'get_api_v1_runtime_migration_last_restore', 'EmptyRequest', 'OperationResponse'),
  route('POST', '/api/v1/runtime/migration/restores', 'post_api_v1_runtime_migration_restores', 'OperationRequest', 'OperationResponse'),
  route('POST', '/api/v1/runtime/provision', 'post_api_v1_runtime_provision', 'OperationRequest', 'OperationResponse'),
  route('POST', '/api/v1/runtime/repair', 'post_api_v1_runtime_repair', 'OperationRequest', 'OperationResponse'),
  route('POST', '/api/v1/runtime/restart', 'post_api_v1_runtime_restart', 'OperationRequest', 'OperationResponse'),
  route('GET', '/api/v1/runtime/session-policy', 'get_api_v1_runtime_session_policy', 'EmptyRequest', 'OperationResponse'),
  route('PUT', '/api/v1/runtime/session-policy', 'put_api_v1_runtime_session_policy', 'OperationRequest', 'OperationResponse'),
  route('GET', '/api/v1/runtime/status', 'get_api_v1_runtime_status', 'EmptyRequest', 'OperationResponse'),
  route('GET', '/api/v1/scheduled-tasks', 'get_api_v1_scheduled_tasks', 'EmptyRequest', 'ScheduledTaskDto'),
  route('POST', '/api/v1/scheduled-tasks', 'post_api_v1_scheduled_tasks', 'TaskCreateRequest', 'ScheduledTaskDto'),
  route('DELETE', '/api/v1/scheduled-tasks/{id}', 'delete_api_v1_scheduled_tasks_id', 'EmptyRequest', 'OperationResponse'),
  route('GET', '/api/v1/scheduled-tasks/{id}', 'get_api_v1_scheduled_tasks_id', 'EmptyRequest', 'ScheduledTaskDto'),
  route('PATCH', '/api/v1/scheduled-tasks/{id}', 'patch_api_v1_scheduled_tasks_id', 'TaskUpdateRequest', 'ScheduledTaskDto'),
  route('GET', '/api/v1/scheduled-tasks/{id}/runs', 'get_api_v1_scheduled_tasks_id_runs', 'EmptyRequest', 'TaskRunDto'),
  route('POST', '/api/v1/scheduled-tasks/{id}/runs', 'post_api_v1_scheduled_tasks_id_runs', 'EmptyRequest', 'TaskRunDto'),
  route('GET', '/api/v1/scheduled-tasks/{id}/runs/count', 'get_api_v1_scheduled_tasks_id_runs_count', 'EmptyRequest', 'OperationResponse'),
  route('POST', '/api/v1/scheduled-tasks/{id}/stop', 'post_api_v1_scheduled_tasks_id_stop', 'OperationRequest', 'OperationResponse'),
  route('GET', '/api/v1/scheduled-tasks/channels', 'get_api_v1_scheduled_tasks_channels', 'EmptyRequest', 'OperationResponse'),
  route('GET', '/api/v1/scheduled-tasks/channels/{ch}/conversations', 'get_api_v1_scheduled_tasks_channels_ch_conversations', 'EmptyRequest', 'OperationResponse'),
  route('GET', '/api/v1/scheduled-tasks/runs', 'get_api_v1_scheduled_tasks_runs', 'EmptyRequest', 'OperationResponse'),
  route('GET', '/api/v1/scheduled-tasks/runs/{runId}/session', 'get_api_v1_scheduled_tasks_runs_runId_session', 'EmptyRequest', 'OperationResponse'),
  route('GET', '/api/v1/sessions', 'get_api_v1_sessions', 'EmptyRequest', 'SessionSummary'),
  route('POST', '/api/v1/sessions', 'post_api_v1_sessions', 'StartSessionRequest', 'StartSessionResponse'),
  route('DELETE', '/api/v1/sessions/{id}', 'delete_api_v1_sessions_id', 'EmptyRequest', 'DeleteSessionResponse'),
  route('GET', '/api/v1/sessions/{id}', 'get_api_v1_sessions_id', 'EmptyRequest', 'SessionDetail'),
  route('PATCH', '/api/v1/sessions/{id}', 'patch_api_v1_sessions_id', 'SessionPatchRequest', 'SessionDetail'),
  route('POST', '/api/v1/sessions/{id}/compact-context', 'post_api_v1_sessions_id_compact_context', 'OperationRequest', 'OperationResponse'),
  route('GET', '/api/v1/sessions/{id}/context-usage', 'get_api_v1_sessions_id_context_usage', 'EmptyRequest', 'OperationResponse'),
  route('POST', '/api/v1/sessions/{id}/exports/result-image', 'post_api_v1_sessions_id_exports_result_image', 'OperationRequest', 'OperationResponse'),
  route('POST', '/api/v1/sessions/{id}/exports/text', 'post_api_v1_sessions_id_exports_text', 'OperationRequest', 'OperationResponse'),
  route('POST', '/api/v1/sessions/{id}/fork', 'post_api_v1_sessions_id_fork', 'OperationRequest', 'OperationResponse'),
  route('GET', '/api/v1/sessions/{id}/managed', 'get_api_v1_sessions_id_managed', 'EmptyRequest', 'OperationResponse'),
  route('GET', '/api/v1/sessions/{id}/messages', 'get_api_v1_sessions_id_messages', 'EmptyRequest', 'MessageListResponse'),
  route('POST', '/api/v1/sessions/{id}/permissions/{requestId}/respond', 'post_api_v1_sessions_id_permissions_requestId_respond', 'PermissionRespondRequest', 'OperationResponse'),
  route('GET', '/api/v1/sessions/{id}/rail-index', 'get_api_v1_sessions_id_rail_index', 'EmptyRequest', 'OperationResponse'),
  route('POST', '/api/v1/sessions/{id}/result-image/chunks', 'post_api_v1_sessions_id_result_image_chunks', 'OperationRequest', 'OperationResponse'),
  route('POST', '/api/v1/sessions/{id}/result-image/files', 'post_api_v1_sessions_id_result_image_files', 'OperationRequest', 'OperationResponse'),
  route('PATCH', '/api/v1/sessions/{id}/runtime', 'patch_api_v1_sessions_id_runtime', 'OperationRequest', 'OperationResponse'),
  route('POST', '/api/v1/sessions/{id}/stop', 'post_api_v1_sessions_id_stop', 'OperationRequest', 'OperationResponse'),
  route('GET', '/api/v1/sessions/{id}/subagents', 'get_api_v1_sessions_id_subagents', 'EmptyRequest', 'OperationResponse'),
  route('POST', '/api/v1/sessions/{id}/title-generation', 'post_api_v1_sessions_id_title_generation', 'OperationRequest', 'OperationResponse'),
  route('POST', '/api/v1/sessions/{id}/turns', 'post_api_v1_sessions_id_turns', 'ContinueTurnRequest', 'TurnAcceptedResponse'),
  route('POST', '/api/v1/sessions/{id}/viewed', 'post_api_v1_sessions_id_viewed', 'OperationRequest', 'OperationResponse'),
  route('POST', '/api/v1/sessions/batch-delete', 'post_api_v1_sessions_batch_delete', 'OperationRequest', 'OperationResponse'),
  route('GET', '/api/v1/share-deployments/{deploymentId}', 'get_api_v1_share_deployments_deploymentId', 'EmptyRequest', 'OperationResponse'),
  route('POST', '/api/v1/share-deployments/analyze', 'post_api_v1_share_deployments_analyze', 'ShareCreateRequest', 'ShareDto'),
  route('POST', '/api/v1/share-deployments/candidates', 'post_api_v1_share_deployments_candidates', 'ShareCreateRequest', 'ShareDto'),
  route('POST', '/api/v1/share-deployments/node', 'post_api_v1_share_deployments_node', 'OperationRequest', 'OperationResponse'),
  route('POST', '/api/v1/share-deployments/static', 'post_api_v1_share_deployments_static', 'OperationRequest', 'OperationResponse'),
  route('GET', '/api/v1/skills', 'get_api_v1_skills', 'EmptyRequest', 'OperationResponse'),
  route('DELETE', '/api/v1/skills/{id}', 'delete_api_v1_skills_id', 'EmptyRequest', 'OperationResponse'),
  route('PATCH', '/api/v1/skills/{id}', 'patch_api_v1_skills_id', 'OperationRequest', 'OperationResponse'),
  route('GET', '/api/v1/skills/{id}/config', 'get_api_v1_skills_id_config', 'EmptyRequest', 'OperationResponse'),
  route('PUT', '/api/v1/skills/{id}/config', 'put_api_v1_skills_id_config', 'OperationRequest', 'OperationResponse'),
  route('POST', '/api/v1/skills/{id}/confirm', 'post_api_v1_skills_id_confirm', 'OperationRequest', 'OperationResponse'),
  route('POST', '/api/v1/skills/{id}/test', 'post_api_v1_skills_id_test', 'OperationRequest', 'OperationResponse'),
  route('POST', '/api/v1/skills/{id}/upgrade', 'post_api_v1_skills_id_upgrade', 'OperationRequest', 'OperationResponse'),
  route('POST', '/api/v1/skills/install', 'post_api_v1_skills_install', 'OperationRequest', 'OperationResponse'),
  route('GET', '/api/v1/skills/marketplace', 'get_api_v1_skills_marketplace', 'EmptyRequest', 'OperationResponse'),
  route('GET', '/api/v1/skills/routing-prompt', 'get_api_v1_skills_routing_prompt', 'EmptyRequest', 'OperationResponse'),
  route('POST', '/api/v1/skills/sync', 'post_api_v1_skills_sync', 'OperationRequest', 'OperationResponse'),
  route('POST', '/api/v1/stream/ticket', 'post_api_v1_stream_ticket', 'StreamTicketRequest', 'StreamTicketResponse'),
  route('DELETE', '/api/v1/subagents/{runId}', 'delete_api_v1_subagents_runId', 'EmptyRequest', 'OperationResponse'),
  route('GET', '/api/v1/subagents/{runId}/messages', 'get_api_v1_subagents_runId_messages', 'EmptyRequest', 'OperationResponse'),
  route('GET', '/api/v1/workspaces', 'get_api_v1_workspaces', 'EmptyRequest', 'WorkspaceListResponse'),
  route('POST', '/api/v1/workspaces', 'post_api_v1_workspaces', 'WorkspaceCreateRequest', 'WorkspaceCreateResponse'),
  route('DELETE', '/api/v1/workspaces/{wid}/files', 'delete_api_v1_workspaces_wid_files', 'EmptyRequest', 'OperationResponse'),
  route('GET', '/api/v1/workspaces/{wid}/files/download', 'get_api_v1_workspaces_wid_files_download', 'EmptyRequest', 'OperationResponse'),
  route('GET', '/api/v1/workspaces/{wid}/files/stat', 'get_api_v1_workspaces_wid_files_stat', 'EmptyRequest', 'OperationResponse'),
  route('GET', '/api/v1/workspaces/{wid}/files/thumbnail', 'get_api_v1_workspaces_wid_files_thumbnail', 'EmptyRequest', 'OperationResponse'),
  route('GET', '/api/v1/workspaces/{wid}/files/tree', 'get_api_v1_workspaces_wid_files_tree', 'WorkspaceTreeRequest', 'WorkspaceTreeResponse'),
  route('POST', '/api/v1/workspaces/{wid}/files/upload', 'post_api_v1_workspaces_wid_files_upload', 'SaveInlineFileRequest', 'SaveInlineFileResponse'),
  route('POST', '/api/v1/workspaces/{wid}/uploads', 'post_api_v1_workspaces_wid_uploads', 'FileUploadIntent', 'FileUploadIntent'),
  route('POST', '/api/v1/workspaces/{wid}/uploads/{id}/complete', 'post_api_v1_workspaces_wid_uploads_id_complete', 'UploadCompleteRequest', 'UploadCompleteResponse'),
  route('GET', '/api/v1/workspaces/recent', 'get_api_v1_workspaces_recent', 'EmptyRequest', 'OperationResponse'),
  route('POST', '/auth/login', 'post_auth_login', 'LoginRequest', 'LoginResponse'),
  route('POST', '/auth/logout', 'post_auth_logout', 'EmptyRequest', 'LogoutResponse'),
  route('GET', '/auth/me', 'get_auth_me', 'EmptyRequest', 'OperationResponse'),
  route('GET', '/auth/profile-summary', 'get_auth_profile_summary', 'EmptyRequest', 'OperationResponse'),
  route('POST', '/auth/refresh', 'post_auth_refresh', 'RefreshRequest', 'TokenResponse'),
  route('POST', '/oauth/authorize', 'post_oauth_authorize', 'OperationRequest', 'OperationResponse'),
  route('POST', '/oauth/token', 'post_oauth_token', 'OAuthTokenRequest', 'TokenResponse'),
] as const satisfies readonly RouteRegistryEntry[];

export const RouteRegistry = RouteDefinitions.map((definition) => {
  const inventoryRows = IpcGaInventory.filter(
    (row) =>
      row.kind === 'route' && row.targets.some((target) => target === definition.operationId),
  );
  return {
    ...definition,
    errors:
      definition.support === RouteSupport.Unsupported
        ? ['UNSUPPORTED_FEATURE']
        : definition.errors,
    legacyBridgePaths: inventoryRows.map((row) => row.legacyIpc),
    sourceRefs: [...definition.sourceRefs, ...inventoryRows.map((row) => row.sourceRef)],
  } satisfies RouteRegistryEntry;
});
