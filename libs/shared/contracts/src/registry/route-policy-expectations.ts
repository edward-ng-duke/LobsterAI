import type { ErrorCode } from '../errors.js';

export interface RoutePolicyExpectation {
  readonly auth: 'public' | 'access-token' | 'refresh-cookie';
  readonly successStatus: number;
  readonly errors: readonly ErrorCode[];
}

const publicCredentialErrors = [
  'VALIDATION_FAILED',
  'RATE_LIMITED',
  'INTERNAL_ERROR',
  'UNAUTHENTICATED',
] as const satisfies readonly ErrorCode[];
const protectedCollectionErrors = [
  'VALIDATION_FAILED',
  'RATE_LIMITED',
  'INTERNAL_ERROR',
  'UNAUTHENTICATED',
  'PERMISSION_DENIED',
] as const satisfies readonly ErrorCode[];
const protectedItemErrors = [
  ...protectedCollectionErrors,
  'NOT_FOUND',
] as const satisfies readonly ErrorCode[];

export const RoutePolicyExpectations = {
  post_auth_login: { auth: 'public', successStatus: 200, errors: publicCredentialErrors },
  post_oauth_token: { auth: 'public', successStatus: 200, errors: publicCredentialErrors },
  post_auth_refresh: { auth: 'refresh-cookie', successStatus: 200, errors: publicCredentialErrors },
  get_api_v1_sessions: { auth: 'access-token', successStatus: 200, errors: protectedCollectionErrors },
  get_api_v1_sessions_id: { auth: 'access-token', successStatus: 200, errors: protectedItemErrors },
  post_api_v1_sessions: {
    auth: 'access-token',
    successStatus: 202,
    errors: [...protectedCollectionErrors, 'SESSION_BUSY', 'IN_PROGRESS'],
  },
  post_api_v1_sessions_id_turns: {
    auth: 'access-token',
    successStatus: 202,
    errors: [...protectedItemErrors, 'SESSION_BUSY', 'IN_PROGRESS'],
  },
  get_api_v1_workspaces_wid_files_download: { auth: 'access-token', successStatus: 200, errors: protectedItemErrors },
  get_api_v1_workspaces_wid_files_stat: { auth: 'access-token', successStatus: 200, errors: protectedItemErrors },
  post_api_v1_workspaces_wid_files_upload: {
    auth: 'access-token',
    successStatus: 200,
    errors: [...protectedItemErrors, 'PAYLOAD_TOO_LARGE', 'STORAGE_QUOTA_EXCEEDED'],
  },
  get_api_v1_billing_account: { auth: 'access-token', successStatus: 200, errors: protectedCollectionErrors },
  post_api_v1_billing_byok: { auth: 'access-token', successStatus: 200, errors: protectedCollectionErrors },
  get_api_v1_scheduled_tasks: { auth: 'access-token', successStatus: 200, errors: protectedCollectionErrors },
  post_api_v1_scheduled_tasks: {
    auth: 'access-token',
    successStatus: 201,
    errors: [...protectedCollectionErrors, 'TASK_LIMIT_EXCEEDED'],
  },
} as const satisfies Record<string, RoutePolicyExpectation>;
