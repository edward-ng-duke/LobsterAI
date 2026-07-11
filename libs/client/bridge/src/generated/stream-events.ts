// Generated file. Do not edit.
export type paths = Record<string, never>;
export type webhooks = Record<string, never>;
export interface components {
    schemas: {
        /** apiStreamAbort */
        apiStreamAbort: {
            /** @constant */
            aborted: true;
            requestId: string;
        };
        /** apiStreamChunk */
        apiStreamChunk: {
            chunk: unknown;
            requestId: string;
        };
        /** apiStreamDone */
        apiStreamDone: {
            /** @constant */
            done: true;
            requestId: string;
        };
        /** apiStreamError */
        apiStreamError: {
            error: unknown;
            requestId: string;
        };
        /** asrAudioChunk */
        asrAudioChunk: {
            audioBase64: string;
            sequence: number;
        };
        /** asrError */
        asrError: {
            code: string;
            message: string;
        };
        /** asrFinal */
        asrFinal: {
            /** @constant */
            isFinal: true;
            text: string;
        };
        /** asrPartial */
        asrPartial: {
            /** @constant */
            isFinal: false;
            text: string;
        };
        /** authCallback */
        authCallback: {
            [key: string]: unknown;
        };
        /** clientControl */
        clientControl: {
            ticket: string;
            /** @constant */
            type: "auth";
        } | {
            sessionId: string;
            sinceSeq?: string;
            /** @constant */
            type: "subscribe";
        } | {
            sessionId: string;
            /** @constant */
            type: "unsubscribe";
        } | {
            /** @constant */
            channel: "files:changed";
            params: {
                path?: string;
                workspaceId: string;
            };
            sinceSeq?: string;
            /** @constant */
            type: "subscribeEvent";
        } | {
            /** @constant */
            channel: "files:changed";
            params: {
                path?: string;
                workspaceId: string;
            };
            /** @constant */
            type: "unsubscribeEvent";
        } | {
            ts: number;
            /** @constant */
            type: "ping";
        } | {
            channel?: string;
            seq: string;
            sessionId?: string;
            /** @constant */
            type: "ack";
        };
        /** complete */
        complete: {
            claudeSessionId: string | null;
            sessionId: string;
        };
        /** contextMaintenance */
        contextMaintenance: {
            active: boolean;
            sessionId: string;
        };
        /** contextUsage */
        contextUsage: {
            sessionId: string;
            usage: {
                [key: string]: unknown;
            };
        };
        /** error */
        error: {
            error: string;
            sessionId: string;
        };
        /** filesChanged */
        filesChanged: {
            /** @enum {string} */
            kind: "created" | "changed" | "deleted";
            relPath: string;
            workspaceId: string;
        };
        /** goal */
        goal: {
            goal: unknown;
            sessionId: string;
        };
        /** mcpChanged */
        mcpChanged: {
            [key: string]: unknown;
        };
        /** mediaStatusPollUpdate */
        mediaStatusPollUpdate: {
            resultKey?: string;
            /** Format: uri */
            resultUrl?: string;
            /** @enum {string} */
            status: "pending" | "running" | "succeeded" | "failed" | "canceled";
            taskId: string;
        };
        /** message */
        message: {
            beforeMessageId?: string;
            message: {
                [key: string]: unknown;
            };
            sessionId: string;
        };
        /** messageUpdate */
        messageUpdate: {
            content: string;
            messageId: string;
            metadata?: {
                [key: string]: unknown;
            };
            sessionId: string;
        };
        /** openclawEngineProgress */
        openclawEngineProgress: {
            [key: string]: unknown;
        };
        /** openSessionFromNotification */
        openSessionFromNotification: {
            [key: string]: unknown;
        };
        /** permission */
        permission: {
            request: {
                choices?: string[];
                question: string;
                requestId: string;
            } | {
                [key: string]: unknown;
            };
            sessionId: string;
        };
        /** permissionDismiss */
        permissionDismiss: {
            requestId: string;
        };
        /** pluginsInstallLog */
        pluginsInstallLog: {
            [key: string]: unknown;
        };
        /** quotaChanged */
        quotaChanged: {
            [key: string]: unknown;
        };
        /** sessionsChanged */
        sessionsChanged: {
            [key: string]: unknown;
        };
        /** sessionStatus */
        sessionStatus: {
            sessionId: string;
            /** @enum {string} */
            status: "idle" | "running" | "completed" | "error";
        };
        /** skillsChanged */
        skillsChanged: {
            [key: string]: unknown;
        };
        /** taskRefresh */
        taskRefresh: {
            [key: string]: unknown;
        };
        /** taskRun */
        taskRun: {
            [key: string]: unknown;
        };
        /** taskStatus */
        taskStatus: {
            [key: string]: unknown;
        };
    };
    responses: never;
    parameters: never;
    requestBodies: never;
    headers: never;
    pathItems: never;
}
export type $defs = Record<string, never>;
export type operations = Record<string, never>;

export type StreamEvent =
  | { type: 'clientControl'; data: components['schemas']['clientControl'] }
  | { type: 'message'; data: components['schemas']['message'] }
  | { type: 'messageUpdate'; data: components['schemas']['messageUpdate'] }
  | { type: 'sessionStatus'; data: components['schemas']['sessionStatus'] }
  | { type: 'contextUsage'; data: components['schemas']['contextUsage'] }
  | { type: 'goal'; data: components['schemas']['goal'] }
  | { type: 'contextMaintenance'; data: components['schemas']['contextMaintenance'] }
  | { type: 'permission'; data: components['schemas']['permission'] }
  | { type: 'permissionDismiss'; data: components['schemas']['permissionDismiss'] }
  | { type: 'complete'; data: components['schemas']['complete'] }
  | { type: 'error'; data: components['schemas']['error'] }
  | { type: 'apiStreamChunk'; data: components['schemas']['apiStreamChunk'] }
  | { type: 'apiStreamDone'; data: components['schemas']['apiStreamDone'] }
  | { type: 'apiStreamError'; data: components['schemas']['apiStreamError'] }
  | { type: 'apiStreamAbort'; data: components['schemas']['apiStreamAbort'] }
  | { type: 'sessionsChanged'; data: components['schemas']['sessionsChanged'] }
  | { type: 'mediaStatusPollUpdate'; data: components['schemas']['mediaStatusPollUpdate'] }
  | { type: 'openSessionFromNotification'; data: components['schemas']['openSessionFromNotification'] }
  | { type: 'filesChanged'; data: components['schemas']['filesChanged'] }
  | { type: 'skillsChanged'; data: components['schemas']['skillsChanged'] }
  | { type: 'mcpChanged'; data: components['schemas']['mcpChanged'] }
  | { type: 'quotaChanged'; data: components['schemas']['quotaChanged'] }
  | { type: 'authCallback'; data: components['schemas']['authCallback'] }
  | { type: 'pluginsInstallLog'; data: components['schemas']['pluginsInstallLog'] }
  | { type: 'openclawEngineProgress'; data: components['schemas']['openclawEngineProgress'] }
  | { type: 'taskStatus'; data: components['schemas']['taskStatus'] }
  | { type: 'taskRun'; data: components['schemas']['taskRun'] }
  | { type: 'taskRefresh'; data: components['schemas']['taskRefresh'] }
  | { type: 'asrAudioChunk'; data: components['schemas']['asrAudioChunk'] }
  | { type: 'asrPartial'; data: components['schemas']['asrPartial'] }
  | { type: 'asrFinal'; data: components['schemas']['asrFinal'] }
  | { type: 'asrError'; data: components['schemas']['asrError'] };
