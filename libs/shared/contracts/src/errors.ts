import { z } from 'zod';

const error = (httpStatus: number, retryable: boolean, userVisible: boolean, i18nKey: string) => ({
  httpStatus,
  retryable,
  userVisible,
  i18nKey,
});

export const ErrorRegistry = {
  VALIDATION_FAILED: error(400, false, true, 'errors.validationFailed'),
  UNAUTHENTICATED: error(401, false, true, 'errors.unauthenticated'),
  PERMISSION_DENIED: error(403, false, true, 'errors.permissionDenied'),
  NOT_FOUND: error(404, false, true, 'errors.notFound'),
  SESSION_BUSY: error(409, true, true, 'errors.sessionBusy'),
  IN_PROGRESS: error(409, true, true, 'errors.inProgress'),
  TICKET_EXPIRED: error(401, false, true, 'errors.ticketExpired'),
  TICKET_ALREADY_USED: error(409, false, true, 'errors.ticketAlreadyUsed'),
  PAYLOAD_TOO_LARGE: error(413, false, true, 'errors.payloadTooLarge'),
  QUOTA_EXCEEDED: error(402, false, true, 'errors.quotaExceeded'),
  TASK_LIMIT_EXCEEDED: error(403, false, true, 'errors.taskLimitExceeded'),
  NO_RUNNING_TASK_RUN: error(409, false, true, 'errors.noRunningTaskRun'),
  CANCEL_NOT_OWNED: error(409, true, false, 'errors.cancelNotOwned'),
  CANCEL_FAILED: error(500, true, true, 'errors.cancelFailed'),
  RATE_LIMITED: error(429, true, true, 'errors.rateLimited'),
  STORAGE_QUOTA_EXCEEDED: error(507, false, true, 'errors.storageQuotaExceeded'),
  UNSUPPORTED_EVENT_TYPE: error(422, false, false, 'errors.unsupportedEventType'),
  STREAM_GAP: error(409, true, true, 'errors.streamGap'),
  UNSUPPORTED_FEATURE: error(501, false, true, 'errors.unsupportedFeature'),
  INTERNAL_ERROR: error(500, true, true, 'errors.internalError'),
} as const;

export type ErrorCode = keyof typeof ErrorRegistry;
export const ErrorCodeSchema = z.enum(Object.keys(ErrorRegistry) as [ErrorCode, ...ErrorCode[]]);
