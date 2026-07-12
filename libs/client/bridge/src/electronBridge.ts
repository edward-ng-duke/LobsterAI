// Generated file. Do not edit.
/* eslint-disable @typescript-eslint/no-unused-vars -- bundled type declarations retain const companions */
declare const AgentLegacyIdentityCleanupSkipReason: {
	readonly NoAgentsMd: "no-agents-md";
	readonly NoLegacyBlock: "no-legacy-block";
	readonly LowConfidence: "low-confidence";
};
declare const AgentLegacyIdentityCleanupStatus: {
	readonly Cleaned: "cleaned";
	readonly Skipped: "skipped";
	readonly Failed: "failed";
};
declare const AppUpdateSource: {
	readonly Auto: "auto";
	readonly Manual: "manual";
};
declare const AppUpdateStatus: {
	readonly Idle: "idle";
	readonly Checking: "checking";
	readonly Available: "available";
	readonly Downloading: "downloading";
	readonly Ready: "ready";
	readonly Installing: "installing";
	readonly Error: "error";
};
declare const AsrLangType: {
	readonly ZhChs: "zh-CHS";
};
declare const BrowserDiagnosticStatus: {
	readonly Success: "success";
	readonly Warning: "warning";
	readonly Error: "error";
};
declare const BrowserDiagnosticStep: {
	readonly GatewayStatus: "gateway-status";
	readonly Profiles: "profiles";
	readonly BrowserStatus: "browser-status";
	readonly BrowserStart: "browser-start";
	readonly OpenTestPage: "open-test-page";
};
declare const BrowserRuntimeProfile: {
	readonly Managed: "openclaw";
	readonly User: "user";
};
declare const CoworkContextUsageFailureReason: {
	readonly Timeout: "timeout";
	readonly GatewayError: "gateway_error";
};
declare const CoworkContextUsageSource: {
	readonly Live: "live";
	readonly Cache: "cache";
	readonly Unavailable: "unavailable";
};
declare const CoworkForkMode: {
	readonly None: "none";
	readonly Conversation: "conversation";
	readonly Worktree: "worktree";
};
declare const CoworkGoalStatus: {
	readonly Active: "active";
	readonly Paused: "paused";
	readonly Blocked: "blocked";
	readonly UsageLimited: "usage_limited";
	readonly BudgetLimited: "budget_limited";
	readonly Complete: "complete";
};
declare const CoworkSelectedTextSource: {
	readonly AssistantMessage: "assistant";
	readonly ArtifactMarkdown: "artifact_markdown";
	readonly ArtifactText: "artifact_text";
};
declare const CoworkSessionStatusValue: {
	readonly Idle: "idle";
	readonly Running: "running";
	readonly Completed: "completed";
	readonly Error: "error";
};
declare const DEFINITIONS: readonly [
	{
		readonly id: "weixin";
		readonly label: "WeChat";
		readonly region: "china";
		readonly channel: "openclaw-weixin";
		readonly channelAliases: readonly [
		];
		readonly logo: "weixin.png";
		readonly guideUrl: "https://lobsterai.youdao.com/#/docs/lobsterai_im_bot_config_guide/%E5%BE%AE%E4%BF%A1-im-%E6%9C%BA%E5%99%A8%E4%BA%BA%E9%85%8D%E7%BD%AE";
	},
	{
		readonly id: "dingtalk";
		readonly label: "DingTalk";
		readonly region: "china";
		readonly channel: "dingtalk-connector";
		readonly channelAliases: readonly [
			"dingtalk"
		];
		readonly logo: "dingding.png";
		readonly guideUrl: "https://lobsterai.youdao.com/#/docs/lobsterai_im_bot_config_guide/%E9%92%89%E9%92%89-im-%E6%9C%BA%E5%99%A8%E4%BA%BA%E9%85%8D%E7%BD%AE";
	},
	{
		readonly id: "feishu";
		readonly label: "Feishu";
		readonly region: "china";
		readonly channel: "feishu";
		readonly channelAliases: readonly [
		];
		readonly logo: "feishu.png";
		readonly guideUrl: "https://lobsterai.youdao.com/#/docs/lobsterai_im_bot_config_guide/%E9%A3%9E%E4%B9%A6-im-%E6%9C%BA%E5%99%A8%E4%BA%BA%E9%85%8D%E7%BD%AE";
	},
	{
		readonly id: "wecom";
		readonly label: "WeCom";
		readonly region: "china";
		readonly channel: "wecom";
		readonly channelAliases: readonly [
			"wecom-openclaw-plugin"
		];
		readonly logo: "wecom.png";
		readonly guideUrl: "https://lobsterai.youdao.com/#/docs/lobsterai_im_bot_config_guide/%E4%BC%81%E4%B8%9A%E5%BE%AE%E4%BF%A1%E6%9C%BA%E5%99%A8%E4%BA%BA%E9%85%8D%E7%BD%AE";
	},
	{
		readonly id: "qq";
		readonly label: "QQ";
		readonly region: "china";
		readonly channel: "qqbot";
		readonly channelAliases: readonly [
		];
		readonly logo: "qq_bot.jpeg";
		readonly guideUrl: "https://lobsterai.youdao.com/#/docs/lobsterai_im_bot_config_guide/qqqq-bot";
	},
	{
		readonly id: "nim";
		readonly label: "NIM";
		readonly region: "china";
		readonly channel: "nim";
		readonly channelAliases: readonly [
		];
		readonly logo: "nim.png";
		readonly guideUrl: "";
	},
	{
		readonly id: "netease-bee";
		readonly label: "NetEase Bee";
		readonly region: "china";
		readonly channel: "netease-bee";
		readonly channelAliases: readonly [
		];
		readonly logo: "netease-bee.png";
		readonly guideUrl: "";
	},
	{
		readonly id: "popo";
		readonly label: "POPO";
		readonly region: "china";
		readonly channel: "moltbot-popo";
		readonly channelAliases: readonly [
			"popo"
		];
		readonly logo: "popo.png";
		readonly guideUrl: "";
	},
	{
		readonly id: "telegram";
		readonly label: "Telegram";
		readonly region: "global";
		readonly channel: "telegram";
		readonly channelAliases: readonly [
		];
		readonly logo: "telegram.svg";
		readonly guideUrl: "https://lobsterai.youdao.com/#/en/docs/lobsterai_im_bot_config_guide/telegram-bot-configuration";
	},
	{
		readonly id: "discord";
		readonly label: "Discord";
		readonly region: "global";
		readonly channel: "discord";
		readonly channelAliases: readonly [
		];
		readonly logo: "discord.svg";
		readonly guideUrl: "https://lobsterai.youdao.com/#/en/docs/lobsterai_im_bot_config_guide/discord-bot-configuration";
	},
	{
		readonly id: "email";
		readonly label: "Email";
		readonly region: "china";
		readonly channel: "email";
		readonly channelAliases: readonly [
			"clawemail",
			"clawemail-email"
		];
		readonly logo: "email.svg";
		readonly guideUrl: "";
	}
];
declare const DataMigrationRestoreStatus: {
	readonly Success: "success";
	readonly Failed: "failed";
};
declare const DeliveryMode: {
	readonly None: "none";
	readonly Announce: "announce";
	readonly Webhook: "webhook";
};
declare const HtmlShareAccessMode: {
	readonly Code: "code";
	readonly Public: "public";
};
declare const HtmlShareDisabledSource: {
	readonly User: "user";
	readonly Admin: "admin";
	readonly Moderation: "moderation";
	readonly ActiveLimit: "active_limit";
	readonly System: "system";
};
declare const HtmlShareSourceType: {
	readonly HtmlFile: "html_file";
	readonly ImageFile: "image_file";
	readonly SvgFile: "svg_file";
	readonly DocumentFile: "document_file";
	readonly MarkdownFile: "markdown_file";
	readonly MermaidFile: "mermaid_file";
	readonly NodeServiceDeployment: "node_service_deployment";
	readonly StaticServiceDeployment: "static_service_deployment";
};
declare const HtmlShareStatus: {
	readonly Live: "live";
	readonly Disabled: "disabled";
	readonly Failed: "failed";
};
declare const KitReferenceKind: {
	readonly Kit: "kit";
};
declare const KitReferenceSource: {
	readonly LobsterAiKits: "lobsterai-kits";
};
declare const OpenClawEnginePhase: {
	readonly NotInstalled: "not_installed";
	readonly Installing: "installing";
	readonly Ready: "ready";
	readonly Starting: "starting";
	readonly Running: "running";
	readonly Error: "error";
};
declare const OpenClawGatewayRepairErrorCode: {
	readonly Busy: "busy";
	readonly ConfigApplyPending: "config_apply_pending";
};
declare const OpenClawSessionResponseUsage: {
	readonly Off: "off";
	readonly Tokens: "tokens";
	readonly Full: "full";
};
declare const OpenClawSessionSendPolicy: {
	readonly Allow: "allow";
	readonly Deny: "deny";
};
declare const SessionTarget: {
	readonly Main: "main";
	readonly Isolated: "isolated";
};
declare const ShareDeploymentCandidateSource: {
	readonly Process: "process";
	readonly ProcessCwd: "process_cwd";
	readonly ArtifactMetadata: "artifact_metadata";
	readonly TextLabeledPath: "text_labeled_path";
	readonly TextFileLink: "text_file_link";
	readonly TextCdCommand: "text_cd_command";
	readonly TextCommonParent: "text_common_parent";
	readonly Workspace: "workspace";
	readonly WorkspaceChild: "workspace_child";
	readonly Cache: "cache";
	readonly Manual: "manual";
};
declare const ShareDeploymentKind: {
	readonly NodeService: "node_service";
	readonly StaticSite: "static_site";
};
declare const ShareDeploymentPackageManager: {
	readonly Npm: "npm";
	readonly Pnpm: "pnpm";
	readonly Yarn: "yarn";
	readonly Unknown: "unknown";
};
declare const ShareDeploymentStatus: {
	readonly Queued: "queued";
	readonly Deploying: "deploying";
	readonly Live: "live";
	readonly DeployFailed: "deploy_failed";
	readonly Expired: "expired";
	readonly Stopped: "stopped";
};
declare const ShellOpenFailureReason: {
	readonly NotFound: "not_found";
	readonly PermissionDenied: "permission_denied";
	readonly OpenFailed: "open_failed";
	readonly Unknown: "unknown";
};
declare const TaskStatus: {
	readonly Success: "success";
	readonly Error: "error";
	readonly Skipped: "skipped";
	readonly Running: "running";
};
declare const WakeMode: {
	readonly Now: "now";
	readonly NextHeartbeat: "next-heartbeat";
};
export type ElectronBridge = IElectronAPI;
interface Agent {
	id: string;
	name: string;
	description: string;
	systemPrompt: string;
	identity: string;
	model: string;
	workingDirectory: string;
	icon: string;
	skillIds: string[];
	enabled: boolean;
	pinned: boolean;
	pinOrder?: number | null;
	isDefault: boolean;
	source: AgentSource;
	presetId: string;
	createdAt: number;
	updatedAt: number;
}
interface AgentTurnPayload {
	kind: "agentTurn";
	message: string;
	timeoutSeconds?: number;
	model?: string;
}
interface ApiResponse {
	ok: boolean;
	status: number;
	statusText: string;
	headers: Record<string, string>;
	data: any;
	error?: string;
}
interface ApiStreamResponse {
	ok: boolean;
	status: number;
	statusText: string;
	error?: string;
}
interface AppUpdateCheckResult {
	success: boolean;
	state: AppUpdateRuntimeState;
	updateFound: boolean;
	error?: string;
}
interface AppUpdateDownloadProgress {
	received: number;
	total: number | undefined;
	percent: number | undefined;
	speed: number | undefined;
}
interface AppUpdateInfo {
	latestVersion: string;
	date: string;
	changeLog: {
		zh: ChangeLogEntry;
		en: ChangeLogEntry;
	};
	url: string;
}
interface AppUpdateRuntimeState {
	status: AppUpdateStatus;
	source: AppUpdateSource | null;
	info: AppUpdateInfo | null;
	progress: AppUpdateDownloadProgress | null;
	readyFilePath: string | null;
	readyFileHash: string | null;
	errorMessage: string | null;
	/** True when a previous install attempt quit the app but never completed. */
	installIncomplete?: boolean;
}
interface AsrRealtimeSessionData {
	requestId: string;
	wsUrl: string;
	expiresInSeconds: number;
	chunkIntervalMillis: number;
	maxSessionSeconds: number;
	maxConcurrentSessions: number;
	usedSecondsToday: number;
	remainingSecondsToday: number;
	limitSecondsToday: number;
}
interface AsrRealtimeSessionRequest {
	langType?: AsrLangType;
}
interface AuthQuota {
	planName: string;
	subscriptionStatus: string;
	creditsLimit: number;
	creditsUsed: number;
	creditsRemaining: number;
	hasPaidCredits?: boolean;
}
interface BrowserDiagnosticResult {
	success: boolean;
	steps: BrowserDiagnosticResultStep[];
	error?: string;
}
interface BrowserDiagnosticResultStep {
	step: BrowserDiagnosticStep;
	status: BrowserDiagnosticStatus;
	message: string;
	details?: string;
}
interface ChangeLogEntry {
	title: string;
	content: string[];
}
interface ClientBannerData {
	id: number;
	placement: string;
	activityDescription: string;
	weight?: number;
	status?: number;
	linkUrl: string;
	imageUrl: string;
	imageWidth?: number;
	imageHeight?: number;
	updatedAt?: string;
}
interface CoworkApiConfig {
	apiKey: string;
	baseURL: string;
	model: string;
	apiType?: "anthropic" | "openai";
}
interface CoworkConfig {
	workingDirectory: string;
	systemPrompt: string;
	executionMode: "auto" | "local" | "sandbox";
	agentEngine: "openclaw";
	memoryEnabled: boolean;
	memoryImplicitUpdateEnabled: boolean;
	memoryLlmJudgeEnabled: boolean;
	memoryGuardLevel: "strict" | "standard" | "relaxed";
	memoryUserMemoriesMaxItems: number;
	skipMissedJobs: boolean;
	openClawHeartbeatEnabled: boolean;
	embeddingEnabled: boolean;
	embeddingProvider: string;
	embeddingModel: string;
	embeddingLocalModelPath: string;
	embeddingVectorWeight: number;
	embeddingRemoteBaseUrl: string;
	embeddingRemoteApiKey: string;
	openClawSessionPolicy: OpenClawSessionPolicyConfig;
}
interface CoworkContextUsage {
	sessionId: string;
	sessionKey?: string;
	usedTokens?: number;
	contextTokens?: number;
	percent?: number;
	compactionCount?: number;
	status: "unknown" | "normal" | "warning" | "danger" | "compacting";
	latestCompactionCheckpointId?: string;
	latestCompactionReason?: string;
	latestCompactionCreatedAt?: number;
	model?: string;
	updatedAt: number;
}
interface CoworkGoal {
	id: string;
	objective: string;
	status: CoworkGoalStatus;
	createdAt: number;
	updatedAt: number;
	tokenStart?: number;
	tokenStartFresh?: boolean;
	tokensUsed: number;
	tokenBudget?: number;
	continuationTurns?: number;
	lastStatusNote?: string;
	pausedAt?: number;
	blockedAt?: number;
	completedAt?: number;
	usageLimitedAt?: number;
	budgetLimitedAt?: number;
}
interface CoworkMemoryStats {
	total: number;
	created: number;
	stale: number;
	deleted: number;
	explicit: number;
	implicit: number;
}
interface CoworkMessage {
	id: string;
	type: CoworkMessageType;
	content: string;
	timestamp: number;
	metadata?: CoworkMessageMetadata;
}
interface CoworkMessage$1 {
	id: string;
	type: "user" | "assistant" | "tool_use" | "tool_result" | "system";
	content: string;
	timestamp: number;
	metadata?: Record<string, unknown>;
}
interface CoworkMessageMetadata {
	toolName?: string;
	toolInput?: Record<string, unknown>;
	toolResult?: string;
	toolUseId?: string | null;
	error?: string;
	isError?: boolean;
	isStreaming?: boolean;
	isFinal?: boolean;
	isThinking?: boolean;
	skillIds?: string[];
	kitIds?: string[];
	kitReferences?: KitReference[];
	resolvedKitCapabilities?: ResolvedKitCapabilities;
	imageAttachments?: CoworkImageAttachment[];
	imageAttachmentPreviews?: CoworkImageAttachmentPreview[];
	usage?: {
		inputTokens?: number;
		outputTokens?: number;
		cacheReadTokens?: number;
		cacheWriteTokens?: number;
	};
	contextPercent?: number;
	model?: string;
	agentName?: string;
	selectedTextSnippets?: CoworkSelectedTextSnippet[];
	goalSetting?: {
		action: "start" | "create" | "set";
		objective: string;
	};
	localMediaAttachments?: Array<{
		localPath: string;
		mimeType?: string;
		name?: string;
	}>;
	[key: string]: unknown;
}
interface CoworkMessageRailIndexItem {
	messageId: string;
	type: "user" | "assistant";
	sequence: number | null;
	messageOffset: number;
	timestamp: number;
	preview: string;
	contentLen: number;
}
interface CoworkPermissionRequest {
	sessionId: string;
	toolName: string;
	toolInput: Record<string, unknown>;
	requestId: string;
	toolUseId?: string | null;
}
interface CoworkSelectedTextSnippet {
	id: string;
	text: string;
	sourceMessageId?: string;
	sourceMessageType?: CoworkSelectedTextSource;
	sourceId?: string;
	sourceType?: CoworkSelectedTextSource;
	sourceTitle?: string;
	sourcePath?: string;
	artifactId?: string;
	createdAt: number;
	startOffset?: number;
	endOffset?: number;
}
interface CoworkSession {
	id: string;
	title: string;
	claudeSessionId: string | null;
	status: CoworkSessionStatus;
	pinned: boolean;
	pinOrder?: number | null;
	cwd: string;
	systemPrompt: string;
	modelOverride: string;
	executionMode: CoworkExecutionMode;
	activeSkillIds: string[];
	activeKitIds?: string[];
	agentId: string;
	messages: CoworkMessage[];
	/** Offset of the first loaded message in the full message history. 0 means loaded from the beginning. */
	messagesOffset: number;
	/** Total number of messages stored for this session. */
	totalMessages: number;
	parentSessionId?: string | null;
	forkedFromMessageId?: string | null;
	forkedAt?: number | null;
	forkMode?: CoworkForkMode;
	forkWorkspacePath?: string | null;
	forkGitBranch?: string | null;
	forkGitBaseRef?: string | null;
	goal?: CoworkGoal | null;
	createdAt: number;
	updatedAt: number;
}
interface CoworkSession$1 {
	id: string;
	title: string;
	claudeSessionId: string | null;
	status: "idle" | "running" | "completed" | "error";
	pinned: boolean;
	pinOrder?: number | null;
	cwd: string;
	systemPrompt: string;
	modelOverride: string;
	executionMode: "auto" | "local" | "sandbox";
	activeSkillIds: string[];
	agentId: string;
	messages: CoworkMessage$1[];
	messagesOffset: number;
	totalMessages: number;
	parentSessionId?: string | null;
	forkedFromMessageId?: string | null;
	forkedAt?: number | null;
	forkMode?: "none" | "conversation" | "worktree";
	forkWorkspacePath?: string | null;
	forkGitBranch?: string | null;
	forkGitBaseRef?: string | null;
	createdAt: number;
	updatedAt: number;
}
interface CoworkSessionSummary {
	id: string;
	title: string;
	status: "idle" | "running" | "completed" | "error";
	pinned: boolean;
	pinOrder?: number | null;
	agentId?: string;
	parentSessionId?: string | null;
	forkedAt?: number | null;
	forkMode?: "none" | "conversation" | "worktree";
	createdAt: number;
	updatedAt: number;
}
interface CoworkUserMemoryEntry {
	id: string;
	text: string;
	section?: string;
}
interface CreditItem {
	type: "subscription" | "boost" | "free" | "bonus" | "invitation";
	label: string;
	labelEn: string;
	creditsRemaining: number;
	expiresAt: string | null;
}
interface CreditsResetCampaignStatusData {
	enabled: boolean;
	active: boolean;
	registeredEligible: boolean;
	participated: boolean;
	participationType: string | null;
	identity: "subscription" | "free";
	availableResetCount: number;
	availablePromoSubscriptionCount: number;
	promoPlanId: number;
	promoAmount: number;
	campaignCode: string;
	startAt: string;
	endAt: string;
	registeredBefore: string;
	reason: string;
}
interface DataMigrationBackupResult {
	success: boolean;
	canceled?: boolean;
	path?: string;
	sizeBytes?: number;
	error?: string;
}
interface DataMigrationLastRestoreResponse {
	success: boolean;
	result?: DataMigrationLastRestoreResult | null;
	error?: string;
}
interface DataMigrationLastRestoreResult {
	status: DataMigrationRestoreStatus;
	archivePath: string;
	rollbackPath?: string;
	restoredAt: string;
	error?: string;
}
interface DataMigrationRestoreScheduleResult {
	success: boolean;
	canceled?: boolean;
	scheduledRestart?: boolean;
	rollbackPath?: string;
	error?: string;
}
interface DingTalkGatewayStatus {
	connected: boolean;
	startedAt: number | null;
	lastError: string | null;
	lastInboundAt: number | null;
	lastOutboundAt: number | null;
}
interface DingTalkInstanceConfig extends DingTalkOpenClawConfig {
	instanceId: string;
	instanceName: string;
}
interface DingTalkInstanceStatus extends DingTalkGatewayStatus {
	instanceId: string;
	instanceName: string;
}
interface DingTalkMultiInstanceConfig {
	instances: DingTalkInstanceConfig[];
}
interface DingTalkMultiInstanceStatus {
	instances: DingTalkInstanceStatus[];
}
interface DingTalkOpenClawConfig {
	enabled: boolean;
	clientId: string;
	clientSecret: string;
	dmPolicy: "open" | "pairing" | "allowlist";
	allowFrom: string[];
	groupPolicy: "open" | "allowlist";
	sessionTimeout: number;
	separateSessionByConversation: boolean;
	groupSessionScope: "group" | "group_sender";
	sharedMemoryAcrossConversations: boolean;
	gatewayBaseUrl: string;
	debug: boolean;
}
interface DiscordGatewayStatus {
	connected: boolean;
	starting: boolean;
	startedAt: number | null;
	lastError: string | null;
	botUsername: string | null;
	lastInboundAt: number | null;
	lastOutboundAt: number | null;
}
interface DiscordInstanceConfig extends DiscordOpenClawConfig {
	instanceId: string;
	instanceName: string;
}
interface DiscordInstanceStatus extends DiscordGatewayStatus {
	instanceId: string;
	instanceName: string;
}
interface DiscordMultiInstanceConfig {
	instances: DiscordInstanceConfig[];
}
interface DiscordMultiInstanceStatus {
	instances: DiscordInstanceStatus[];
}
interface DiscordOpenClawConfig {
	enabled: boolean;
	botToken: string;
	dmPolicy: "pairing" | "allowlist" | "open" | "disabled";
	allowFrom: string[];
	groupPolicy: "allowlist" | "open" | "disabled";
	groupAllowFrom: string[];
	guilds: Record<string, DiscordOpenClawGuildConfig>;
	historyLimit: number;
	streaming: "off" | "partial" | "block" | "progress";
	mediaMaxMb: number;
	proxy: string;
	debug: boolean;
}
interface DiscordOpenClawGuildConfig {
	requireMention?: boolean;
	allowFrom?: string[];
	systemPrompt?: string;
}
interface EmailConnectivityCheck {
	code: EmailConnectivityCheckCode;
	level: EmailConnectivityCheckLevel;
	message: string;
	durationMs: number;
}
interface EmailConnectivityTestResult {
	testedAt: number;
	verdict: EmailConnectivityVerdict;
	checks: EmailConnectivityCheck[];
}
interface EmailInstanceConfig {
	instanceId: string;
	instanceName: string;
	enabled: boolean;
	transport: "imap" | "ws";
	email: string;
	password?: string;
	apiKey?: string;
	agentId: string;
	imapHost?: string;
	imapPort?: number;
	smtpHost?: string;
	smtpPort?: number;
	allowFrom?: string[];
	replyMode?: "immediate" | "accumulated" | "complete";
	replyTo?: "sender" | "all";
	a2aEnabled?: boolean;
	a2aAgentDomains?: string[];
	a2aMaxPingPongTurns?: number;
}
interface EmailInstanceStatus {
	instanceId: string;
	instanceName: string;
	connected: boolean;
	startedAt: number | null;
	lastError: string | null;
	email: string | null;
	transport: "imap" | "ws" | null;
	lastInboundAt: number | null;
	lastOutboundAt: number | null;
}
interface EmailMultiInstanceConfig {
	instances: EmailInstanceConfig[];
}
interface EmailMultiInstanceStatus {
	instances: EmailInstanceStatus[];
}
interface EmailSkillAccountConfig {
	id: string;
	name: string;
	enabled: boolean;
	provider?: string;
	email: string;
	password?: string;
	imapHost?: string;
	imapPort?: number;
	imapTls?: boolean;
	imapRejectUnauthorized?: boolean;
	smtpHost?: string;
	smtpPort?: number;
	smtpSecure?: boolean;
	smtpRejectUnauthorized?: boolean;
	smtpFrom?: string;
	mailbox?: string;
	requireSendConfirmation?: boolean;
}
interface EmailSkillAccountsConfig {
	version: 1;
	defaultAccountId: string;
	accounts: EmailSkillAccountConfig[];
}
interface FeishuGatewayStatus {
	connected: boolean;
	startedAt: string | null;
	botOpenId: string | null;
	error: string | null;
	lastInboundAt: number | null;
	lastOutboundAt: number | null;
}
interface FeishuInstanceConfig extends FeishuOpenClawConfig {
	instanceId: string;
	instanceName: string;
}
interface FeishuInstanceStatus extends FeishuGatewayStatus {
	instanceId: string;
	instanceName: string;
}
interface FeishuMultiInstanceConfig {
	instances: FeishuInstanceConfig[];
}
interface FeishuMultiInstanceStatus {
	instances: FeishuInstanceStatus[];
}
interface FeishuOpenClawBlockStreamingCoalesceConfig {
	minChars?: number;
	maxChars?: number;
	idleMs?: number;
}
interface FeishuOpenClawConfig {
	enabled: boolean;
	appId: string;
	appSecret: string;
	domain: "feishu" | "lark" | string;
	dmPolicy: "pairing" | "allowlist" | "open" | "disabled";
	allowFrom: string[];
	groupPolicy: "allowlist" | "open" | "disabled";
	groupAllowFrom: string[];
	groups: Record<string, FeishuOpenClawGroupConfig>;
	historyLimit: number;
	streaming: boolean;
	replyMode: "auto" | "static" | "streaming";
	blockStreaming: boolean;
	footer: FeishuOpenClawFooterConfig;
	blockStreamingCoalesce?: FeishuOpenClawBlockStreamingCoalesceConfig;
	mediaMaxMb: number;
	debug: boolean;
}
interface FeishuOpenClawFooterConfig {
	status?: boolean;
	elapsed?: boolean;
}
interface FeishuOpenClawGroupConfig {
	requireMention?: boolean;
	allowFrom?: string[];
	systemPrompt?: string;
}
interface HtmlShareResult {
	success: boolean;
	shareId?: string;
	url?: string;
	accessMode?: HtmlShareAccessMode;
	shareCode?: string;
	shareCodeUnavailable?: boolean;
	status?: HtmlShareStatus;
	moderationStatus?: string;
	updatedAt?: string;
	contentUpdatedAt?: string;
	disabledAt?: string | null;
	disabledReason?: string | null;
	disabledSource?: HtmlShareDisabledSource | null;
	restoredByUpdate?: boolean;
	error?: string;
	code?: number;
	warnings?: string[];
}
interface IElectronAPI {
	platform: string;
	arch: string;
	store: {
		get: (key: string) => Promise<any>;
		set: (key: string, value: any) => Promise<void>;
		remove: (key: string) => Promise<void>;
	};
	skills: {
		list: () => Promise<{
			success: boolean;
			skills?: Skill[];
			error?: string;
		}>;
		setEnabled: (options: {
			id: string;
			enabled: boolean;
		}) => Promise<{
			success: boolean;
			skills?: Skill[];
			error?: string;
		}>;
		delete: (id: string) => Promise<{
			success: boolean;
			skills?: Skill[];
			error?: string;
		}>;
		download: (source: string) => Promise<{
			success: boolean;
			skills?: Skill[];
			error?: string;
			auditReport?: any;
			pendingInstallId?: string;
		}>;
		upgrade: (skillId: string, downloadUrl: string) => Promise<{
			success: boolean;
			skills?: Skill[];
			error?: string;
			auditReport?: any;
			pendingInstallId?: string;
		}>;
		confirmInstall: (pendingId: string, action: string) => Promise<{
			success: boolean;
			skills?: Skill[];
			error?: string;
		}>;
		getRoot: () => Promise<{
			success: boolean;
			path?: string;
			error?: string;
		}>;
		autoRoutingPrompt: () => Promise<{
			success: boolean;
			prompt?: string | null;
			error?: string;
		}>;
		getConfig: (skillId: string) => Promise<{
			success: boolean;
			config?: Record<string, string>;
			error?: string;
		}>;
		setConfig: (skillId: string, config: Record<string, string>) => Promise<{
			success: boolean;
			error?: string;
		}>;
		getEmailAccountsConfig: (skillId: string) => Promise<{
			success: boolean;
			config?: EmailSkillAccountsConfig;
			error?: string;
		}>;
		setEmailAccountsConfig: (skillId: string, config: EmailSkillAccountsConfig) => Promise<{
			success: boolean;
			error?: string;
		}>;
		testEmailAccountConnectivity: (skillId: string, account: EmailSkillAccountConfig) => Promise<{
			success: boolean;
			result?: EmailConnectivityTestResult;
			error?: string;
		}>;
		testEmailConnectivity: (skillId: string, config: Record<string, string>) => Promise<{
			success: boolean;
			result?: EmailConnectivityTestResult;
			error?: string;
		}>;
		fetchMarketplace: () => Promise<{
			success: boolean;
			data?: string;
			error?: string;
		}>;
		detectFromOpenClaw: () => Promise<{
			skills: Array<{
				name: string;
				description: string;
				skillKey: string;
				baseDir: string;
			}>;
			error?: string;
		}>;
		syncFromOpenClaw: () => Promise<{
			synced: string[];
			error?: string;
		}>;
		refreshPluginSkillIds: () => Promise<{
			success: boolean;
			pluginSkillIds?: string[];
			error?: string;
		}>;
		onChanged: (callback: () => void) => () => void;
	};
	mcp: {
		list: () => Promise<{
			success: boolean;
			servers?: McpServerConfigIPC[];
			error?: string;
		}>;
		create: (data: any) => Promise<{
			success: boolean;
			servers?: McpServerConfigIPC[];
			error?: string;
		}>;
		update: (id: string, data: any) => Promise<{
			success: boolean;
			servers?: McpServerConfigIPC[];
			error?: string;
		}>;
		delete: (id: string) => Promise<{
			success: boolean;
			servers?: McpServerConfigIPC[];
			error?: string;
		}>;
		deleteByRegistryId: (registryId: string) => Promise<{
			success: boolean;
			servers?: McpServerConfigIPC[];
			error?: string;
		}>;
		setEnabled: (options: {
			id: string;
			enabled: boolean;
		}) => Promise<{
			success: boolean;
			servers?: McpServerConfigIPC[];
			error?: string;
		}>;
		setEnabledByRegistryId: (options: {
			registryId: string;
			enabled: boolean;
		}) => Promise<{
			success: boolean;
			servers?: McpServerConfigIPC[];
			error?: string;
		}>;
		retryLaunchResolution: (id: string) => Promise<{
			success: boolean;
			servers?: McpServerConfigIPC[];
			error?: string;
		}>;
		fetchMarketplace: () => Promise<{
			success: boolean;
			data?: McpMarketplaceData;
			error?: string;
		}>;
		connectQichacha: () => Promise<{
			success: boolean;
			servers?: McpServerConfigIPC[];
			error?: string;
		}>;
		onChanged: (callback: () => void) => () => void;
	};
	kits: {
		fetchStore: () => Promise<{
			success: boolean;
			data?: string;
			error?: string;
		}>;
		install: (params: {
			kitId: string;
			bundleUrl: string;
			version: string;
			skillListIds: string[];
			skillList?: KitSkillMetadata[];
			mcpServers?: unknown[] | null;
			connectors?: unknown[] | null;
		}) => Promise<{
			success: boolean;
			skillIds?: string[];
			error?: string;
		}>;
		uninstall: (kitId: string) => Promise<{
			success: boolean;
			error?: string;
		}>;
		listInstalled: () => Promise<{
			success: boolean;
			installed?: Record<string, InstalledKitRecord>;
			error?: string;
		}>;
	};
	agents: {
		list: () => Promise<Agent[]>;
		get: (id: string) => Promise<Agent | null>;
		create: (request: {
			id?: string;
			name: string;
			description?: string;
			systemPrompt?: string;
			identity?: string;
			model?: string;
			workingDirectory?: string;
			icon?: string;
			skillIds?: string[];
			source?: string;
			presetId?: string;
		}) => Promise<Agent>;
		update: (id: string, updates: {
			name?: string;
			description?: string;
			systemPrompt?: string;
			identity?: string;
			model?: string;
			workingDirectory?: string;
			icon?: string;
			skillIds?: string[];
			enabled?: boolean;
			pinned?: boolean;
		}) => Promise<Agent>;
		cleanupLegacyIdentityBlock: (id: string) => Promise<AgentLegacyIdentityCleanupResult>;
		delete: (id: string) => Promise<boolean>;
		presets: () => Promise<PresetAgent[]>;
		presetTemplates: () => Promise<PresetAgent[]>;
		addPreset: (presetId: string) => Promise<Agent>;
	};
	api: {
		fetch: (options: {
			url: string;
			method: string;
			headers: Record<string, string>;
			body?: string;
		}) => Promise<ApiResponse>;
		stream: (options: {
			url: string;
			method: string;
			headers: Record<string, string>;
			body?: string;
			requestId: string;
		}) => Promise<ApiStreamResponse>;
		cancelStream: (requestId: string) => Promise<boolean>;
		onStreamData: (requestId: string, callback: (chunk: string) => void) => () => void;
		onStreamDone: (requestId: string, callback: () => void) => () => void;
		onStreamError: (requestId: string, callback: (error: string) => void) => () => void;
		onStreamAbort: (requestId: string, callback: () => void) => () => void;
	};
	getApiConfig: () => Promise<CoworkApiConfig | null>;
	checkApiConfig: (options?: {
		probeModel?: boolean;
	}) => Promise<{
		hasConfig: boolean;
		config: CoworkApiConfig | null;
		error?: string;
	}>;
	saveApiConfig: (config: CoworkApiConfig) => Promise<{
		success: boolean;
		error?: string;
	}>;
	generateSessionTitle: (userInput: string | null) => Promise<string>;
	getRecentCwds: (limit?: number) => Promise<string[]>;
	openclaw: {
		engine: {
			getStatus: () => Promise<{
				success: boolean;
				status?: OpenClawEngineStatus;
				error?: string;
			}>;
			install: () => Promise<{
				success: boolean;
				status?: OpenClawEngineStatus;
				error?: string;
			}>;
			retryInstall: () => Promise<{
				success: boolean;
				status?: OpenClawEngineStatus;
				error?: string;
			}>;
			restartGateway: () => Promise<{
				success: boolean;
				status?: OpenClawEngineStatus;
				error?: string;
			}>;
			repairGatewayState: () => Promise<OpenClawGatewayRepairResult>;
			onProgress: (callback: (status: OpenClawEngineStatus) => void) => () => void;
		};
		sessionPolicy: {
			get: () => Promise<{
				success: boolean;
				config?: OpenClawSessionPolicyConfig;
				error?: string;
			}>;
			set: (config: OpenClawSessionPolicyConfig) => Promise<{
				success: boolean;
				config?: OpenClawSessionPolicyConfig;
				error?: string;
			}>;
		};
		session: {
			patch: (options: {
				sessionId: string;
				patch: OpenClawSessionPatch;
			}) => Promise<{
				success: boolean;
				session?: CoworkSession$1;
				error?: string;
			}>;
		};
		browser: {
			getStatus: (options?: {
				profile?: BrowserRuntimeProfile;
			}) => Promise<{
				success: boolean;
				status?: Record<string, unknown>;
				error?: string;
			}>;
			listProfiles: () => Promise<{
				success: boolean;
				profiles?: unknown[];
				error?: string;
			}>;
			test: (options?: {
				profile?: BrowserRuntimeProfile;
			}) => Promise<BrowserDiagnosticResult>;
			resetProfile: (options?: {
				profile?: BrowserRuntimeProfile;
			}) => Promise<{
				success: boolean;
				result?: Record<string, unknown>;
				error?: string;
			}>;
		};
		dataMigration: {
			backup: () => Promise<DataMigrationBackupResult>;
			restore: () => Promise<DataMigrationRestoreScheduleResult>;
			getLastRestoreResult: () => Promise<DataMigrationLastRestoreResponse>;
		};
	};
	ipcRenderer: {
		send: (channel: string, ...args: any[]) => void;
		on: (channel: string, func: (...args: any[]) => void) => () => void;
	};
	window: {
		minimize: () => void;
		toggleMaximize: () => void;
		close: () => void;
		isMaximized: () => Promise<boolean>;
		showSystemMenu: (position: {
			x: number;
			y: number;
		}) => void;
		onStateChanged: (callback: (state: WindowState) => void) => () => void;
	};
	cowork: {
		startSession: (options: {
			prompt: string;
			cwd?: string;
			systemPrompt?: string;
			title?: string;
			activeSkillIds?: string[];
			runtimeSkillIds?: string[];
			kitIds?: string[];
			kitReferences?: KitReference[];
			resolvedKitCapabilities?: ResolvedKitCapabilities;
			selectedTextSnippets?: Array<{
				id: string;
				text: string;
				sourceMessageId?: string;
				sourceMessageType?: "assistant" | "artifact_markdown" | "artifact_text";
				sourceId?: string;
				sourceType?: "assistant" | "artifact_markdown" | "artifact_text";
				sourceTitle?: string;
				sourcePath?: string;
				artifactId?: string;
				createdAt: number;
				startOffset?: number;
				endOffset?: number;
			}>;
			agentId?: string;
			imageAttachments?: Array<{
				name: string;
				mimeType: string;
				base64Data: string;
				sizeBytes?: number;
				localPath?: string;
				previewMimeType?: string;
				previewBase64Data?: string;
			}>;
			mediaSelection?: {
				mode: string;
				modelId?: string;
				modelName?: string;
				imageModelId?: string;
				videoModelId?: string;
			};
			mediaReferences?: Array<{
				token: string;
				mediaType: string;
				index: number;
				fileId: string;
				fileName: string;
				mimeType: string;
				localPath?: string;
				remoteUrl?: string;
				dataUrl?: string;
				role?: string;
			}>;
		}) => Promise<{
			success: boolean;
			session?: CoworkSession$1;
			error?: string;
			code?: string;
			engineStatus?: OpenClawEngineStatus;
		}>;
		continueSession: (options: {
			sessionId: string;
			prompt: string;
			systemPrompt?: string;
			activeSkillIds?: string[];
			runtimeSkillIds?: string[];
			kitIds?: string[];
			kitReferences?: KitReference[];
			resolvedKitCapabilities?: ResolvedKitCapabilities;
			selectedTextSnippets?: Array<{
				id: string;
				text: string;
				sourceMessageId?: string;
				sourceMessageType?: "assistant" | "artifact_markdown" | "artifact_text";
				sourceId?: string;
				sourceType?: "assistant" | "artifact_markdown" | "artifact_text";
				sourceTitle?: string;
				sourcePath?: string;
				artifactId?: string;
				createdAt: number;
				startOffset?: number;
				endOffset?: number;
			}>;
			imageAttachments?: Array<{
				name: string;
				mimeType: string;
				base64Data: string;
				sizeBytes?: number;
				localPath?: string;
				previewMimeType?: string;
				previewBase64Data?: string;
			}>;
			mediaSelection?: {
				mode: string;
				modelId?: string;
				modelName?: string;
				imageModelId?: string;
				videoModelId?: string;
			};
			mediaReferences?: Array<{
				token: string;
				mediaType: string;
				index: number;
				fileId: string;
				fileName: string;
				mimeType: string;
				localPath?: string;
				remoteUrl?: string;
				dataUrl?: string;
				role?: string;
			}>;
		}) => Promise<{
			success: boolean;
			session?: CoworkSession$1;
			error?: string;
			code?: string;
			engineStatus?: OpenClawEngineStatus;
		}>;
		runGoalCommand: (options: {
			sessionId: string;
			command: string;
		}) => Promise<{
			success: boolean;
			goal?: CoworkGoal | null;
			error?: string;
			code?: string;
			engineStatus?: OpenClawEngineStatus;
		}>;
		stopSession: (sessionId: string) => Promise<{
			success: boolean;
			error?: string;
		}>;
		deleteSession: (sessionId: string) => Promise<{
			success: boolean;
			error?: string;
		}>;
		deleteSessions: (sessionIds: string[]) => Promise<{
			success: boolean;
			error?: string;
		}>;
		setSessionPinned: (options: {
			sessionId: string;
			pinned: boolean;
		}) => Promise<{
			success: boolean;
			pinOrder?: number | null;
			error?: string;
		}>;
		renameSession: (options: {
			sessionId: string;
			title: string;
		}) => Promise<{
			success: boolean;
			error?: string;
		}>;
		forkSession: (options: {
			sessionId: string;
			forkedFromMessageId?: string | null;
			title?: string;
		}) => Promise<{
			success: boolean;
			session?: CoworkSession$1;
			error?: string;
		}>;
		getSession: (sessionId: string) => Promise<{
			success: boolean;
			session?: CoworkSession$1;
			error?: string;
		}>;
		markSessionViewed: (sessionId: string) => Promise<{
			success: boolean;
			error?: string;
		}>;
		remoteManaged: (sessionId: string) => Promise<{
			success: boolean;
			remoteManaged: boolean;
			error?: string;
		}>;
		listSessions: (options?: {
			limit?: number;
			offset?: number;
			agentId?: string;
			searchQuery?: string;
		}) => Promise<{
			success: boolean;
			sessions?: CoworkSessionSummary[];
			hasMore?: boolean;
			error?: string;
		}>;
		getContextUsage: (sessionId: string) => Promise<{
			success: boolean;
			usage?: CoworkContextUsage | null;
			source?: CoworkContextUsageSource;
			reason?: CoworkContextUsageFailureReason;
			error?: string;
		}>;
		compactContext: (sessionId: string) => Promise<{
			success: boolean;
			compacted?: boolean;
			reason?: string;
			usage?: CoworkContextUsage | null;
			error?: string;
		}>;
		getSessionMessages: (options: {
			sessionId: string;
			limit?: number;
			offset?: number;
		}) => Promise<{
			success: boolean;
			messages?: CoworkMessage$1[];
			offset?: number;
			total?: number;
			error?: string;
		}>;
		getSessionMessageRailIndex: (sessionId: string) => Promise<{
			success: boolean;
			items?: CoworkMessageRailIndexItem[];
			error?: string;
		}>;
		exportResultImage: (options: {
			rect: {
				x: number;
				y: number;
				width: number;
				height: number;
			};
			defaultFileName?: string;
		}) => Promise<{
			success: boolean;
			canceled?: boolean;
			path?: string;
			error?: string;
		}>;
		captureImageChunk: (options: {
			rect: {
				x: number;
				y: number;
				width: number;
				height: number;
			};
		}) => Promise<{
			success: boolean;
			width?: number;
			height?: number;
			pngBase64?: string;
			error?: string;
		}>;
		saveResultImage: (options: {
			pngBase64: string;
			defaultFileName?: string;
		}) => Promise<{
			success: boolean;
			canceled?: boolean;
			path?: string;
			error?: string;
		}>;
		exportSessionText: (options: {
			content: string;
			defaultFileName?: string;
			fileExtension?: string;
		}) => Promise<{
			success: boolean;
			canceled?: boolean;
			path?: string;
			error?: string;
		}>;
		exportSessionDiagnostics: (options: {
			sessionId: string;
		}) => Promise<{
			success: boolean;
			canceled?: boolean;
			path?: string;
			error?: string;
		}>;
		cancelMediaTask: (taskId: string) => Promise<{
			success: boolean;
			message?: string;
		}>;
		getSubTaskHistory: (options: {
			parentSessionId: string;
			agentId: string;
			sessionKey?: string;
		}) => Promise<{
			success: boolean;
			messages?: Array<{
				id: string;
				type: "user" | "assistant" | "tool_use" | "tool_result" | "system";
				content: string;
				timestamp: number;
				metadata?: {
					toolName?: string;
					toolInput?: Record<string, unknown>;
					toolResult?: string;
					toolUseId?: string | null;
					isError?: boolean;
					[key: string]: unknown;
				};
			}>;
			error?: string;
		}>;
		listSubagentSessions: (parentSessionId: string) => Promise<{
			success: boolean;
			runs?: Array<{
				id: string;
				agentId: string | null;
				task: string | null;
				label: string | null;
				sessionKey: string | null;
				status: "running" | "done" | "error";
				createdAt: number;
				endedAt: number | null;
			}>;
			error?: string;
		}>;
		deleteSubagentSession: (options: {
			parentSessionId: string;
			runId: string;
		}) => Promise<{
			success: boolean;
			deleted?: boolean;
			error?: string;
		}>;
		respondToPermission: (options: {
			requestId: string;
			result: CoworkPermissionResult;
		}) => Promise<{
			success: boolean;
			error?: string;
		}>;
		getConfig: () => Promise<{
			success: boolean;
			config?: CoworkConfig;
			error?: string;
		}>;
		setConfig: (config: CoworkConfigUpdate) => Promise<{
			success: boolean;
			error?: string;
		}>;
		getDreamingStatus: () => Promise<{
			success: boolean;
			data?: Record<string, unknown> | null;
			error?: string;
		}>;
		getDreamDiary: () => Promise<{
			success: boolean;
			data?: Record<string, unknown>;
			error?: string;
		}>;
		notifyOpenSessionFromNotificationReady: () => Promise<{
			success: boolean;
			error?: string;
		}>;
		onOpenSessionFromNotification: (callback: (data: {
			sessionId: string;
		}) => void) => () => void;
		listMemoryEntries: (input: {
			query?: string;
			limit?: number;
			offset?: number;
		}) => Promise<{
			success: boolean;
			entries?: CoworkUserMemoryEntry[];
			error?: string;
		}>;
		createMemoryEntry: (input: {
			text: string;
		}) => Promise<{
			success: boolean;
			entry?: CoworkUserMemoryEntry;
			error?: string;
		}>;
		updateMemoryEntry: (input: {
			id: string;
			text: string;
		}) => Promise<{
			success: boolean;
			entry?: CoworkUserMemoryEntry;
			error?: string;
		}>;
		deleteMemoryEntry: (input: {
			id: string;
		}) => Promise<{
			success: boolean;
			error?: string;
		}>;
		getMemoryStats: () => Promise<{
			success: boolean;
			stats?: CoworkMemoryStats;
			error?: string;
		}>;
		readMemoryFileRaw: () => Promise<{
			success: boolean;
			content?: string;
			error?: string;
		}>;
		writeMemoryFileRaw: (input: {
			content: string;
		}) => Promise<{
			success: boolean;
			error?: string;
		}>;
		readBootstrapFile: (filename: string) => Promise<{
			success: boolean;
			content: string;
			error?: string;
		}>;
		writeBootstrapFile: (filename: string, content: string) => Promise<{
			success: boolean;
			error?: string;
		}>;
		onStreamMessage: (callback: (data: {
			sessionId: string;
			message: CoworkMessage$1;
			beforeMessageId?: string;
		}) => void) => () => void;
		onStreamMessageUpdate: (callback: (data: {
			sessionId: string;
			messageId: string;
			content: string;
			metadata?: Record<string, unknown>;
		}) => void) => () => void;
		onMediaStatusPollUpdate?: (callback: (data: {
			sessionId: string;
			toolCallId: string;
			details: Record<string, unknown>;
		}) => void) => () => void;
		onStreamSessionStatus: (callback: (data: {
			sessionId: string;
			status: CoworkSessionStatus$1;
		}) => void) => () => void;
		onStreamContextUsage?: (callback: (data: {
			sessionId: string;
			usage: CoworkContextUsage;
		}) => void) => () => void;
		onStreamGoal?: (callback: (data: {
			sessionId: string;
			goal: CoworkGoal | null;
		}) => void) => () => void;
		onStreamContextMaintenance?: (callback: (data: {
			sessionId: string;
			active: boolean;
		}) => void) => () => void;
		onStreamPermission: (callback: (data: {
			sessionId: string;
			request: CoworkPermissionRequest;
		}) => void) => () => void;
		onStreamPermissionDismiss: (callback: (data: {
			requestId: string;
		}) => void) => () => void;
		onStreamComplete: (callback: (data: {
			sessionId: string;
			claudeSessionId: string | null;
		}) => void) => () => void;
		onStreamError: (callback: (data: {
			sessionId: string;
			error: string;
		}) => void) => () => void;
		onSessionsChanged: (callback: () => void) => () => void;
		onSessionModelOverrideChanged?: (callback: (data: {
			sessionId: string;
			modelOverride: string;
		}) => void) => () => void;
	};
	dialog: {
		selectDirectory: () => Promise<{
			success: boolean;
			path: string | null;
		}>;
		selectFile: (options?: {
			title?: string;
			filters?: {
				name: string;
				extensions: string[];
			}[];
		}) => Promise<{
			success: boolean;
			path: string | null;
		}>;
		selectFiles: (options?: {
			title?: string;
			filters?: {
				name: string;
				extensions: string[];
			}[];
		}) => Promise<{
			success: boolean;
			paths: string[];
		}>;
		saveInlineFile: (options: {
			dataBase64: string;
			fileName?: string;
			mimeType?: string;
			cwd?: string;
		}) => Promise<{
			success: boolean;
			path: string | null;
			error?: string;
		}>;
		readFileAsDataUrl: (filePath: string) => Promise<{
			success: boolean;
			dataUrl?: string;
			error?: string;
		}>;
		statFile: (filePath: string) => Promise<{
			success: boolean;
			isFile?: boolean;
			size?: number;
			mtimeMs?: number;
			error?: string;
		}>;
		readTextFile: (filePath: string) => Promise<{
			success: boolean;
			content?: string;
			size?: number;
			readBytes?: number;
			truncated?: boolean;
			error?: string;
		}>;
		generateThumbnail: (filePath: string) => Promise<{
			success: boolean;
			dataUrl?: string;
			error?: string;
		}>;
		showMessageBox: (options: {
			message: string;
			type?: "none" | "info" | "error" | "question" | "warning";
			title?: string;
		}) => Promise<{
			response: number;
		}>;
	};
	shell: {
		openPath: (filePath: string) => Promise<ShellActionResponse>;
		showItemInFolder: (filePath: string) => Promise<ShellActionResponse>;
		openExternal: (url: string) => Promise<{
			success: boolean;
			error?: string;
		}>;
		openHtmlInBrowser: (htmlContent: string) => Promise<{
			success: boolean;
			error?: string;
		}>;
		getAppsForFile: (filePath: string) => Promise<{
			success: boolean;
			apps: Array<{
				name: string;
				path: string;
				isDefault: boolean;
				icon?: string;
			}>;
			error?: string;
		}>;
		getBrowserApps: (options?: ShellGetBrowserAppsInput) => Promise<{
			success: boolean;
			apps: Array<{
				name: string;
				path: string;
				isDefault: boolean;
				icon?: string;
			}>;
			error?: string;
		}>;
		openPathWithApp: (filePath: string, appPath: string) => Promise<ShellActionResponse>;
		openUrlWithApp: (url: string, appPath: string) => Promise<ShellActionResponse>;
	};
	clipboard: {
		writeText: (text: string) => Promise<{
			success: boolean;
			error?: string;
		}>;
		writeImageFromFile: (filePath: string) => Promise<{
			success: boolean;
			error?: string;
		}>;
		writeImageFromDataUrl: (dataUrl: string) => Promise<{
			success: boolean;
			error?: string;
		}>;
	};
	htmlShare: {
		createFromHtmlFile: (options: {
			sessionId: string;
			artifactId: string;
			filePath: string;
			title: string;
			accessMode?: HtmlShareAccessMode;
		}) => Promise<HtmlShareResult>;
		updateFromHtmlFile: (options: {
			shareId: string;
			sessionId: string;
			artifactId: string;
			filePath: string;
			title: string;
			currentStatus?: HtmlShareStatus;
			accessMode?: HtmlShareAccessMode;
		}) => Promise<HtmlShareResult>;
		getByHtmlFile: (options: {
			filePath: string;
		}) => Promise<{
			success: boolean;
			share?: HtmlShareResult | null;
			error?: string;
			code?: number;
		}>;
		createFromArtifactFile: (options: {
			sourceType: HtmlShareSourceType;
			sessionId: string;
			artifactId: string;
			title: string;
			accessMode?: HtmlShareAccessMode;
			fileName?: string;
			filePath?: string;
			content?: string;
			remoteUrl?: string;
		}) => Promise<HtmlShareResult>;
		updateFromArtifactFile: (options: {
			sourceType: HtmlShareSourceType;
			shareId: string;
			sessionId: string;
			artifactId: string;
			title: string;
			accessMode?: HtmlShareAccessMode;
			fileName?: string;
			filePath?: string;
			content?: string;
			remoteUrl?: string;
			currentStatus?: HtmlShareStatus;
		}) => Promise<HtmlShareResult>;
		getByArtifactFile: (options: {
			sourceType: HtmlShareSourceType;
			sessionId?: string;
			artifactId?: string;
			filePath?: string;
		}) => Promise<{
			success: boolean;
			share?: HtmlShareResult | null;
			error?: string;
			code?: number;
		}>;
		updateStatus: (options: {
			shareId: string;
			status: HtmlShareConfigurableStatus;
		}) => Promise<HtmlShareResult>;
		updateAccessMode: (options: {
			shareId: string;
			accessMode: HtmlShareAccessMode;
		}) => Promise<HtmlShareResult>;
		disable: (shareId: string) => Promise<HtmlShareResult>;
		get: (shareId: string) => Promise<{
			success: boolean;
			share?: unknown;
			error?: string;
		}>;
	};
	shareDeployment: {
		detectProjectCandidates: (options: ShareDeploymentDetectCandidatesInput) => Promise<ShareDeploymentDetectCandidatesResult>;
		analyzeProjectDirectory: (options: ShareDeploymentAnalyzeProjectInput) => Promise<ShareDeploymentProjectAnalysis>;
		createNodeDeployment: (options: ShareDeploymentCreateNodeInput) => Promise<ShareDeploymentResult>;
		get: (deploymentId: string) => Promise<ShareDeploymentResult>;
		getByLocalService: (options: ShareDeploymentGetByLocalServiceInput) => Promise<ShareDeploymentResult>;
	};
	asr: {
		createRealtimeSession: (options: AsrRealtimeSessionRequest) => Promise<AsrRealtimeSessionResult>;
	};
	artifact: {
		watchFile: (filePath: string) => Promise<void>;
		unwatchFile: (filePath: string) => Promise<void>;
		onFileChanged: (callback: (data: {
			filePath: string;
		}) => void) => () => void;
		createPreviewSession: (filePath: string) => Promise<{
			success: boolean;
			sessionId?: string;
			url?: string;
			error?: string;
		}>;
		createOfficePreviewSession: (filePath: string) => Promise<{
			success: boolean;
			sessionId?: string;
			url?: string;
			error?: string;
		}>;
		destroyPreviewSession: (sessionId: string) => Promise<{
			success: boolean;
		}>;
		clearBrowserCookies: () => Promise<{
			success: boolean;
			error?: string;
		}>;
		clearBrowserCache: () => Promise<{
			success: boolean;
			error?: string;
		}>;
		listLocalWebServices: (options?: ListLocalWebServicesOptions) => Promise<LocalWebService[]>;
	};
	autoLaunch: {
		get: () => Promise<{
			enabled: boolean;
		}>;
		set: (enabled: boolean) => Promise<{
			success: boolean;
			enabled?: boolean;
			error?: string;
			errorCode?: string;
		}>;
	};
	preventSleep: {
		get: () => Promise<{
			enabled: boolean;
		}>;
		set: (enabled: boolean) => Promise<{
			success: boolean;
			error?: string;
		}>;
	};
	appInfo: {
		getVersion: () => Promise<string>;
		getSystemLocale: () => Promise<string>;
		getKeyfromAttribution: () => Promise<{
			firstKeyfrom: string;
			latestKeyfrom: string;
			updatedAt: number;
		}>;
		relaunch: () => Promise<void>;
	};
	appUpdate: {
		getState: () => Promise<AppUpdateRuntimeState>;
		checkNow: (options?: {
			manual?: boolean;
			userId?: string | null;
		}) => Promise<AppUpdateCheckResult>;
		retryDownload: () => Promise<{
			success: boolean;
			state: AppUpdateRuntimeState;
		}>;
		cancelDownload: () => Promise<{
			success: boolean;
			state: AppUpdateRuntimeState;
		}>;
		installReady: () => Promise<{
			success: boolean;
			state: AppUpdateRuntimeState;
			error?: string;
		}>;
		onStateChanged: (callback: (data: AppUpdateRuntimeState) => void) => () => void;
	};
	log: {
		getPath: () => Promise<string>;
		openFolder: () => Promise<void>;
		exportZip: () => Promise<{
			success: boolean;
			canceled?: boolean;
			path?: string;
			missingEntries?: string[];
			error?: string;
		}>;
		fromRenderer: (level: string, tag: string, message: string) => void;
	};
	plugins: {
		list: () => Promise<{
			success: boolean;
			plugins?: Array<{
				pluginId: string;
				version?: string;
				description?: string;
				source: "npm" | "clawhub" | "git" | "local" | "bundled" | "openclaw";
				enabled: boolean;
				canUninstall: boolean;
				hasConfig: boolean;
			}>;
			error?: string;
		}>;
		install: (params: {
			source: "npm" | "clawhub" | "git" | "local";
			spec: string;
			registry?: string;
			version?: string;
		}) => Promise<{
			ok: boolean;
			pluginId?: string;
			version?: string;
			error?: string;
		}>;
		uninstall: (pluginId: string) => Promise<{
			ok: boolean;
			error?: string;
		}>;
		setEnabled: (pluginId: string, enabled: boolean) => Promise<{
			ok: boolean;
			error?: string;
		}>;
		getConfigSchema: (pluginId: string) => Promise<{
			success: boolean;
			schema?: {
				configSchema: Record<string, unknown>;
				uiHints: Record<string, {
					label?: string;
					help?: string;
					sensitive?: boolean;
					advanced?: boolean;
					placeholder?: string;
					order?: number;
				}>;
			} | null;
			config?: Record<string, unknown> | null;
			error?: string;
		}>;
		saveConfig: (pluginId: string, config: Record<string, unknown>) => Promise<{
			ok: boolean;
			error?: string;
		}>;
		batchSave: (changes: {
			toggles?: Array<{
				pluginId: string;
				enabled: boolean;
			}>;
			configs?: Array<{
				pluginId: string;
				config: Record<string, unknown>;
			}>;
		}) => Promise<{
			ok: boolean;
			error?: string;
		}>;
		detect: () => Promise<{
			plugins: string[];
			error?: string;
		}>;
		sync: () => Promise<{
			synced: string[];
			error?: string;
		}>;
		checkUpdates: (pluginIds?: string[]) => Promise<{
			success: boolean;
			updates?: Array<{
				pluginId: string;
				currentVersion: string | null;
				latestVersion: string | null;
				hasUpdate: boolean;
				error?: string;
			}>;
			error?: string;
		}>;
		update: (pluginId: string) => Promise<{
			ok: boolean;
			version?: string;
			error?: string;
		}>;
		onInstallLog: (callback: (line: string) => void) => () => void;
	};
	im: {
		getConfig: () => Promise<{
			success: boolean;
			config?: IMGatewayConfig;
			error?: string;
		}>;
		setConfig: (config: Partial<IMGatewayConfig>, options?: {
			syncGateway?: boolean;
			restartGatewayIfRunning?: boolean;
			markRestartOnSave?: boolean;
		}) => Promise<{
			success: boolean;
			error?: string;
		}>;
		syncConfig: () => Promise<{
			success: boolean;
			skipped?: boolean;
			error?: string;
		}>;
		startGateway: (platform: Platform) => Promise<{
			success: boolean;
			error?: string;
		}>;
		stopGateway: (platform: Platform) => Promise<{
			success: boolean;
			error?: string;
		}>;
		testGateway: (platform: Platform, configOverride?: Partial<IMGatewayConfig>) => Promise<{
			success: boolean;
			result?: IMConnectivityTestResult;
			error?: string;
		}>;
		getStatus: () => Promise<{
			success: boolean;
			status?: IMGatewayStatus;
			error?: string;
		}>;
		getLocalIp: () => Promise<string>;
		getOpenClawConfigSchema: () => Promise<{
			success: boolean;
			result?: {
				schema: Record<string, unknown>;
				uiHints: Record<string, Record<string, unknown>>;
			};
			error?: string;
		}>;
		weixinQrLoginStart: () => Promise<{
			success: boolean;
			qrDataUrl?: string;
			message: string;
			sessionKey?: string;
		}>;
		weixinQrLoginWait: (sessionKey?: string) => Promise<{
			success: boolean;
			connected: boolean;
			message: string;
			accountId?: string;
			alreadyConnected?: boolean;
		}>;
		// POPO QR login
		popoQrLoginStart: () => Promise<{
			success: boolean;
			qrUrl?: string;
			taskToken?: string;
			timeoutMs?: number;
			message?: string;
		}>;
		popoQrLoginPoll: (taskToken: string) => Promise<{
			success: boolean;
			appKey?: string;
			appSecret?: string;
			aesKey?: string;
			message: string;
		}>;
		// POPO Multi-Instance
		addPopoInstance: (name: string) => Promise<{
			success: boolean;
			instance?: PopoInstanceConfig;
			error?: string;
		}>;
		deletePopoInstance: (instanceId: string) => Promise<{
			success: boolean;
			error?: string;
		}>;
		setPopoInstanceConfig: (instanceId: string, config: Record<string, unknown>, options?: {
			syncGateway?: boolean;
			restartGatewayIfRunning?: boolean;
			markRestartOnSave?: boolean;
		}) => Promise<{
			success: boolean;
			error?: string;
		}>;
		listPairingRequests: (platform: string) => Promise<{
			success: boolean;
			requests: Array<{
				id: string;
				code: string;
				createdAt: string;
				lastSeenAt: string;
				meta?: Record<string, string>;
			}>;
			allowFrom: string[];
			error?: string;
		}>;
		approvePairingCode: (platform: string, code: string) => Promise<{
			success: boolean;
			error?: string;
		}>;
		rejectPairingRequest: (platform: string, code: string) => Promise<{
			success: boolean;
			error?: string;
		}>;
		nimQrLoginStart: () => Promise<{
			uuid: string;
			qrValue: string;
			expiresIn: number;
			pollInterval: number;
			credentialKind: "split";
			rawData: Record<string, unknown> | null;
		}>;
		nimQrLoginPoll: (uuid: string) => Promise<{
			status: "pending" | "success" | "failed";
			credentials?: {
				appKey: string;
				account: string;
				token: string;
			};
			errorCode?: string;
			error?: string;
		}>;
		addNimInstance: (name: string) => Promise<{
			success: boolean;
			instance?: NimInstanceConfig;
			error?: string;
		}>;
		deleteNimInstance: (instanceId: string) => Promise<{
			success: boolean;
			error?: string;
		}>;
		setNimInstanceConfig: (instanceId: string, config: any, options?: {
			syncGateway?: boolean;
			restartGatewayIfRunning?: boolean;
			markRestartOnSave?: boolean;
		}) => Promise<{
			success: boolean;
			error?: string;
		}>;
		addQQInstance: (name: string) => Promise<{
			success: boolean;
			instance?: QQInstanceConfig;
			error?: string;
		}>;
		deleteQQInstance: (instanceId: string) => Promise<{
			success: boolean;
			error?: string;
		}>;
		setQQInstanceConfig: (instanceId: string, config: any, options?: {
			syncGateway?: boolean;
			restartGatewayIfRunning?: boolean;
			markRestartOnSave?: boolean;
		}) => Promise<{
			success: boolean;
			error?: string;
		}>;
		addFeishuInstance: (name: string) => Promise<{
			success: boolean;
			instance?: FeishuInstanceConfig;
			error?: string;
		}>;
		deleteFeishuInstance: (instanceId: string) => Promise<{
			success: boolean;
			error?: string;
		}>;
		setFeishuInstanceConfig: (instanceId: string, config: any, options?: {
			syncGateway?: boolean;
			restartGatewayIfRunning?: boolean;
			markRestartOnSave?: boolean;
		}) => Promise<{
			success: boolean;
			error?: string;
		}>;
		addDingTalkInstance: (name: string) => Promise<{
			success: boolean;
			instance?: DingTalkInstanceConfig;
			error?: string;
		}>;
		deleteDingTalkInstance: (instanceId: string) => Promise<{
			success: boolean;
			error?: string;
		}>;
		setDingTalkInstanceConfig: (instanceId: string, config: any, options?: {
			syncGateway?: boolean;
			restartGatewayIfRunning?: boolean;
			markRestartOnSave?: boolean;
		}) => Promise<{
			success: boolean;
			error?: string;
		}>;
		addEmailInstance: (name: string) => Promise<{
			success: boolean;
			instance?: EmailInstanceConfig;
			error?: string;
		}>;
		deleteEmailInstance: (instanceId: string) => Promise<{
			success: boolean;
			error?: string;
		}>;
		setEmailInstanceConfig: (instanceId: string, config: any, options?: {
			syncGateway?: boolean;
			restartGatewayIfRunning?: boolean;
			markRestartOnSave?: boolean;
		}) => Promise<{
			success: boolean;
			error?: string;
		}>;
		addWecomInstance: (name: string) => Promise<{
			success: boolean;
			instance?: WecomInstanceConfig;
			error?: string;
		}>;
		deleteWecomInstance: (instanceId: string) => Promise<{
			success: boolean;
			error?: string;
		}>;
		setWecomInstanceConfig: (instanceId: string, config: any, options?: {
			syncGateway?: boolean;
			restartGatewayIfRunning?: boolean;
			markRestartOnSave?: boolean;
		}) => Promise<{
			success: boolean;
			error?: string;
		}>;
		addTelegramInstance: (name: string) => Promise<{
			success: boolean;
			instance?: TelegramInstanceConfig;
			error?: string;
		}>;
		deleteTelegramInstance: (instanceId: string) => Promise<{
			success: boolean;
			error?: string;
		}>;
		setTelegramInstanceConfig: (instanceId: string, config: any, options?: {
			syncGateway?: boolean;
			restartGatewayIfRunning?: boolean;
			markRestartOnSave?: boolean;
		}) => Promise<{
			success: boolean;
			error?: string;
		}>;
		addDiscordInstance: (name: string) => Promise<{
			success: boolean;
			instance?: DiscordInstanceConfig;
			error?: string;
		}>;
		deleteDiscordInstance: (instanceId: string) => Promise<{
			success: boolean;
			error?: string;
		}>;
		setDiscordInstanceConfig: (instanceId: string, config: any, options?: {
			syncGateway?: boolean;
			restartGatewayIfRunning?: boolean;
			markRestartOnSave?: boolean;
		}) => Promise<{
			success: boolean;
			error?: string;
		}>;
		onStatusChange: (callback: (status: IMGatewayStatus) => void) => () => void;
		onMessageReceived: (callback: (message: IMMessage) => void) => () => void;
	};
	scheduledTasks: {
		list: () => Promise<{
			success: boolean;
			ready?: boolean;
			tasks?: ScheduledTask[];
			error?: string;
		}>;
		get: (id: string) => Promise<{
			success: boolean;
			task?: ScheduledTask;
			error?: string;
		}>;
		create: (input: ScheduledTaskInput) => Promise<{
			success: boolean;
			task?: ScheduledTask;
			error?: string;
		}>;
		update: (id: string, input: Partial<ScheduledTaskInput>) => Promise<{
			success: boolean;
			task?: ScheduledTask;
			error?: string;
		}>;
		delete: (id: string) => Promise<{
			success: boolean;
			error?: string;
		}>;
		toggle: (id: string, enabled: boolean) => Promise<{
			success: boolean;
			task?: ScheduledTask;
			warning?: string;
			error?: string;
		}>;
		runManually: (id: string) => Promise<{
			success: boolean;
			error?: string;
		}>;
		stop: (id: string) => Promise<{
			success: boolean;
			error?: string;
		}>;
		listRuns: (taskId: string, limit?: number, offset?: number, filter?: RunFilter) => Promise<{
			success: boolean;
			runs?: ScheduledTaskRun[];
			error?: string;
		}>;
		countRuns: (taskId: string) => Promise<{
			success: boolean;
			count?: number;
			error?: string;
		}>;
		listAllRuns: (limit?: number, offset?: number, filter?: RunFilter) => Promise<{
			success: boolean;
			ready?: boolean;
			runs?: ScheduledTaskRunWithName[];
			error?: string;
		}>;
		resolveSession: (input: string | {
			sessionId?: string | null;
			sessionKey?: string | null;
		}) => Promise<{
			success: boolean;
			session?: CoworkSession | null;
			error?: string;
		}>;
		listChannels: () => Promise<{
			success: boolean;
			channels?: ScheduledTaskChannelOption[];
			error?: string;
		}>;
		listChannelConversations?: (channel: string, accountId?: string, filterAccountId?: string) => Promise<{
			success: boolean;
			conversations?: ScheduledTaskConversationOption[];
			error?: string;
		}>;
		onStatusUpdate: (callback: (data: ScheduledTaskStatusEvent) => void) => () => void;
		onRunUpdate: (callback: (data: ScheduledTaskRunEvent) => void) => () => void;
		onRefresh: (callback: () => void) => () => void;
	};
	permissions: {
		checkCalendar: () => Promise<{
			success: boolean;
			status?: string;
			error?: string;
			autoRequested?: boolean;
		}>;
		requestCalendar: () => Promise<{
			success: boolean;
			granted?: boolean;
			status?: string;
			error?: string;
		}>;
	};
	auth: {
		login: (loginUrl?: string) => Promise<{
			success: boolean;
			error?: string;
		}>;
		exchange: (code: string) => Promise<{
			success: true;
			user: UserProfile;
			quota: AuthQuota;
		} | {
			success: false;
			error?: string;
		}>;
		getUser: () => Promise<{
			success: true;
			user: UserProfile;
			quota: AuthQuota | null;
		} | {
			success: false;
		}>;
		getQuota: () => Promise<{
			success: true;
			quota: AuthQuota;
		} | {
			success: false;
		}>;
		logout: () => Promise<{
			success: boolean;
		}>;
		refreshToken: () => Promise<{
			success: boolean;
			accessToken?: string;
		}>;
		getAccessToken: () => Promise<string | null>;
		getModels: () => Promise<{
			success: boolean;
			models?: Array<{
				modelId: string;
				modelName: string;
				provider: string;
				apiFormat: string;
				supportsImage?: boolean;
				supportsThinking?: boolean;
				contextWindow?: number;
				explicitContextCache?: boolean;
				costMultiplier?: number;
				description?: string;
				accessible?: boolean;
				restrictionHint?: string;
			}>;
		}>;
		getPricingCatalog: () => Promise<{
			success: boolean;
			textModels?: Array<{
				modelId: string;
				modelName: string;
				provider?: string;
				providerLabel?: string;
				description?: string;
				supportsImage?: boolean;
				supportsThinking?: boolean;
				contextWindow?: number | null;
				costMultiplier?: number;
			}>;
			error?: string;
		}>;
		getProfileSummary: () => Promise<{
			success: boolean;
			data?: ProfileSummaryData;
		}>;
		getActiveClientBanner: () => Promise<{
			success: boolean;
			data?: ClientBannerData | null;
		}>;
		getActiveClientBanners: () => Promise<{
			success: boolean;
			data?: ClientBannerData[];
		}>;
		getPendingCallback: () => Promise<string | null>;
		onCallback: (callback: (data: {
			code: string;
		}) => void) => () => void;
		onQuotaChanged: (callback: () => void) => () => void;
	};
	media: {
		getModels: (type: "image" | "video") => Promise<{
			success: boolean;
			models?: Array<{
				modelId: string;
				displayName: string;
				provider: string;
				mediaType: string;
				generationTimeout: number;
				pricing: Record<string, unknown>;
			}>;
			error?: string;
		}>;
		getTaskStatus: (taskId: number, type: "image" | "video") => Promise<{
			success: boolean;
			task?: Record<string, unknown>;
			error?: string;
		}>;
	};
	enterprise: {
		getConfig: () => Promise<{
			ui?: Record<string, "hide" | "disable" | "readonly">;
			disableUpdate?: boolean;
			version: string;
			name: string;
		} | null>;
	};
	networkStatus: {
		send: (status: "online" | "offline") => void;
	};
	qwen?: Record<string, never>;
	feishu: {
		install: {
			qrcode: (isLark: boolean) => Promise<{
				url: string;
				deviceCode: string;
				interval: number;
				expireIn: number;
			}>;
			poll: (deviceCode: string) => Promise<{
				done: boolean;
				appId?: string;
				appSecret?: string;
				domain?: string;
				error?: string;
			}>;
			verify: (appId: string, appSecret: string) => Promise<{
				success: boolean;
				error?: string;
			}>;
		};
	};
	dingtalk: {
		install: {
			qrcode: () => Promise<{
				url: string;
				deviceCode: string;
				interval: number;
				expireIn: number;
			}>;
			poll: (deviceCode: string) => Promise<{
				done: boolean;
				clientId?: string;
				clientSecret?: string;
				error?: string;
			}>;
			verify: (clientId: string, clientSecret: string) => Promise<{
				success: boolean;
				error?: string;
			}>;
		};
	};
	githubCopilot: {
		requestDeviceCode: () => Promise<{
			userCode: string;
			verificationUri: string;
			deviceCode: string;
			interval: number;
			expiresIn: number;
		}>;
		pollForToken: (deviceCode: string, interval: number, expiresIn: number) => Promise<{
			success: boolean;
			token?: string;
			githubUser?: string;
			baseUrl?: string;
			error?: string;
		}>;
		cancelPolling: () => Promise<void>;
		signOut: () => Promise<void>;
		refreshToken: () => Promise<{
			success: boolean;
			token?: string;
			baseUrl?: string;
			error?: string;
		}>;
		onTokenUpdated: (callback: (data: {
			token: string;
			baseUrl: string;
		}) => void) => () => void;
	};
	openaiCodexOAuth: {
		start: () => Promise<{
			success: true;
			email: string | null;
			accountId: string | null;
			expiresAt: number;
		} | {
			success: false;
			error: string;
		}>;
		cancel: () => Promise<void>;
		logout: () => Promise<void>;
		status: () => Promise<{
			loggedIn: true;
			email: string | null;
			accountId: string | null;
			expiresAt: number;
		} | {
			loggedIn: false;
		}>;
	};
	xaiOAuth: {
		start: () => Promise<{
			success: true;
			email: string | null;
			flow: "browser" | "device-code";
		} | {
			success: false;
			error: string;
		}>;
		cancel: () => Promise<void>;
		logout: () => Promise<void>;
		status: () => Promise<{
			loggedIn: boolean;
			email?: string;
			displayName?: string;
			expiresAt?: number;
		}>;
		onDeviceCode: (callback: (info: {
			userCode: string;
			verificationUri: string;
			verificationUriComplete?: string;
			expiresInMs: number;
		}) => void) => () => void;
	};
}
interface IMConnectivityCheck {
	code: IMConnectivityCheckCode;
	level: IMConnectivityCheckLevel;
	message: string;
	suggestion?: string;
}
interface IMConnectivityTestResult {
	platform: Platform;
	testedAt: number;
	verdict: IMConnectivityVerdict;
	checks: IMConnectivityCheck[];
}
interface IMGatewayConfig {
	dingtalk: DingTalkMultiInstanceConfig;
	feishu: FeishuMultiInstanceConfig;
	telegram: TelegramMultiInstanceConfig;
	qq: QQMultiInstanceConfig;
	discord: DiscordMultiInstanceConfig;
	nim: NimMultiInstanceConfig;
	"netease-bee": NeteaseBeeChanConfig;
	wecom: WecomMultiInstanceConfig;
	popo: PopoMultiInstanceConfig;
	weixin: WeixinOpenClawConfig;
	email: EmailMultiInstanceConfig;
	settings: IMSettings;
}
interface IMGatewayStatus {
	dingtalk: DingTalkMultiInstanceStatus;
	feishu: FeishuMultiInstanceStatus;
	qq: QQMultiInstanceStatus;
	telegram: TelegramMultiInstanceStatus;
	discord: DiscordMultiInstanceStatus;
	nim: NimMultiInstanceStatus;
	"netease-bee": NeteaseBeeChanGatewayStatus;
	wecom: WecomMultiInstanceStatus;
	popo: PopoMultiInstanceStatus;
	weixin: WeixinGatewayStatus;
	email: EmailMultiInstanceStatus;
}
interface IMMessage {
	platform: Platform;
	messageId: string;
	conversationId: string;
	senderId: string;
	senderName?: string;
	content: string;
	chatType: "direct" | "group";
	timestamp: number;
}
interface IMSettings {
	systemPrompt?: string;
	skillsEnabled: boolean;
}
interface InstalledKitRecord {
	id: string;
	version: string;
	installedAt: number;
	skills: InstalledKitSkills | null;
	mcpServers: unknown[];
	connectors: unknown[];
}
interface InstalledKitSkills {
	skillIds: string[];
	metadata?: Record<string, KitSkillMetadata>;
}
interface KitReference {
	kind: typeof KitReferenceKind.Kit;
	id: string;
	name?: string;
	uri: string;
	source?: KitReferenceSource | string;
}
interface KitSkillMetadata {
	id: string;
	name?: string | LocalizedText;
	description?: string | LocalizedText;
}
interface ListLocalWebServicesOptions {
	preferredPorts?: number[];
}
interface LocalWebService {
	id: string;
	title: string;
	url: string;
	host: string;
	port: number;
	online: boolean;
	projectDirectory?: string;
	projectCandidates?: ShareDeploymentProjectCandidate[];
}
interface LocalizedText {
	en: string;
	zh: string;
}
interface McpMarketplaceCategory {
	id: string;
	name_zh: string;
	name_en: string;
}
interface McpMarketplaceData {
	categories: McpMarketplaceCategory[];
	servers: McpMarketplaceServer[];
}
interface McpMarketplaceServer {
	id: string;
	name: string;
	description_zh: string;
	description_en: string;
	category: string;
	transportType: "stdio" | "sse" | "http";
	command: string;
	defaultArgs: string[];
	requiredEnvKeys?: string[];
	optionalEnvKeys?: string[];
}
interface McpServerConfigIPC {
	id: string;
	name: string;
	description: string;
	enabled: boolean;
	transportType: "stdio" | "sse" | "http";
	command?: string;
	args?: string[];
	env?: Record<string, string>;
	url?: string;
	headers?: Record<string, string>;
	isBuiltIn: boolean;
	githubUrl?: string;
	registryId?: string;
	launchResolution?: {
		serverId: string;
		resolverKind: "npx" | "uvx" | "python" | "raw";
		sourceFingerprint: string;
		status: "pending" | "installing" | "ready" | "failed" | "unsupported";
		packageName?: string;
		requestedVersion?: string;
		resolvedVersion?: string;
		installDir?: string;
		command?: string;
		args?: string[];
		env?: Record<string, string>;
		error?: string;
		installedAt?: number;
		resolvedAt?: number;
		lastProbeAt?: number;
		lastProbeStatus?: string;
		updatedAt: number;
	};
	createdAt: number;
	updatedAt: number;
}
interface NeteaseBeeChanConfig {
	enabled: boolean;
	clientId: string;
	secret: string;
	debug?: boolean;
}
interface NeteaseBeeChanGatewayStatus {
	connected: boolean;
	startedAt: number | null;
	lastError: string | null;
	botAccount: string | null;
	lastInboundAt: number | null;
	lastOutboundAt: number | null;
}
interface NimAdvancedConfig {
	mediaMaxMb?: number;
	textChunkLimit?: number;
	debug?: boolean;
	legacyLogin?: boolean;
	weblbsUrl?: string;
	link_web?: string;
	nos_uploader?: string;
	nos_downloader_v2?: string;
	nosSsl?: boolean;
	nos_accelerate?: string;
	nos_accelerate_host?: string;
}
interface NimGatewayStatus {
	connected: boolean;
	startedAt: number | null;
	lastError: string | null;
	botAccount: string | null;
	lastInboundAt: number | null;
	lastOutboundAt: number | null;
}
interface NimInstanceConfig extends NimOpenClawConfig {
	instanceId: string;
	instanceName: string;
}
interface NimInstanceStatus extends NimGatewayStatus {
	instanceId: string;
	instanceName: string;
}
interface NimMultiInstanceConfig {
	instances: NimInstanceConfig[];
}
interface NimMultiInstanceStatus {
	instances: NimInstanceStatus[];
}
interface NimOpenClawConfig {
	enabled: boolean;
	nimToken?: string;
	appKey: string;
	account: string;
	token: string;
	antispamEnabled?: boolean;
	p2p?: NimP2pConfig;
	team?: NimTeamConfig;
	qchat?: NimQChatConfig;
	advanced?: NimAdvancedConfig;
}
interface NimP2pConfig {
	policy: "open" | "allowlist" | "disabled";
	allowFrom?: (string | number)[];
}
interface NimQChatConfig {
	policy: "open" | "allowlist" | "disabled";
	allowFrom?: (string | number)[];
}
interface NimTeamConfig {
	policy: "open" | "allowlist" | "disabled";
	allowFrom?: (string | number)[];
}
interface OpenClawEngineStatus {
	phase: OpenClawEnginePhase$1;
	version: string | null;
	progressPercent?: number;
	message?: string;
	gatewayPort?: number | null;
	gatewayHttpUrl?: string | null;
	canRetry: boolean;
}
interface OpenClawGatewayRepairResult {
	success: boolean;
	status?: OpenClawEngineStatus;
	originalPath?: string;
	backupPath?: string;
	error?: string;
	errorCode?: OpenClawGatewayRepairErrorCode;
	recoverable?: boolean;
}
interface OpenClawSessionPatch {
	model?: string | null;
	thinkingLevel?: string | null;
	reasoningLevel?: string | null;
	elevatedLevel?: string | null;
	responseUsage?: OpenClawSessionResponseUsage | null;
	sendPolicy?: OpenClawSessionSendPolicy | null;
}
interface OpenClawSessionPolicyConfig {
	keepAlive: "1d" | "7d" | "30d" | "365d";
}
interface PopoGatewayStatus {
	connected: boolean;
	startedAt: number | null;
	lastError: string | null;
	lastInboundAt: number | null;
	lastOutboundAt: number | null;
}
interface PopoInstanceConfig extends PopoOpenClawConfig {
	instanceId: string;
	instanceName: string;
}
interface PopoInstanceConfig$1 extends PopoOpenClawConfig$1 {
	instanceId: string;
	instanceName: string;
}
interface PopoInstanceStatus extends PopoGatewayStatus {
	instanceId: string;
	instanceName: string;
}
interface PopoMultiInstanceConfig {
	instances: PopoInstanceConfig$1[];
}
interface PopoMultiInstanceStatus {
	instances: PopoInstanceStatus[];
}
interface PopoOpenClawConfig {
	enabled: boolean;
	connectionMode: "websocket" | "webhook";
	appKey: string;
	appSecret: string;
	token: string;
	aesKey: string;
	webhookBaseUrl: string;
	webhookPath: string;
	webhookPort: number;
	dmPolicy: "open" | "pairing" | "allowlist" | "disabled";
	allowFrom: string[];
	groupPolicy: "open" | "allowlist" | "disabled";
	groupAllowFrom: string[];
	textChunkLimit: number;
	richTextChunkLimit: number;
	debug: boolean;
}
interface PopoOpenClawConfig$1 {
	enabled: boolean;
	connectionMode: "websocket" | "webhook";
	appKey: string;
	appSecret: string;
	token: string;
	aesKey: string;
	webhookBaseUrl: string;
	webhookPath: string;
	webhookPort: number;
	dmPolicy: "open" | "pairing" | "allowlist" | "disabled";
	allowFrom: string[];
	groupPolicy: "open" | "allowlist" | "disabled";
	groupAllowFrom: string[];
	textChunkLimit: number;
	richTextChunkLimit: number;
	debug: boolean;
}
interface PresetAgent {
	id: string;
	name: string;
	nameEn: string;
	icon: string;
	description: string;
	descriptionEn: string;
	identity: string;
	identityEn: string;
	systemPrompt: string;
	systemPromptEn: string;
	skillIds: string[];
	installed?: boolean;
}
interface ProfileSummaryData {
	id: number;
	nickname: string;
	avatarUrl: string | null;
	totalCreditsRemaining: number;
	creditItems: CreditItem[];
	availableResetCount?: number;
	availablePromoSubscriptionCount?: number;
	creditsResetCampaign?: CreditsResetCampaignStatusData;
}
interface QQConfig {
	enabled: boolean;
	appId: string;
	appSecret: string;
	dmPolicy: "open" | "pairing" | "allowlist";
	allowFrom: string[];
	groupPolicy: "open" | "allowlist" | "disabled";
	groupAllowFrom: string[];
	historyLimit: number;
	markdownSupport: boolean;
	imageServerBaseUrl: string;
	debug: boolean;
}
interface QQGatewayStatus {
	connected: boolean;
	startedAt: number | null;
	lastError: string | null;
	lastInboundAt: number | null;
	lastOutboundAt: number | null;
}
interface QQInstanceConfig extends QQConfig {
	instanceId: string;
	instanceName: string;
}
interface QQInstanceStatus extends QQGatewayStatus {
	instanceId: string;
	instanceName: string;
}
interface QQMultiInstanceConfig {
	instances: QQInstanceConfig[];
}
interface QQMultiInstanceStatus {
	instances: QQInstanceStatus[];
}
interface ResolvedKitCapabilities {
	skillIds: string[];
	mcpServers: unknown[];
	connectors: unknown[];
}
interface RunFilter {
	/** ISO date string (YYYY-MM-DD), inclusive lower bound for startedAt */
	startDate?: string;
	/** ISO date string (YYYY-MM-DD), inclusive upper bound for startedAt */
	endDate?: string;
	/** Filter by task run status */
	status?: TaskStatus;
}
interface ScheduleAt {
	kind: "at";
	at: string;
}
interface ScheduleCron {
	kind: "cron";
	expr: string;
	tz?: string;
	staggerMs?: number;
}
interface ScheduleEvery {
	kind: "every";
	everyMs: number;
	anchorMs?: number;
}
interface ScheduledTask {
	id: string;
	name: string;
	description: string;
	enabled: boolean;
	schedule: Schedule;
	sessionTarget: SessionTarget;
	wakeMode: WakeMode;
	payload: ScheduledTaskPayload;
	delivery: ScheduledTaskDelivery;
	agentId: string | null;
	sessionKey: string | null;
	state: TaskState;
	createdAt: string;
	updatedAt: string;
}
interface ScheduledTaskChannelOption {
	value: string;
	label: string;
	/** Multi-instance platforms use this stable instance selector as
	 *  `delivery.accountId`. Plugins may internally map it to a protocol-level
	 *  account identity such as appKey:accid. */
	accountId?: string;
	/** Optional account identifier used only when querying local conversation
	 *  mappings. Some plugins persist a different routing-safe account prefix
	 *  than the delivery-time accountId expected by OpenClaw. */
	filterAccountId?: string;
}
interface ScheduledTaskConversationOption {
	conversationId: string;
	platform: string;
	coworkSessionId: string;
	lastActiveAt: number;
	/** Peer kind parsed from the conversationId, when recognizable. */
	peerKind?: "direct" | "group" | "channel";
	/** Human-friendly name: a user-renamed Cowork session title when available,
	 *  otherwise the conversation peer id without routing prefixes/domains. */
	displayName?: string;
}
interface ScheduledTaskDelivery {
	mode: DeliveryMode;
	channel?: string;
	to?: string;
	accountId?: string;
	bestEffort?: boolean;
}
interface ScheduledTaskInput {
	name: string;
	description: string;
	enabled: boolean;
	schedule: Schedule;
	sessionTarget: SessionTarget;
	wakeMode: WakeMode;
	payload: ScheduledTaskPayload;
	delivery?: ScheduledTaskDelivery;
	agentId?: string | null;
	sessionKey?: string | null;
}
interface ScheduledTaskRun {
	id: string;
	taskId: string;
	sessionId: string | null;
	sessionKey: string | null;
	status: TaskStatus;
	startedAt: string;
	finishedAt: string | null;
	durationMs: number | null;
	error: string | null;
	summary?: string | null;
	deliveryError?: string | null;
}
interface ScheduledTaskRunEvent {
	run: ScheduledTaskRunWithName;
}
interface ScheduledTaskRunWithName extends ScheduledTaskRun {
	taskName: string;
}
interface ScheduledTaskStatusEvent {
	taskId: string;
	state: TaskState;
}
interface ShareDeploymentAnalyzeProjectInput {
	projectDirectory: string;
	localServiceUrl?: string;
}
interface ShareDeploymentCreateNodeInput {
	sessionId: string;
	artifactId: string;
	title: string;
	localServiceUrl: string;
	projectDirectory: string;
	accessMode?: HtmlShareAccessMode;
	nodeVersion: string;
	installCommand: string;
	buildCommand: string;
	startCommand: string;
	port: number;
}
interface ShareDeploymentDetectCandidatesInput {
	localServiceUrl: string;
	workingDirectory?: string;
	projectCandidates?: ShareDeploymentProjectCandidate[];
	cachedProjectDirectory?: string;
}
interface ShareDeploymentDetectCandidatesResult {
	success: boolean;
	candidates: ShareDeploymentProjectCandidate[];
	error?: string;
}
interface ShareDeploymentEvent {
	id?: number;
	eventType?: string;
	message?: string;
	detailJson?: string;
	createdAt?: string;
}
interface ShareDeploymentGetByLocalServiceInput {
	sessionId: string;
	localServiceUrl: string;
	projectDirectory?: string;
}
interface ShareDeploymentProjectAnalysis {
	success: boolean;
	projectDirectory: string;
	packageName?: string;
	packageVersion?: string;
	deploymentKind?: ShareDeploymentKind;
	entryFile?: string;
	spaFallback?: boolean;
	packageManager: ShareDeploymentPackageManager;
	nodeVersion: string;
	installCommand: string;
	buildCommand: string;
	startCommand: string;
	port?: number;
	totalFiles: number;
	totalBytes: number;
	excludedCount: number;
	warnings: string[];
	blockers: string[];
	error?: string;
}
interface ShareDeploymentProjectCandidate {
	directory: string;
	source: ShareDeploymentCandidateSource;
	confidence: number;
	reason?: string;
	evidence?: string;
	messageId?: string;
	artifactId?: string;
	pid?: number;
	detectedAt?: number;
}
interface ShareDeploymentRecord {
	deploymentId: string;
	shareId?: string;
	url?: string;
	deploymentKind?: ShareDeploymentKind;
	accessMode?: HtmlShareAccessMode;
	shareCode?: string;
	shareCodeUnavailable?: boolean;
	shareStatus?: HtmlShareStatus;
	disabledSource?: HtmlShareDisabledSource | null;
	status: ShareDeploymentStatus;
	runtimeLanguage?: string;
	runtimeVersion?: string;
	packageManager?: string;
	installCommand?: string;
	buildCommand?: string;
	startCommand?: string;
	targetPort?: number;
	sourceArchiveBytes?: number;
	sourceSha256?: string;
	provider?: string;
	providerRegion?: string;
	providerFunctionId?: string;
	providerEndpoint?: string;
	deployedAt?: string;
	expiresAt?: string;
	lastAccessedAt?: string;
	errorMessage?: string;
	createdAt?: string;
	updatedAt?: string;
	events?: ShareDeploymentEvent[];
}
interface ShareDeploymentResult {
	success: boolean;
	deployment?: ShareDeploymentRecord | null;
	analysis?: ShareDeploymentProjectAnalysis;
	warnings?: string[];
	error?: string;
	code?: number;
}
interface ShellActionResponse {
	success: boolean;
	error?: string;
	reason?: ShellOpenFailureReason;
}
interface ShellGetBrowserAppsInput {
	projectDirectory?: string;
}
interface Skill {
	id: string;
	name: string;
	description: string;
	enabled: boolean;
	isOfficial: boolean;
	isBuiltIn: boolean;
	updatedAt: number;
	prompt: string;
	skillPath: string;
}
interface SystemEventPayload {
	kind: "systemEvent";
	text: string;
}
interface TaskState {
	nextRunAtMs: number | null;
	lastRunAtMs: number | null;
	lastStatus: TaskLastStatus;
	lastError: string | null;
	lastDurationMs: number | null;
	runningAtMs: number | null;
	consecutiveErrors: number;
}
interface TelegramGatewayStatus {
	connected: boolean;
	startedAt: number | null;
	lastError: string | null;
	botUsername: string | null;
	lastInboundAt: number | null;
	lastOutboundAt: number | null;
}
interface TelegramInstanceConfig extends TelegramOpenClawConfig {
	instanceId: string;
	instanceName: string;
}
interface TelegramInstanceStatus extends TelegramGatewayStatus {
	instanceId: string;
	instanceName: string;
}
interface TelegramMultiInstanceConfig {
	instances: TelegramInstanceConfig[];
}
interface TelegramMultiInstanceStatus {
	instances: TelegramInstanceStatus[];
}
interface TelegramOpenClawConfig {
	enabled: boolean;
	botToken: string;
	dmPolicy: "pairing" | "allowlist" | "open" | "disabled";
	allowFrom: string[];
	groupPolicy: "allowlist" | "open" | "disabled";
	groupAllowFrom: string[];
	groups: Record<string, TelegramOpenClawGroupConfig>;
	historyLimit: number;
	replyToMode: "off" | "first" | "all";
	linkPreview: boolean;
	streaming: "off" | "partial" | "block" | "progress";
	mediaMaxMb: number;
	proxy: string;
	webhookUrl: string;
	webhookSecret: string;
	debug: boolean;
}
interface TelegramOpenClawGroupConfig {
	requireMention?: boolean;
	allowFrom?: string[];
	systemPrompt?: string;
}
interface UserProfile {
	yid: string;
	nickname: string;
	avatarUrl: string | null;
	phone?: string | null;
	userId?: string;
	id?: number;
	status?: number;
}
interface WecomConfig {
	enabled: boolean;
	botId: string;
	secret: string;
	dmPolicy: "open" | "pairing" | "allowlist" | "disabled";
	allowFrom: string[];
	groupPolicy: "open" | "allowlist" | "disabled";
	groupAllowFrom: string[];
	sendThinkingMessage: boolean;
	debug: boolean;
}
interface WecomGatewayStatus {
	connected: boolean;
	startedAt: number | null;
	lastError: string | null;
	botId: string | null;
	lastInboundAt: number | null;
	lastOutboundAt: number | null;
}
interface WecomInstanceConfig extends WecomConfig {
	instanceId: string;
	instanceName: string;
}
interface WecomInstanceStatus extends WecomGatewayStatus {
	instanceId: string;
	instanceName: string;
}
interface WecomMultiInstanceConfig {
	instances: WecomInstanceConfig[];
}
interface WecomMultiInstanceStatus {
	instances: WecomInstanceStatus[];
}
interface WeixinGatewayStatus {
	connected: boolean;
	accountId: string | null;
	startedAt: number | null;
	lastError: string | null;
	lastInboundAt: number | null;
	lastOutboundAt: number | null;
}
interface WeixinOpenClawConfig {
	enabled: boolean;
	accountId: string;
	dmPolicy: "open" | "pairing" | "allowlist" | "disabled";
	allowFrom: string[];
	groupPolicy: "open" | "allowlist" | "disabled";
	groupAllowFrom: string[];
	debug: boolean;
}
interface WindowState {
	isMaximized: boolean;
	isFullscreen: boolean;
	isFocused: boolean;
}
type AgentLegacyIdentityCleanupResult = {
	status: typeof AgentLegacyIdentityCleanupStatus.Cleaned;
	backupPath: string;
	removedChars: number;
} | {
	status: typeof AgentLegacyIdentityCleanupStatus.Skipped;
	reason: AgentLegacyIdentityCleanupSkipReason;
} | {
	status: typeof AgentLegacyIdentityCleanupStatus.Failed;
	error: string;
};
type AgentLegacyIdentityCleanupSkipReason = typeof AgentLegacyIdentityCleanupSkipReason[keyof typeof AgentLegacyIdentityCleanupSkipReason];
type AgentLegacyIdentityCleanupStatus = typeof AgentLegacyIdentityCleanupStatus[keyof typeof AgentLegacyIdentityCleanupStatus];
type AgentSource = "custom" | "preset";
type AppUpdateSource = typeof AppUpdateSource[keyof typeof AppUpdateSource];
type AppUpdateStatus = typeof AppUpdateStatus[keyof typeof AppUpdateStatus];
type AsrLangType = typeof AsrLangType[keyof typeof AsrLangType];
type AsrRealtimeSessionResult = {
	success: true;
	data: AsrRealtimeSessionData;
} | {
	success: false;
	code?: number;
	error?: string;
	message?: string;
};
type BrowserDiagnosticStatus = typeof BrowserDiagnosticStatus[keyof typeof BrowserDiagnosticStatus];
type BrowserDiagnosticStep = typeof BrowserDiagnosticStep[keyof typeof BrowserDiagnosticStep];
type BrowserRuntimeProfile = typeof BrowserRuntimeProfile[keyof typeof BrowserRuntimeProfile];
type CoworkConfigUpdate = Partial<Pick<CoworkConfig, "workingDirectory" | "executionMode" | "agentEngine" | "memoryEnabled" | "memoryImplicitUpdateEnabled" | "memoryLlmJudgeEnabled" | "memoryGuardLevel" | "memoryUserMemoriesMaxItems" | "skipMissedJobs" | "openClawHeartbeatEnabled" | "embeddingEnabled" | "embeddingProvider" | "embeddingModel" | "embeddingLocalModelPath" | "embeddingVectorWeight" | "embeddingRemoteBaseUrl" | "embeddingRemoteApiKey">>;
type CoworkContextUsageFailureReason = typeof CoworkContextUsageFailureReason[keyof typeof CoworkContextUsageFailureReason];
type CoworkContextUsageSource = typeof CoworkContextUsageSource[keyof typeof CoworkContextUsageSource];
type CoworkExecutionMode = "auto" | "local" | "sandbox";
type CoworkForkMode = typeof CoworkForkMode[keyof typeof CoworkForkMode];
type CoworkGoalStatus = typeof CoworkGoalStatus[keyof typeof CoworkGoalStatus];
type CoworkImageAttachment = CoworkImageAttachmentPayload;
type CoworkImageAttachmentPayload = {
	name: string;
	mimeType: string;
	base64Data: string;
	sizeBytes?: number;
	localPath?: string;
	previewMimeType?: string;
	previewBase64Data?: string;
};
type CoworkImageAttachmentPreview = {
	name: string;
	mimeType: string;
	base64Data: string;
	originalMimeType: string;
	originalSizeBytes: number;
	localPath?: string;
	isPreview: true;
};
type CoworkMessageType = "user" | "assistant" | "tool_use" | "tool_result" | "system";
type CoworkPermissionResult = {
	behavior: "allow";
	updatedInput?: Record<string, unknown>;
	updatedPermissions?: Record<string, unknown>[];
	toolUseID?: string;
} | {
	behavior: "deny";
	message: string;
	interrupt?: boolean;
	toolUseID?: string;
};
type CoworkSelectedTextSource = typeof CoworkSelectedTextSource[keyof typeof CoworkSelectedTextSource];
type CoworkSessionStatus = typeof CoworkSessionStatusValue[keyof typeof CoworkSessionStatusValue];
type CoworkSessionStatus$1 = "idle" | "running" | "completed" | "error";
type DataMigrationRestoreStatus = typeof DataMigrationRestoreStatus[keyof typeof DataMigrationRestoreStatus];
type DeliveryMode = typeof DeliveryMode[keyof typeof DeliveryMode];
type EmailConnectivityCheckCode = "imap_connection" | "smtp_connection";
type EmailConnectivityCheckLevel = "pass" | "fail";
type EmailConnectivityVerdict = "pass" | "fail";
type HtmlShareAccessMode = (typeof HtmlShareAccessMode)[keyof typeof HtmlShareAccessMode];
type HtmlShareConfigurableStatus = typeof HtmlShareStatus.Live | typeof HtmlShareStatus.Disabled;
type HtmlShareDisabledSource = (typeof HtmlShareDisabledSource)[keyof typeof HtmlShareDisabledSource];
type HtmlShareSourceType = (typeof HtmlShareSourceType)[keyof typeof HtmlShareSourceType];
type HtmlShareStatus = (typeof HtmlShareStatus)[keyof typeof HtmlShareStatus];
type IMConnectivityCheckCode = "missing_credentials" | "auth_check" | "gateway_running" | "inbound_activity" | "outbound_activity" | "platform_last_error" | "feishu_group_requires_mention" | "feishu_event_subscription_required" | "discord_group_requires_mention" | "telegram_privacy_mode_hint" | "dingtalk_bot_membership_hint" | "nim_p2p_only_hint" | "qq_guild_mention_hint";
type IMConnectivityCheckLevel = "pass" | "info" | "warn" | "fail";
type IMConnectivityVerdict = "pass" | "warn" | "fail";
type KitReferenceKind = typeof KitReferenceKind[keyof typeof KitReferenceKind];
type KitReferenceSource = typeof KitReferenceSource[keyof typeof KitReferenceSource];
type OpenClawEnginePhase = typeof OpenClawEnginePhase[keyof typeof OpenClawEnginePhase];
type OpenClawEnginePhase$1 = OpenClawEnginePhase;
type OpenClawGatewayRepairErrorCode = typeof OpenClawGatewayRepairErrorCode[keyof typeof OpenClawGatewayRepairErrorCode];
type OpenClawSessionResponseUsage = typeof OpenClawSessionResponseUsage[keyof typeof OpenClawSessionResponseUsage];
type OpenClawSessionSendPolicy = typeof OpenClawSessionSendPolicy[keyof typeof OpenClawSessionSendPolicy];
type Platform = (typeof DEFINITIONS)[number]["id"];
type Schedule = ScheduleAt | ScheduleEvery | ScheduleCron;
type ScheduledTaskPayload = AgentTurnPayload | SystemEventPayload;
type SessionTarget = typeof SessionTarget[keyof typeof SessionTarget];
type ShareDeploymentCandidateSource = (typeof ShareDeploymentCandidateSource)[keyof typeof ShareDeploymentCandidateSource];
type ShareDeploymentKind = (typeof ShareDeploymentKind)[keyof typeof ShareDeploymentKind];
type ShareDeploymentPackageManager = (typeof ShareDeploymentPackageManager)[keyof typeof ShareDeploymentPackageManager];
type ShareDeploymentStatus = (typeof ShareDeploymentStatus)[keyof typeof ShareDeploymentStatus];
type ShellOpenFailureReason = typeof ShellOpenFailureReason[keyof typeof ShellOpenFailureReason];
type TaskLastStatus = TaskStatus | null;
type TaskStatus = typeof TaskStatus[keyof typeof TaskStatus];
type WakeMode = typeof WakeMode[keyof typeof WakeMode];

export {};
