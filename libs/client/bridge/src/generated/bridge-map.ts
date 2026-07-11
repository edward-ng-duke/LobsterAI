// Generated file. Do not edit.
export const ElectronBridgeMap = [
  {
    "propertyPath": "platform",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "string",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI"
  },
  {
    "propertyPath": "arch",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "string",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI"
  },
  {
    "propertyPath": "store.get",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "(key: string) => Promise<any>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI"
  },
  {
    "propertyPath": "store.set",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "(key: string, value: any) => Promise<void>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI"
  },
  {
    "propertyPath": "store.remove",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "(key: string) => Promise<void>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI"
  },
  {
    "propertyPath": "skills.list",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "() => Promise<{ success: boolean; skills?: Skill[]; error?: string }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI"
  },
  {
    "propertyPath": "skills.setEnabled",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "(options: {\n      id: string;\n      enabled: boolean;\n    }) => Promise<{ success: boolean; skills?: Skill[]; error?: string }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI"
  },
  {
    "propertyPath": "skills.delete",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "(id: string) => Promise<{ success: boolean; skills?: Skill[]; error?: string }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI"
  },
  {
    "propertyPath": "skills.download",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "(source: string) => Promise<{\n      success: boolean;\n      skills?: Skill[];\n      error?: string;\n      auditReport?: any;\n      pendingInstallId?: string;\n    }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI"
  },
  {
    "propertyPath": "skills.upgrade",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "(\n      skillId: string,\n      downloadUrl: string,\n    ) => Promise<{\n      success: boolean;\n      skills?: Skill[];\n      error?: string;\n      auditReport?: any;\n      pendingInstallId?: string;\n    }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI"
  },
  {
    "propertyPath": "skills.confirmInstall",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "(\n      pendingId: string,\n      action: string,\n    ) => Promise<{ success: boolean; skills?: Skill[]; error?: string }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI"
  },
  {
    "propertyPath": "skills.getRoot",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "() => Promise<{ success: boolean; path?: string; error?: string }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI"
  },
  {
    "propertyPath": "skills.autoRoutingPrompt",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "() => Promise<{ success: boolean; prompt?: string | null; error?: string }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI"
  },
  {
    "propertyPath": "skills.getConfig",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "(\n      skillId: string,\n    ) => Promise<{ success: boolean; config?: Record<string, string>; error?: string }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI"
  },
  {
    "propertyPath": "skills.setConfig",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "(\n      skillId: string,\n      config: Record<string, string>,\n    ) => Promise<{ success: boolean; error?: string }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI"
  },
  {
    "propertyPath": "skills.getEmailAccountsConfig",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "(\n      skillId: string,\n    ) => Promise<{ success: boolean; config?: EmailSkillAccountsConfig; error?: string }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI"
  },
  {
    "propertyPath": "skills.setEmailAccountsConfig",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "(\n      skillId: string,\n      config: EmailSkillAccountsConfig,\n    ) => Promise<{ success: boolean; error?: string }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI"
  },
  {
    "propertyPath": "skills.testEmailAccountConnectivity",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "(\n      skillId: string,\n      account: EmailSkillAccountConfig,\n    ) => Promise<{ success: boolean; result?: EmailConnectivityTestResult; error?: string }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI"
  },
  {
    "propertyPath": "skills.testEmailConnectivity",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "(\n      skillId: string,\n      config: Record<string, string>,\n    ) => Promise<{ success: boolean; result?: EmailConnectivityTestResult; error?: string }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI"
  },
  {
    "propertyPath": "skills.fetchMarketplace",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "() => Promise<{ success: boolean; data?: string; error?: string }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI"
  },
  {
    "propertyPath": "skills.detectFromOpenClaw",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "() => Promise<{\n      skills: Array<{ name: string; description: string; skillKey: string; baseDir: string }>;\n      error?: string;\n    }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI"
  },
  {
    "propertyPath": "skills.syncFromOpenClaw",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "() => Promise<{ synced: string[]; error?: string }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI"
  },
  {
    "propertyPath": "skills.refreshPluginSkillIds",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "() => Promise<{ success: boolean; pluginSkillIds?: string[]; error?: string }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI"
  },
  {
    "propertyPath": "skills.onChanged",
    "transport": "stream",
    "disposition": "ga",
    "optional": false,
    "signature": "(callback: () => void) => () => void",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI"
  },
  {
    "propertyPath": "mcp.list",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "() => Promise<{ success: boolean; servers?: McpServerConfigIPC[]; error?: string }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI"
  },
  {
    "propertyPath": "mcp.create",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "(\n      data: any,\n    ) => Promise<{ success: boolean; servers?: McpServerConfigIPC[]; error?: string }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI"
  },
  {
    "propertyPath": "mcp.update",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "(\n      id: string,\n      data: any,\n    ) => Promise<{ success: boolean; servers?: McpServerConfigIPC[]; error?: string }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI"
  },
  {
    "propertyPath": "mcp.delete",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "(\n      id: string,\n    ) => Promise<{ success: boolean; servers?: McpServerConfigIPC[]; error?: string }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI"
  },
  {
    "propertyPath": "mcp.deleteByRegistryId",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "(\n      registryId: string,\n    ) => Promise<{ success: boolean; servers?: McpServerConfigIPC[]; error?: string }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI"
  },
  {
    "propertyPath": "mcp.setEnabled",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "(options: {\n      id: string;\n      enabled: boolean;\n    }) => Promise<{ success: boolean; servers?: McpServerConfigIPC[]; error?: string }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI"
  },
  {
    "propertyPath": "mcp.setEnabledByRegistryId",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "(options: {\n      registryId: string;\n      enabled: boolean;\n    }) => Promise<{ success: boolean; servers?: McpServerConfigIPC[]; error?: string }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI"
  },
  {
    "propertyPath": "mcp.retryLaunchResolution",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "(\n      id: string,\n    ) => Promise<{ success: boolean; servers?: McpServerConfigIPC[]; error?: string }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI"
  },
  {
    "propertyPath": "mcp.fetchMarketplace",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "() => Promise<{\n      success: boolean;\n      data?: McpMarketplaceData;\n      error?: string;\n    }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI"
  },
  {
    "propertyPath": "mcp.connectQichacha",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "() => Promise<{\n      success: boolean;\n      servers?: McpServerConfigIPC[];\n      error?: string;\n    }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI"
  },
  {
    "propertyPath": "mcp.onChanged",
    "transport": "stream",
    "disposition": "ga",
    "optional": false,
    "signature": "(callback: () => void) => () => void",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI"
  },
  {
    "propertyPath": "kits.fetchStore",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "() => Promise<{ success: boolean; data?: string; error?: string }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI"
  },
  {
    "propertyPath": "kits.install",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "(params: {\n      kitId: string;\n      bundleUrl: string;\n      version: string;\n      skillListIds: string[];\n      skillList?: KitSkillMetadata[];\n      mcpServers?: unknown[] | null;\n      connectors?: unknown[] | null;\n    }) => Promise<{ success: boolean; skillIds?: string[]; error?: string }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI"
  },
  {
    "propertyPath": "kits.uninstall",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "(kitId: string) => Promise<{ success: boolean; error?: string }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI"
  },
  {
    "propertyPath": "kits.listInstalled",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "() => Promise<{\n      success: boolean;\n      installed?: Record<string, InstalledKitRecord>;\n      error?: string;\n    }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI"
  },
  {
    "propertyPath": "agents.list",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "() => Promise<Agent[]>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI"
  },
  {
    "propertyPath": "agents.get",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "(id: string) => Promise<Agent | null>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI"
  },
  {
    "propertyPath": "agents.create",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "(request: {\n      id?: string;\n      name: string;\n      description?: string;\n      systemPrompt?: string;\n      identity?: string;\n      model?: string;\n      workingDirectory?: string;\n      icon?: string;\n      skillIds?: string[];\n      source?: string;\n      presetId?: string;\n    }) => Promise<Agent>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI"
  },
  {
    "propertyPath": "agents.update",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "(\n      id: string,\n      updates: {\n        name?: string;\n        description?: string;\n        systemPrompt?: string;\n        identity?: string;\n        model?: string;\n        workingDirectory?: string;\n        icon?: string;\n        skillIds?: string[];\n        enabled?: boolean;\n        pinned?: boolean;\n      },\n    ) => Promise<Agent>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI"
  },
  {
    "propertyPath": "agents.cleanupLegacyIdentityBlock",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "(id: string) => Promise<AgentLegacyIdentityCleanupResult>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI"
  },
  {
    "propertyPath": "agents.delete",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "(id: string) => Promise<boolean>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI"
  },
  {
    "propertyPath": "agents.presets",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "() => Promise<PresetAgent[]>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI"
  },
  {
    "propertyPath": "agents.presetTemplates",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "() => Promise<PresetAgent[]>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI"
  },
  {
    "propertyPath": "agents.addPreset",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "(presetId: string) => Promise<Agent>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI"
  },
  {
    "propertyPath": "api.fetch",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "(options: {\n      url: string;\n      method: string;\n      headers: Record<string, string>;\n      body?: string;\n    }) => Promise<ApiResponse>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI"
  },
  {
    "propertyPath": "api.stream",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "(options: {\n      url: string;\n      method: string;\n      headers: Record<string, string>;\n      body?: string;\n      requestId: string;\n    }) => Promise<ApiStreamResponse>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI"
  },
  {
    "propertyPath": "api.cancelStream",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "(requestId: string) => Promise<boolean>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI"
  },
  {
    "propertyPath": "api.onStreamData",
    "transport": "stream",
    "disposition": "ga",
    "optional": false,
    "signature": "(requestId: string, callback: (chunk: string) => void) => () => void",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI"
  },
  {
    "propertyPath": "api.onStreamDone",
    "transport": "stream",
    "disposition": "ga",
    "optional": false,
    "signature": "(requestId: string, callback: () => void) => () => void",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI"
  },
  {
    "propertyPath": "api.onStreamError",
    "transport": "stream",
    "disposition": "ga",
    "optional": false,
    "signature": "(requestId: string, callback: (error: string) => void) => () => void",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI"
  },
  {
    "propertyPath": "api.onStreamAbort",
    "transport": "stream",
    "disposition": "ga",
    "optional": false,
    "signature": "(requestId: string, callback: () => void) => () => void",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI"
  },
  {
    "propertyPath": "getApiConfig",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "() => Promise<CoworkApiConfig | null>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI"
  },
  {
    "propertyPath": "checkApiConfig",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "(options?: {\n    probeModel?: boolean;\n  }) => Promise<{ hasConfig: boolean; config: CoworkApiConfig | null; error?: string }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI"
  },
  {
    "propertyPath": "saveApiConfig",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "(config: CoworkApiConfig) => Promise<{ success: boolean; error?: string }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI"
  },
  {
    "propertyPath": "generateSessionTitle",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "(userInput: string | null) => Promise<string>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI"
  },
  {
    "propertyPath": "getRecentCwds",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "(limit?: number) => Promise<string[]>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI"
  },
  {
    "propertyPath": "openclaw.engine.getStatus",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "() => Promise<{ success: boolean; status?: OpenClawEngineStatus; error?: string }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI"
  },
  {
    "propertyPath": "openclaw.engine.install",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "() => Promise<{ success: boolean; status?: OpenClawEngineStatus; error?: string }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI"
  },
  {
    "propertyPath": "openclaw.engine.retryInstall",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "() => Promise<{\n        success: boolean;\n        status?: OpenClawEngineStatus;\n        error?: string;\n      }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI"
  },
  {
    "propertyPath": "openclaw.engine.restartGateway",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "() => Promise<{\n        success: boolean;\n        status?: OpenClawEngineStatus;\n        error?: string;\n      }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI"
  },
  {
    "propertyPath": "openclaw.engine.repairGatewayState",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "() => Promise<OpenClawGatewayRepairResult>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI"
  },
  {
    "propertyPath": "openclaw.engine.onProgress",
    "transport": "stream",
    "disposition": "ga",
    "optional": false,
    "signature": "(callback: (status: OpenClawEngineStatus) => void) => () => void",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI"
  },
  {
    "propertyPath": "openclaw.sessionPolicy.get",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "() => Promise<{\n        success: boolean;\n        config?: OpenClawSessionPolicyConfig;\n        error?: string;\n      }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI"
  },
  {
    "propertyPath": "openclaw.sessionPolicy.set",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "(\n        config: OpenClawSessionPolicyConfig,\n      ) => Promise<{ success: boolean; config?: OpenClawSessionPolicyConfig; error?: string }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI"
  },
  {
    "propertyPath": "openclaw.session.patch",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "(options: {\n        sessionId: string;\n        patch: OpenClawSessionPatch;\n      }) => Promise<{ success: boolean; session?: CoworkSession; error?: string }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI"
  },
  {
    "propertyPath": "openclaw.browser.getStatus",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "(options?: { profile?: BrowserRuntimeProfile }) => Promise<{ success: boolean; status?: Record<string, unknown>; error?: string }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI"
  },
  {
    "propertyPath": "openclaw.browser.listProfiles",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "() => Promise<{ success: boolean; profiles?: unknown[]; error?: string }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI"
  },
  {
    "propertyPath": "openclaw.browser.test",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "(options?: { profile?: BrowserRuntimeProfile }) => Promise<BrowserDiagnosticResult>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI"
  },
  {
    "propertyPath": "openclaw.browser.resetProfile",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "(options?: { profile?: BrowserRuntimeProfile }) => Promise<{ success: boolean; result?: Record<string, unknown>; error?: string }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI"
  },
  {
    "propertyPath": "openclaw.dataMigration.backup",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "() => Promise<DataMigrationBackupResult>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI"
  },
  {
    "propertyPath": "openclaw.dataMigration.restore",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "() => Promise<DataMigrationRestoreScheduleResult>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI"
  },
  {
    "propertyPath": "openclaw.dataMigration.getLastRestoreResult",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "() => Promise<DataMigrationLastRestoreResponse>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI"
  },
  {
    "propertyPath": "ipcRenderer.send",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "(channel: string, ...args: any[]) => void",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI"
  },
  {
    "propertyPath": "ipcRenderer.on",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "(channel: string, func: (...args: any[]) => void) => () => void",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI"
  },
  {
    "propertyPath": "window.minimize",
    "transport": "browser",
    "disposition": "browser-fallback",
    "optional": false,
    "signature": "() => void",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI"
  },
  {
    "propertyPath": "window.toggleMaximize",
    "transport": "browser",
    "disposition": "browser-fallback",
    "optional": false,
    "signature": "() => void",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI"
  },
  {
    "propertyPath": "window.close",
    "transport": "browser",
    "disposition": "browser-fallback",
    "optional": false,
    "signature": "() => void",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI"
  },
  {
    "propertyPath": "window.isMaximized",
    "transport": "browser",
    "disposition": "browser-fallback",
    "optional": false,
    "signature": "() => Promise<boolean>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI"
  },
  {
    "propertyPath": "window.showSystemMenu",
    "transport": "browser",
    "disposition": "browser-fallback",
    "optional": false,
    "signature": "(position: { x: number; y: number }) => void",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI"
  },
  {
    "propertyPath": "window.onStateChanged",
    "transport": "browser",
    "disposition": "browser-fallback",
    "optional": false,
    "signature": "(callback: (state: WindowState) => void) => () => void",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI"
  },
  {
    "propertyPath": "cowork.startSession",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "(options: {\n      prompt: string;\n      cwd?: string;\n      systemPrompt?: string;\n      title?: string;\n      activeSkillIds?: string[];\n      runtimeSkillIds?: string[];\n      kitIds?: string[];\n      kitReferences?: KitReference[];\n      resolvedKitCapabilities?: ResolvedKitCapabilities;\n      selectedTextSnippets?: Array<{ id: string; text: string; sourceMessageId?: string; sourceMessageType?: 'assistant' | 'artifact_markdown' | 'artifact_text'; sourceId?: string; sourceType?: 'assistant' | 'artifact_markdown' | 'artifact_text'; sourceTitle?: string; sourcePath?: string; artifactId?: string; createdAt: number; startOffset?: number; endOffset?: number }>;\n      agentId?: string;\n      imageAttachments?: Array<{ name: string; mimeType: string; base64Data: string; sizeBytes?: number; localPath?: string; previewMimeType?: string; previewBase64Data?: string }>;\n      mediaSelection?: { mode: string; modelId?: string; modelName?: string; imageModelId?: string; videoModelId?: string };\n      mediaReferences?: Array<{ token: string; mediaType: string; index: number; fileId: string; fileName: string; mimeType: string; localPath?: string; remoteUrl?: string; dataUrl?: string; role?: string }>;\n    }) => Promise<{\n      success: boolean;\n      session?: CoworkSession;\n      error?: string;\n      code?: string;\n      engineStatus?: OpenClawEngineStatus;\n    }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI"
  },
  {
    "propertyPath": "cowork.continueSession",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "(options: {\n      sessionId: string;\n      prompt: string;\n      systemPrompt?: string;\n      activeSkillIds?: string[];\n      runtimeSkillIds?: string[];\n      kitIds?: string[];\n      kitReferences?: KitReference[];\n      resolvedKitCapabilities?: ResolvedKitCapabilities;\n      selectedTextSnippets?: Array<{ id: string; text: string; sourceMessageId?: string; sourceMessageType?: 'assistant' | 'artifact_markdown' | 'artifact_text'; sourceId?: string; sourceType?: 'assistant' | 'artifact_markdown' | 'artifact_text'; sourceTitle?: string; sourcePath?: string; artifactId?: string; createdAt: number; startOffset?: number; endOffset?: number }>;\n      imageAttachments?: Array<{ name: string; mimeType: string; base64Data: string; sizeBytes?: number; localPath?: string; previewMimeType?: string; previewBase64Data?: string }>;\n      mediaSelection?: { mode: string; modelId?: string; modelName?: string; imageModelId?: string; videoModelId?: string };\n      mediaReferences?: Array<{ token: string; mediaType: string; index: number; fileId: string; fileName: string; mimeType: string; localPath?: string; remoteUrl?: string; dataUrl?: string; role?: string }>;\n    }) => Promise<{\n      success: boolean;\n      session?: CoworkSession;\n      error?: string;\n      code?: string;\n      engineStatus?: OpenClawEngineStatus;\n    }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI"
  },
  {
    "propertyPath": "cowork.runGoalCommand",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "(options: { sessionId: string; command: string }) => Promise<{\n      success: boolean;\n      goal?: CoworkGoal | null;\n      error?: string;\n      code?: string;\n      engineStatus?: OpenClawEngineStatus;\n    }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI"
  },
  {
    "propertyPath": "cowork.stopSession",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "(sessionId: string) => Promise<{ success: boolean; error?: string }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI"
  },
  {
    "propertyPath": "cowork.deleteSession",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "(sessionId: string) => Promise<{ success: boolean; error?: string }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI"
  },
  {
    "propertyPath": "cowork.deleteSessions",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "(sessionIds: string[]) => Promise<{ success: boolean; error?: string }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI"
  },
  {
    "propertyPath": "cowork.setSessionPinned",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "(options: {\n      sessionId: string;\n      pinned: boolean;\n    }) => Promise<{ success: boolean; pinOrder?: number | null; error?: string }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI"
  },
  {
    "propertyPath": "cowork.renameSession",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "(options: {\n      sessionId: string;\n      title: string;\n    }) => Promise<{ success: boolean; error?: string }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI"
  },
  {
    "propertyPath": "cowork.forkSession",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "(options: {\n      sessionId: string;\n      forkedFromMessageId?: string | null;\n      title?: string;\n    }) => Promise<{ success: boolean; session?: CoworkSession; error?: string }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI"
  },
  {
    "propertyPath": "cowork.getSession",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "(\n      sessionId: string,\n    ) => Promise<{ success: boolean; session?: CoworkSession; error?: string }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI"
  },
  {
    "propertyPath": "cowork.markSessionViewed",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "(\n      sessionId: string,\n    ) => Promise<{ success: boolean; error?: string }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI"
  },
  {
    "propertyPath": "cowork.remoteManaged",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "(\n      sessionId: string,\n    ) => Promise<{ success: boolean; remoteManaged: boolean; error?: string }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI"
  },
  {
    "propertyPath": "cowork.listSessions",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "(options?: { limit?: number; offset?: number; agentId?: string; searchQuery?: string }) => Promise<{\n      success: boolean;\n      sessions?: CoworkSessionSummary[];\n      hasMore?: boolean;\n      error?: string;\n    }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI"
  },
  {
    "propertyPath": "cowork.getContextUsage",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "(\n      sessionId: string,\n    ) => Promise<{\n      success: boolean;\n      usage?: CoworkContextUsage | null;\n      source?: CoworkContextUsageSource;\n      reason?: CoworkContextUsageFailureReason;\n      error?: string;\n    }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI"
  },
  {
    "propertyPath": "cowork.compactContext",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "(\n      sessionId: string,\n    ) => Promise<{\n      success: boolean;\n      compacted?: boolean;\n      reason?: string;\n      usage?: CoworkContextUsage | null;\n      error?: string;\n    }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI"
  },
  {
    "propertyPath": "cowork.getSessionMessages",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "(options: {\n      sessionId: string;\n      limit?: number;\n      offset?: number;\n    }) => Promise<{\n      success: boolean;\n      messages?: CoworkMessage[];\n      offset?: number;\n      total?: number;\n      error?: string;\n    }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI"
  },
  {
    "propertyPath": "cowork.getSessionMessageRailIndex",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "(\n      sessionId: string,\n    ) => Promise<{\n      success: boolean;\n      items?: CoworkMessageRailIndexItem[];\n      error?: string;\n    }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI"
  },
  {
    "propertyPath": "cowork.exportResultImage",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "(options: {\n      rect: { x: number; y: number; width: number; height: number };\n      defaultFileName?: string;\n    }) => Promise<{ success: boolean; canceled?: boolean; path?: string; error?: string }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI"
  },
  {
    "propertyPath": "cowork.captureImageChunk",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "(options: {\n      rect: { x: number; y: number; width: number; height: number };\n    }) => Promise<{\n      success: boolean;\n      width?: number;\n      height?: number;\n      pngBase64?: string;\n      error?: string;\n    }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI"
  },
  {
    "propertyPath": "cowork.saveResultImage",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "(options: {\n      pngBase64: string;\n      defaultFileName?: string;\n    }) => Promise<{ success: boolean; canceled?: boolean; path?: string; error?: string }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI"
  },
  {
    "propertyPath": "cowork.exportSessionText",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "(options: {\n      content: string;\n      defaultFileName?: string;\n      fileExtension?: string;\n    }) => Promise<{ success: boolean; canceled?: boolean; path?: string; error?: string }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI"
  },
  {
    "propertyPath": "cowork.exportSessionDiagnostics",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "(options: {\n      sessionId: string;\n    }) => Promise<{ success: boolean; canceled?: boolean; path?: string; error?: string }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI"
  },
  {
    "propertyPath": "cowork.cancelMediaTask",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "(taskId: string) => Promise<{ success: boolean; message?: string }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI"
  },
  {
    "propertyPath": "cowork.getSubTaskHistory",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "(options: {\n      parentSessionId: string;\n      agentId: string;\n      sessionKey?: string;\n    }) => Promise<{\n      success: boolean;\n      messages?: Array<{\n        id: string;\n        type: 'user' | 'assistant' | 'tool_use' | 'tool_result' | 'system';\n        content: string;\n        timestamp: number;\n        metadata?: {\n          toolName?: string;\n          toolInput?: Record<string, unknown>;\n          toolResult?: string;\n          toolUseId?: string | null;\n          isError?: boolean;\n          [key: string]: unknown;\n        };\n      }>;\n      error?: string;\n    }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI"
  },
  {
    "propertyPath": "cowork.listSubagentSessions",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "(parentSessionId: string) => Promise<{\n      success: boolean;\n      runs?: Array<{\n        id: string;\n        agentId: string | null;\n        task: string | null;\n        label: string | null;\n        sessionKey: string | null;\n        status: 'running' | 'done' | 'error';\n        createdAt: number;\n        endedAt: number | null;\n      }>;\n      error?: string;\n    }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI"
  },
  {
    "propertyPath": "cowork.deleteSubagentSession",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "(options: {\n      parentSessionId: string;\n      runId: string;\n    }) => Promise<{ success: boolean; deleted?: boolean; error?: string }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI"
  },
  {
    "propertyPath": "cowork.respondToPermission",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "(options: {\n      requestId: string;\n      result: CoworkPermissionResult;\n    }) => Promise<{ success: boolean; error?: string }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI"
  },
  {
    "propertyPath": "cowork.getConfig",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "() => Promise<{ success: boolean; config?: CoworkConfig; error?: string }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI"
  },
  {
    "propertyPath": "cowork.setConfig",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "(config: CoworkConfigUpdate) => Promise<{ success: boolean; error?: string }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI"
  },
  {
    "propertyPath": "cowork.getDreamingStatus",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "() => Promise<{ success: boolean; data?: Record<string, unknown> | null; error?: string }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI"
  },
  {
    "propertyPath": "cowork.getDreamDiary",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "() => Promise<{ success: boolean; data?: Record<string, unknown>; error?: string }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI"
  },
  {
    "propertyPath": "cowork.notifyOpenSessionFromNotificationReady",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "() => Promise<{ success: boolean; error?: string }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI"
  },
  {
    "propertyPath": "cowork.onOpenSessionFromNotification",
    "transport": "stream",
    "disposition": "ga",
    "optional": false,
    "signature": "(\n      callback: (data: { sessionId: string }) => void,\n    ) => () => void",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI"
  },
  {
    "propertyPath": "cowork.listMemoryEntries",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "(input: {\n      query?: string;\n      limit?: number;\n      offset?: number;\n    }) => Promise<{ success: boolean; entries?: CoworkUserMemoryEntry[]; error?: string }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI"
  },
  {
    "propertyPath": "cowork.createMemoryEntry",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "(input: {\n      text: string;\n    }) => Promise<{ success: boolean; entry?: CoworkUserMemoryEntry; error?: string }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI"
  },
  {
    "propertyPath": "cowork.updateMemoryEntry",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "(input: {\n      id: string;\n      text: string;\n    }) => Promise<{ success: boolean; entry?: CoworkUserMemoryEntry; error?: string }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI"
  },
  {
    "propertyPath": "cowork.deleteMemoryEntry",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "(input: { id: string }) => Promise<{ success: boolean; error?: string }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI"
  },
  {
    "propertyPath": "cowork.getMemoryStats",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "() => Promise<{ success: boolean; stats?: CoworkMemoryStats; error?: string }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI"
  },
  {
    "propertyPath": "cowork.readMemoryFileRaw",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "() => Promise<{ success: boolean; content?: string; error?: string }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI"
  },
  {
    "propertyPath": "cowork.writeMemoryFileRaw",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "(input: {\n      content: string;\n    }) => Promise<{ success: boolean; error?: string }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI"
  },
  {
    "propertyPath": "cowork.readBootstrapFile",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "(\n      filename: string,\n    ) => Promise<{ success: boolean; content: string; error?: string }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI"
  },
  {
    "propertyPath": "cowork.writeBootstrapFile",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "(\n      filename: string,\n      content: string,\n    ) => Promise<{ success: boolean; error?: string }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI"
  },
  {
    "propertyPath": "cowork.onStreamMessage",
    "transport": "stream",
    "disposition": "ga",
    "optional": false,
    "signature": "(\n      callback: (data: { sessionId: string; message: CoworkMessage; beforeMessageId?: string }) => void,\n    ) => () => void",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI"
  },
  {
    "propertyPath": "cowork.onStreamMessageUpdate",
    "transport": "stream",
    "disposition": "ga",
    "optional": false,
    "signature": "(\n      callback: (data: {\n        sessionId: string;\n        messageId: string;\n        content: string;\n        metadata?: Record<string, unknown>;\n      }) => void,\n    ) => () => void",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI"
  },
  {
    "propertyPath": "cowork.onMediaStatusPollUpdate",
    "transport": "stream",
    "disposition": "ga",
    "optional": true,
    "signature": "(\n      callback: (data: { sessionId: string; toolCallId: string; details: Record<string, unknown> }) => void,\n    ) => () => void",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI"
  },
  {
    "propertyPath": "cowork.onStreamSessionStatus",
    "transport": "stream",
    "disposition": "ga",
    "optional": false,
    "signature": "(\n      callback: (data: { sessionId: string; status: CoworkSessionStatus }) => void,\n    ) => () => void",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI"
  },
  {
    "propertyPath": "cowork.onStreamContextUsage",
    "transport": "stream",
    "disposition": "ga",
    "optional": true,
    "signature": "(\n      callback: (data: { sessionId: string; usage: CoworkContextUsage }) => void,\n    ) => () => void",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI"
  },
  {
    "propertyPath": "cowork.onStreamGoal",
    "transport": "stream",
    "disposition": "ga",
    "optional": true,
    "signature": "(\n      callback: (data: { sessionId: string; goal: CoworkGoal | null }) => void,\n    ) => () => void",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI"
  },
  {
    "propertyPath": "cowork.onStreamContextMaintenance",
    "transport": "stream",
    "disposition": "ga",
    "optional": true,
    "signature": "(\n      callback: (data: { sessionId: string; active: boolean }) => void,\n    ) => () => void",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI"
  },
  {
    "propertyPath": "cowork.onStreamPermission",
    "transport": "stream",
    "disposition": "ga",
    "optional": false,
    "signature": "(\n      callback: (data: { sessionId: string; request: CoworkPermissionRequest }) => void,\n    ) => () => void",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI"
  },
  {
    "propertyPath": "cowork.onStreamPermissionDismiss",
    "transport": "stream",
    "disposition": "ga",
    "optional": false,
    "signature": "(callback: (data: { requestId: string }) => void) => () => void",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI"
  },
  {
    "propertyPath": "cowork.onStreamComplete",
    "transport": "stream",
    "disposition": "ga",
    "optional": false,
    "signature": "(\n      callback: (data: { sessionId: string; claudeSessionId: string | null }) => void,\n    ) => () => void",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI"
  },
  {
    "propertyPath": "cowork.onStreamError",
    "transport": "stream",
    "disposition": "ga",
    "optional": false,
    "signature": "(callback: (data: { sessionId: string; error: string }) => void) => () => void",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI"
  },
  {
    "propertyPath": "cowork.onSessionsChanged",
    "transport": "stream",
    "disposition": "ga",
    "optional": false,
    "signature": "(callback: () => void) => () => void",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI"
  },
  {
    "propertyPath": "cowork.onSessionModelOverrideChanged",
    "transport": "stream",
    "disposition": "ga",
    "optional": true,
    "signature": "(\n      callback: (data: { sessionId: string; modelOverride: string }) => void,\n    ) => () => void",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI"
  },
  {
    "propertyPath": "dialog.selectDirectory",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "() => Promise<{ success: boolean; path: string | null }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI"
  },
  {
    "propertyPath": "dialog.selectFile",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "(options?: {\n      title?: string;\n      filters?: { name: string; extensions: string[] }[];\n    }) => Promise<{ success: boolean; path: string | null }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI"
  },
  {
    "propertyPath": "dialog.selectFiles",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "(options?: {\n      title?: string;\n      filters?: { name: string; extensions: string[] }[];\n    }) => Promise<{ success: boolean; paths: string[] }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI"
  },
  {
    "propertyPath": "dialog.saveInlineFile",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "(options: {\n      dataBase64: string;\n      fileName?: string;\n      mimeType?: string;\n      cwd?: string;\n    }) => Promise<{ success: boolean; path: string | null; error?: string }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI"
  },
  {
    "propertyPath": "dialog.readFileAsDataUrl",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "(\n      filePath: string,\n    ) => Promise<{ success: boolean; dataUrl?: string; error?: string }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI"
  },
  {
    "propertyPath": "dialog.statFile",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "(\n      filePath: string,\n    ) => Promise<{ success: boolean; isFile?: boolean; size?: number; mtimeMs?: number; error?: string }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI"
  },
  {
    "propertyPath": "dialog.readTextFile",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "(\n      filePath: string,\n    ) => Promise<{\n      success: boolean;\n      content?: string;\n      size?: number;\n      readBytes?: number;\n      truncated?: boolean;\n      error?: string;\n    }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI"
  },
  {
    "propertyPath": "dialog.generateThumbnail",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "(\n      filePath: string,\n    ) => Promise<{ success: boolean; dataUrl?: string; error?: string }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI"
  },
  {
    "propertyPath": "dialog.showMessageBox",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "(options: {\n      message: string;\n      type?: 'none' | 'info' | 'error' | 'question' | 'warning';\n      title?: string;\n    }) => Promise<{ response: number }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI"
  },
  {
    "propertyPath": "shell.openPath",
    "transport": "browser",
    "disposition": "browser-fallback",
    "optional": false,
    "signature": "(filePath: string) => Promise<ShellActionResponse>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI"
  },
  {
    "propertyPath": "shell.showItemInFolder",
    "transport": "browser",
    "disposition": "browser-fallback",
    "optional": false,
    "signature": "(filePath: string) => Promise<ShellActionResponse>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI"
  },
  {
    "propertyPath": "shell.openExternal",
    "transport": "browser",
    "disposition": "browser-fallback",
    "optional": false,
    "signature": "(url: string) => Promise<{ success: boolean; error?: string }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI"
  },
  {
    "propertyPath": "shell.openHtmlInBrowser",
    "transport": "browser",
    "disposition": "browser-fallback",
    "optional": false,
    "signature": "(htmlContent: string) => Promise<{ success: boolean; error?: string }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI"
  },
  {
    "propertyPath": "shell.getAppsForFile",
    "transport": "browser",
    "disposition": "browser-fallback",
    "optional": false,
    "signature": "(\n      filePath: string,\n    ) => Promise<{\n      success: boolean;\n      apps: Array<{ name: string; path: string; isDefault: boolean; icon?: string }>;\n      error?: string;\n    }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI"
  },
  {
    "propertyPath": "shell.getBrowserApps",
    "transport": "browser",
    "disposition": "browser-fallback",
    "optional": false,
    "signature": "(options?: ShellGetBrowserAppsInput) => Promise<{\n      success: boolean;\n      apps: Array<{ name: string; path: string; isDefault: boolean; icon?: string }>;\n      error?: string;\n    }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI"
  },
  {
    "propertyPath": "shell.openPathWithApp",
    "transport": "browser",
    "disposition": "browser-fallback",
    "optional": false,
    "signature": "(\n      filePath: string,\n      appPath: string,\n    ) => Promise<ShellActionResponse>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI"
  },
  {
    "propertyPath": "shell.openUrlWithApp",
    "transport": "browser",
    "disposition": "browser-fallback",
    "optional": false,
    "signature": "(\n      url: string,\n      appPath: string,\n    ) => Promise<ShellActionResponse>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI"
  },
  {
    "propertyPath": "clipboard.writeText",
    "transport": "browser",
    "disposition": "browser-fallback",
    "optional": false,
    "signature": "(text: string) => Promise<{ success: boolean; error?: string }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI"
  },
  {
    "propertyPath": "clipboard.writeImageFromFile",
    "transport": "browser",
    "disposition": "browser-fallback",
    "optional": false,
    "signature": "(filePath: string) => Promise<{ success: boolean; error?: string }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI"
  },
  {
    "propertyPath": "clipboard.writeImageFromDataUrl",
    "transport": "browser",
    "disposition": "browser-fallback",
    "optional": false,
    "signature": "(dataUrl: string) => Promise<{ success: boolean; error?: string }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI"
  },
  {
    "propertyPath": "htmlShare.createFromHtmlFile",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "(options: {\n      sessionId: string;\n      artifactId: string;\n      filePath: string;\n      title: string;\n      accessMode?: HtmlShareAccessMode;\n    }) => Promise<HtmlShareResult>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI"
  },
  {
    "propertyPath": "htmlShare.updateFromHtmlFile",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "(options: {\n      shareId: string;\n      sessionId: string;\n      artifactId: string;\n      filePath: string;\n      title: string;\n      currentStatus?: HtmlShareStatus;\n      accessMode?: HtmlShareAccessMode;\n    }) => Promise<HtmlShareResult>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI"
  },
  {
    "propertyPath": "htmlShare.getByHtmlFile",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "(options: {\n      filePath: string;\n    }) => Promise<{ success: boolean; share?: HtmlShareResult | null; error?: string; code?: number }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI"
  },
  {
    "propertyPath": "htmlShare.createFromArtifactFile",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "(options: {\n      sourceType: HtmlShareSourceType;\n      sessionId: string;\n      artifactId: string;\n      title: string;\n      accessMode?: HtmlShareAccessMode;\n      fileName?: string;\n      filePath?: string;\n      content?: string;\n      remoteUrl?: string;\n    }) => Promise<HtmlShareResult>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI"
  },
  {
    "propertyPath": "htmlShare.updateFromArtifactFile",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "(options: {\n      sourceType: HtmlShareSourceType;\n      shareId: string;\n      sessionId: string;\n      artifactId: string;\n      title: string;\n      accessMode?: HtmlShareAccessMode;\n      fileName?: string;\n      filePath?: string;\n      content?: string;\n      remoteUrl?: string;\n      currentStatus?: HtmlShareStatus;\n    }) => Promise<HtmlShareResult>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI"
  },
  {
    "propertyPath": "htmlShare.getByArtifactFile",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "(options: {\n      sourceType: HtmlShareSourceType;\n      sessionId?: string;\n      artifactId?: string;\n      filePath?: string;\n    }) => Promise<{ success: boolean; share?: HtmlShareResult | null; error?: string; code?: number }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI"
  },
  {
    "propertyPath": "htmlShare.updateStatus",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "(options: {\n      shareId: string;\n      status: HtmlShareConfigurableStatus;\n    }) => Promise<HtmlShareResult>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI"
  },
  {
    "propertyPath": "htmlShare.updateAccessMode",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "(options: {\n      shareId: string;\n      accessMode: HtmlShareAccessMode;\n    }) => Promise<HtmlShareResult>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI"
  },
  {
    "propertyPath": "htmlShare.disable",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "(shareId: string) => Promise<HtmlShareResult>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI"
  },
  {
    "propertyPath": "htmlShare.get",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "(shareId: string) => Promise<{ success: boolean; share?: unknown; error?: string }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI"
  },
  {
    "propertyPath": "shareDeployment.detectProjectCandidates",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "(\n      options: ShareDeploymentDetectCandidatesInput,\n    ) => Promise<ShareDeploymentDetectCandidatesResult>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI"
  },
  {
    "propertyPath": "shareDeployment.analyzeProjectDirectory",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "(\n      options: ShareDeploymentAnalyzeProjectInput,\n    ) => Promise<ShareDeploymentProjectAnalysis>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI"
  },
  {
    "propertyPath": "shareDeployment.createNodeDeployment",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "(\n      options: ShareDeploymentCreateNodeInput,\n    ) => Promise<ShareDeploymentResult>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI"
  },
  {
    "propertyPath": "shareDeployment.get",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "(deploymentId: string) => Promise<ShareDeploymentResult>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI"
  },
  {
    "propertyPath": "shareDeployment.getByLocalService",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "(options: ShareDeploymentGetByLocalServiceInput) => Promise<ShareDeploymentResult>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI"
  },
  {
    "propertyPath": "asr.createRealtimeSession",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "(options: AsrRealtimeSessionRequest) => Promise<AsrRealtimeSessionResult>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI"
  },
  {
    "propertyPath": "artifact.watchFile",
    "transport": "stream",
    "disposition": "ga",
    "optional": false,
    "signature": "(filePath: string) => Promise<void>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI"
  },
  {
    "propertyPath": "artifact.unwatchFile",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "(filePath: string) => Promise<void>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI"
  },
  {
    "propertyPath": "artifact.onFileChanged",
    "transport": "stream",
    "disposition": "ga",
    "optional": false,
    "signature": "(callback: (data: { filePath: string }) => void) => () => void",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI"
  },
  {
    "propertyPath": "artifact.createPreviewSession",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "(\n      filePath: string,\n    ) => Promise<{ success: boolean; sessionId?: string; url?: string; error?: string }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI"
  },
  {
    "propertyPath": "artifact.createOfficePreviewSession",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "(\n      filePath: string,\n    ) => Promise<{ success: boolean; sessionId?: string; url?: string; error?: string }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI"
  },
  {
    "propertyPath": "artifact.destroyPreviewSession",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "(sessionId: string) => Promise<{ success: boolean }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI"
  },
  {
    "propertyPath": "artifact.clearBrowserCookies",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "() => Promise<{ success: boolean; error?: string }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI"
  },
  {
    "propertyPath": "artifact.clearBrowserCache",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "() => Promise<{ success: boolean; error?: string }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI"
  },
  {
    "propertyPath": "artifact.listLocalWebServices",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "(options?: ListLocalWebServicesOptions) => Promise<LocalWebService[]>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI"
  },
  {
    "propertyPath": "autoLaunch.get",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "() => Promise<{ enabled: boolean }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI"
  },
  {
    "propertyPath": "autoLaunch.set",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "(enabled: boolean) => Promise<{ success: boolean; enabled?: boolean; error?: string; errorCode?: string }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI"
  },
  {
    "propertyPath": "preventSleep.get",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "() => Promise<{ enabled: boolean }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI"
  },
  {
    "propertyPath": "preventSleep.set",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "(enabled: boolean) => Promise<{ success: boolean; error?: string }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI"
  },
  {
    "propertyPath": "appInfo.getVersion",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "() => Promise<string>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI"
  },
  {
    "propertyPath": "appInfo.getSystemLocale",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "() => Promise<string>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI"
  },
  {
    "propertyPath": "appInfo.getKeyfromAttribution",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "() => Promise<{\n      firstKeyfrom: string;\n      latestKeyfrom: string;\n      updatedAt: number;\n    }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI"
  },
  {
    "propertyPath": "appInfo.relaunch",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "() => Promise<void>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI"
  },
  {
    "propertyPath": "appUpdate.getState",
    "transport": "unsupported",
    "disposition": "deferred",
    "optional": false,
    "signature": "() => Promise<AppUpdateRuntimeState>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI"
  },
  {
    "propertyPath": "appUpdate.checkNow",
    "transport": "unsupported",
    "disposition": "deferred",
    "optional": false,
    "signature": "(options?: {\n      manual?: boolean;\n      userId?: string | null;\n    }) => Promise<AppUpdateCheckResult>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI"
  },
  {
    "propertyPath": "appUpdate.retryDownload",
    "transport": "unsupported",
    "disposition": "deferred",
    "optional": false,
    "signature": "() => Promise<{ success: boolean; state: AppUpdateRuntimeState }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI"
  },
  {
    "propertyPath": "appUpdate.cancelDownload",
    "transport": "unsupported",
    "disposition": "deferred",
    "optional": false,
    "signature": "() => Promise<{ success: boolean; state: AppUpdateRuntimeState }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI"
  },
  {
    "propertyPath": "appUpdate.installReady",
    "transport": "unsupported",
    "disposition": "deferred",
    "optional": false,
    "signature": "() => Promise<{ success: boolean; state: AppUpdateRuntimeState; error?: string }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI"
  },
  {
    "propertyPath": "appUpdate.onStateChanged",
    "transport": "unsupported",
    "disposition": "deferred",
    "optional": false,
    "signature": "(callback: (data: AppUpdateRuntimeState) => void) => () => void",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI"
  },
  {
    "propertyPath": "log.getPath",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "() => Promise<string>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI"
  },
  {
    "propertyPath": "log.openFolder",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "() => Promise<void>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI"
  },
  {
    "propertyPath": "log.exportZip",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "() => Promise<{\n      success: boolean;\n      canceled?: boolean;\n      path?: string;\n      missingEntries?: string[];\n      error?: string;\n    }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI"
  },
  {
    "propertyPath": "log.fromRenderer",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "(level: string, tag: string, message: string) => void",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI"
  },
  {
    "propertyPath": "plugins.list",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "() => Promise<{\n      success: boolean;\n      plugins?: Array<{\n        pluginId: string;\n        version?: string;\n        description?: string;\n        source: 'npm' | 'clawhub' | 'git' | 'local' | 'bundled' | 'openclaw';\n        enabled: boolean;\n        canUninstall: boolean;\n        hasConfig: boolean;\n      }>;\n      error?: string;\n    }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI"
  },
  {
    "propertyPath": "plugins.install",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "(params: {\n      source: 'npm' | 'clawhub' | 'git' | 'local';\n      spec: string;\n      registry?: string;\n      version?: string;\n    }) => Promise<{ ok: boolean; pluginId?: string; version?: string; error?: string }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI"
  },
  {
    "propertyPath": "plugins.uninstall",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "(pluginId: string) => Promise<{ ok: boolean; error?: string }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI"
  },
  {
    "propertyPath": "plugins.setEnabled",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "(pluginId: string, enabled: boolean) => Promise<{ ok: boolean; error?: string }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI"
  },
  {
    "propertyPath": "plugins.getConfigSchema",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "(pluginId: string) => Promise<{\n      success: boolean;\n      schema?: {\n        configSchema: Record<string, unknown>;\n        uiHints: Record<\n          string,\n          {\n            label?: string;\n            help?: string;\n            sensitive?: boolean;\n            advanced?: boolean;\n            placeholder?: string;\n            order?: number;\n          }\n        >;\n      } | null;\n      config?: Record<string, unknown> | null;\n      error?: string;\n    }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI"
  },
  {
    "propertyPath": "plugins.saveConfig",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "(\n      pluginId: string,\n      config: Record<string, unknown>,\n    ) => Promise<{ ok: boolean; error?: string }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI"
  },
  {
    "propertyPath": "plugins.batchSave",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "(changes: {\n      toggles?: Array<{ pluginId: string; enabled: boolean }>;\n      configs?: Array<{ pluginId: string; config: Record<string, unknown> }>;\n    }) => Promise<{ ok: boolean; error?: string }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI"
  },
  {
    "propertyPath": "plugins.detect",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "() => Promise<{ plugins: string[]; error?: string }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI"
  },
  {
    "propertyPath": "plugins.sync",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "() => Promise<{ synced: string[]; error?: string }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI"
  },
  {
    "propertyPath": "plugins.checkUpdates",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "(pluginIds?: string[]) => Promise<{\n      success: boolean;\n      updates?: Array<{\n        pluginId: string;\n        currentVersion: string | null;\n        latestVersion: string | null;\n        hasUpdate: boolean;\n        error?: string;\n      }>;\n      error?: string;\n    }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI"
  },
  {
    "propertyPath": "plugins.update",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "(pluginId: string) => Promise<{ ok: boolean; version?: string; error?: string }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI"
  },
  {
    "propertyPath": "plugins.onInstallLog",
    "transport": "stream",
    "disposition": "ga",
    "optional": false,
    "signature": "(callback: (line: string) => void) => () => void",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI"
  },
  {
    "propertyPath": "im.getConfig",
    "transport": "unsupported",
    "disposition": "deferred",
    "optional": false,
    "signature": "() => Promise<{ success: boolean; config?: IMGatewayConfig; error?: string }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI"
  },
  {
    "propertyPath": "im.setConfig",
    "transport": "unsupported",
    "disposition": "deferred",
    "optional": false,
    "signature": "(\n      config: Partial<IMGatewayConfig>,\n      options?: { syncGateway?: boolean; restartGatewayIfRunning?: boolean; markRestartOnSave?: boolean },\n    ) => Promise<{ success: boolean; error?: string }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI"
  },
  {
    "propertyPath": "im.syncConfig",
    "transport": "unsupported",
    "disposition": "deferred",
    "optional": false,
    "signature": "() => Promise<{ success: boolean; skipped?: boolean; error?: string }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI"
  },
  {
    "propertyPath": "im.startGateway",
    "transport": "unsupported",
    "disposition": "deferred",
    "optional": false,
    "signature": "(platform: Platform) => Promise<{ success: boolean; error?: string }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI"
  },
  {
    "propertyPath": "im.stopGateway",
    "transport": "unsupported",
    "disposition": "deferred",
    "optional": false,
    "signature": "(platform: Platform) => Promise<{ success: boolean; error?: string }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI"
  },
  {
    "propertyPath": "im.testGateway",
    "transport": "unsupported",
    "disposition": "deferred",
    "optional": false,
    "signature": "(\n      platform: Platform,\n      configOverride?: Partial<IMGatewayConfig>,\n    ) => Promise<{ success: boolean; result?: IMConnectivityTestResult; error?: string }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI"
  },
  {
    "propertyPath": "im.getStatus",
    "transport": "unsupported",
    "disposition": "deferred",
    "optional": false,
    "signature": "() => Promise<{ success: boolean; status?: IMGatewayStatus; error?: string }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI"
  },
  {
    "propertyPath": "im.getLocalIp",
    "transport": "unsupported",
    "disposition": "deferred",
    "optional": false,
    "signature": "() => Promise<string>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI"
  },
  {
    "propertyPath": "im.getOpenClawConfigSchema",
    "transport": "unsupported",
    "disposition": "deferred",
    "optional": false,
    "signature": "() => Promise<{\n      success: boolean;\n      result?: {\n        schema: Record<string, unknown>;\n        uiHints: Record<string, Record<string, unknown>>;\n      };\n      error?: string;\n    }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI"
  },
  {
    "propertyPath": "im.weixinQrLoginStart",
    "transport": "unsupported",
    "disposition": "deferred",
    "optional": false,
    "signature": "() => Promise<{\n      success: boolean;\n      qrDataUrl?: string;\n      message: string;\n      sessionKey?: string;\n    }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI"
  },
  {
    "propertyPath": "im.weixinQrLoginWait",
    "transport": "unsupported",
    "disposition": "deferred",
    "optional": false,
    "signature": "(sessionKey?: string) => Promise<{\n      success: boolean;\n      connected: boolean;\n      message: string;\n      accountId?: string;\n      alreadyConnected?: boolean;\n    }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI"
  },
  {
    "propertyPath": "im.popoQrLoginStart",
    "transport": "unsupported",
    "disposition": "deferred",
    "optional": false,
    "signature": "() => Promise<{\n      success: boolean;\n      qrUrl?: string;\n      taskToken?: string;\n      timeoutMs?: number;\n      message?: string;\n    }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI"
  },
  {
    "propertyPath": "im.popoQrLoginPoll",
    "transport": "unsupported",
    "disposition": "deferred",
    "optional": false,
    "signature": "(taskToken: string) => Promise<{\n      success: boolean;\n      appKey?: string;\n      appSecret?: string;\n      aesKey?: string;\n      message: string;\n    }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI"
  },
  {
    "propertyPath": "im.addPopoInstance",
    "transport": "unsupported",
    "disposition": "deferred",
    "optional": false,
    "signature": "(\n      name: string,\n    ) => Promise<{\n      success: boolean;\n      instance?: import('./im').PopoInstanceConfig;\n      error?: string;\n    }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI"
  },
  {
    "propertyPath": "im.deletePopoInstance",
    "transport": "unsupported",
    "disposition": "deferred",
    "optional": false,
    "signature": "(instanceId: string) => Promise<{ success: boolean; error?: string }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI"
  },
  {
    "propertyPath": "im.setPopoInstanceConfig",
    "transport": "unsupported",
    "disposition": "deferred",
    "optional": false,
    "signature": "(\n      instanceId: string,\n      config: Record<string, unknown>,\n      options?: { syncGateway?: boolean; restartGatewayIfRunning?: boolean; markRestartOnSave?: boolean },\n    ) => Promise<{ success: boolean; error?: string }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI"
  },
  {
    "propertyPath": "im.listPairingRequests",
    "transport": "unsupported",
    "disposition": "deferred",
    "optional": false,
    "signature": "(platform: string) => Promise<{\n      success: boolean;\n      requests: Array<{\n        id: string;\n        code: string;\n        createdAt: string;\n        lastSeenAt: string;\n        meta?: Record<string, string>;\n      }>;\n      allowFrom: string[];\n      error?: string;\n    }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI"
  },
  {
    "propertyPath": "im.approvePairingCode",
    "transport": "unsupported",
    "disposition": "deferred",
    "optional": false,
    "signature": "(\n      platform: string,\n      code: string,\n    ) => Promise<{ success: boolean; error?: string }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI"
  },
  {
    "propertyPath": "im.rejectPairingRequest",
    "transport": "unsupported",
    "disposition": "deferred",
    "optional": false,
    "signature": "(\n      platform: string,\n      code: string,\n    ) => Promise<{ success: boolean; error?: string }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI"
  },
  {
    "propertyPath": "im.nimQrLoginStart",
    "transport": "unsupported",
    "disposition": "deferred",
    "optional": false,
    "signature": "() => Promise<{\n      uuid: string;\n      qrValue: string;\n      expiresIn: number;\n      pollInterval: number;\n      credentialKind: 'split';\n      rawData: Record<string, unknown> | null;\n    }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI"
  },
  {
    "propertyPath": "im.nimQrLoginPoll",
    "transport": "unsupported",
    "disposition": "deferred",
    "optional": false,
    "signature": "(uuid: string) => Promise<{\n      status: 'pending' | 'success' | 'failed';\n      credentials?: {\n        appKey: string;\n        account: string;\n        token: string;\n      };\n      errorCode?: string;\n      error?: string;\n    }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI"
  },
  {
    "propertyPath": "im.addNimInstance",
    "transport": "unsupported",
    "disposition": "deferred",
    "optional": false,
    "signature": "(\n      name: string,\n    ) => Promise<{ success: boolean; instance?: NimInstanceConfig; error?: string }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI"
  },
  {
    "propertyPath": "im.deleteNimInstance",
    "transport": "unsupported",
    "disposition": "deferred",
    "optional": false,
    "signature": "(instanceId: string) => Promise<{ success: boolean; error?: string }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI"
  },
  {
    "propertyPath": "im.setNimInstanceConfig",
    "transport": "unsupported",
    "disposition": "deferred",
    "optional": false,
    "signature": "(\n      instanceId: string,\n      config: any,\n      options?: { syncGateway?: boolean; restartGatewayIfRunning?: boolean; markRestartOnSave?: boolean },\n    ) => Promise<{ success: boolean; error?: string }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI"
  },
  {
    "propertyPath": "im.addQQInstance",
    "transport": "unsupported",
    "disposition": "deferred",
    "optional": false,
    "signature": "(\n      name: string,\n    ) => Promise<{ success: boolean; instance?: QQInstanceConfig; error?: string }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI"
  },
  {
    "propertyPath": "im.deleteQQInstance",
    "transport": "unsupported",
    "disposition": "deferred",
    "optional": false,
    "signature": "(instanceId: string) => Promise<{ success: boolean; error?: string }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI"
  },
  {
    "propertyPath": "im.setQQInstanceConfig",
    "transport": "unsupported",
    "disposition": "deferred",
    "optional": false,
    "signature": "(\n      instanceId: string,\n      config: any,\n      options?: { syncGateway?: boolean; restartGatewayIfRunning?: boolean; markRestartOnSave?: boolean },\n    ) => Promise<{ success: boolean; error?: string }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI"
  },
  {
    "propertyPath": "im.addFeishuInstance",
    "transport": "unsupported",
    "disposition": "deferred",
    "optional": false,
    "signature": "(\n      name: string,\n    ) => Promise<{ success: boolean; instance?: FeishuInstanceConfig; error?: string }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI"
  },
  {
    "propertyPath": "im.deleteFeishuInstance",
    "transport": "unsupported",
    "disposition": "deferred",
    "optional": false,
    "signature": "(instanceId: string) => Promise<{ success: boolean; error?: string }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI"
  },
  {
    "propertyPath": "im.setFeishuInstanceConfig",
    "transport": "unsupported",
    "disposition": "deferred",
    "optional": false,
    "signature": "(\n      instanceId: string,\n      config: any,\n      options?: { syncGateway?: boolean; restartGatewayIfRunning?: boolean; markRestartOnSave?: boolean },\n    ) => Promise<{ success: boolean; error?: string }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI"
  },
  {
    "propertyPath": "im.addDingTalkInstance",
    "transport": "unsupported",
    "disposition": "deferred",
    "optional": false,
    "signature": "(\n      name: string,\n    ) => Promise<{ success: boolean; instance?: DingTalkInstanceConfig; error?: string }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI"
  },
  {
    "propertyPath": "im.deleteDingTalkInstance",
    "transport": "unsupported",
    "disposition": "deferred",
    "optional": false,
    "signature": "(instanceId: string) => Promise<{ success: boolean; error?: string }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI"
  },
  {
    "propertyPath": "im.setDingTalkInstanceConfig",
    "transport": "unsupported",
    "disposition": "deferred",
    "optional": false,
    "signature": "(\n      instanceId: string,\n      config: any,\n      options?: { syncGateway?: boolean; restartGatewayIfRunning?: boolean; markRestartOnSave?: boolean },\n    ) => Promise<{ success: boolean; error?: string }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI"
  },
  {
    "propertyPath": "im.addEmailInstance",
    "transport": "unsupported",
    "disposition": "deferred",
    "optional": false,
    "signature": "(\n      name: string,\n    ) => Promise<{ success: boolean; instance?: EmailInstanceConfig; error?: string }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI"
  },
  {
    "propertyPath": "im.deleteEmailInstance",
    "transport": "unsupported",
    "disposition": "deferred",
    "optional": false,
    "signature": "(instanceId: string) => Promise<{ success: boolean; error?: string }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI"
  },
  {
    "propertyPath": "im.setEmailInstanceConfig",
    "transport": "unsupported",
    "disposition": "deferred",
    "optional": false,
    "signature": "(\n      instanceId: string,\n      config: any,\n      options?: { syncGateway?: boolean; restartGatewayIfRunning?: boolean; markRestartOnSave?: boolean },\n    ) => Promise<{ success: boolean; error?: string }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI"
  },
  {
    "propertyPath": "im.addWecomInstance",
    "transport": "unsupported",
    "disposition": "deferred",
    "optional": false,
    "signature": "(\n      name: string,\n    ) => Promise<{ success: boolean; instance?: WecomInstanceConfig; error?: string }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI"
  },
  {
    "propertyPath": "im.deleteWecomInstance",
    "transport": "unsupported",
    "disposition": "deferred",
    "optional": false,
    "signature": "(instanceId: string) => Promise<{ success: boolean; error?: string }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI"
  },
  {
    "propertyPath": "im.setWecomInstanceConfig",
    "transport": "unsupported",
    "disposition": "deferred",
    "optional": false,
    "signature": "(\n      instanceId: string,\n      config: any,\n      options?: { syncGateway?: boolean; restartGatewayIfRunning?: boolean; markRestartOnSave?: boolean },\n    ) => Promise<{ success: boolean; error?: string }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI"
  },
  {
    "propertyPath": "im.addTelegramInstance",
    "transport": "unsupported",
    "disposition": "deferred",
    "optional": false,
    "signature": "(\n      name: string,\n    ) => Promise<{ success: boolean; instance?: TelegramInstanceConfig; error?: string }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI"
  },
  {
    "propertyPath": "im.deleteTelegramInstance",
    "transport": "unsupported",
    "disposition": "deferred",
    "optional": false,
    "signature": "(instanceId: string) => Promise<{ success: boolean; error?: string }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI"
  },
  {
    "propertyPath": "im.setTelegramInstanceConfig",
    "transport": "unsupported",
    "disposition": "deferred",
    "optional": false,
    "signature": "(\n      instanceId: string,\n      config: any,\n      options?: { syncGateway?: boolean; restartGatewayIfRunning?: boolean; markRestartOnSave?: boolean },\n    ) => Promise<{ success: boolean; error?: string }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI"
  },
  {
    "propertyPath": "im.addDiscordInstance",
    "transport": "unsupported",
    "disposition": "deferred",
    "optional": false,
    "signature": "(\n      name: string,\n    ) => Promise<{ success: boolean; instance?: DiscordInstanceConfig; error?: string }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI"
  },
  {
    "propertyPath": "im.deleteDiscordInstance",
    "transport": "unsupported",
    "disposition": "deferred",
    "optional": false,
    "signature": "(instanceId: string) => Promise<{ success: boolean; error?: string }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI"
  },
  {
    "propertyPath": "im.setDiscordInstanceConfig",
    "transport": "unsupported",
    "disposition": "deferred",
    "optional": false,
    "signature": "(\n      instanceId: string,\n      config: any,\n      options?: { syncGateway?: boolean; restartGatewayIfRunning?: boolean; markRestartOnSave?: boolean },\n    ) => Promise<{ success: boolean; error?: string }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI"
  },
  {
    "propertyPath": "im.onStatusChange",
    "transport": "unsupported",
    "disposition": "deferred",
    "optional": false,
    "signature": "(callback: (status: IMGatewayStatus) => void) => () => void",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI"
  },
  {
    "propertyPath": "im.onMessageReceived",
    "transport": "unsupported",
    "disposition": "deferred",
    "optional": false,
    "signature": "(callback: (message: IMMessage) => void) => () => void",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI"
  },
  {
    "propertyPath": "scheduledTasks.list",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "() => Promise<{\n      success: boolean;\n      ready?: boolean;\n      tasks?: import('../../scheduledTask/types').ScheduledTask[];\n      error?: string;\n    }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI"
  },
  {
    "propertyPath": "scheduledTasks.get",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "(id: string) => Promise<{\n      success: boolean;\n      task?: import('../../scheduledTask/types').ScheduledTask;\n      error?: string;\n    }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI"
  },
  {
    "propertyPath": "scheduledTasks.create",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "(input: import('../../scheduledTask/types').ScheduledTaskInput) => Promise<{\n      success: boolean;\n      task?: import('../../scheduledTask/types').ScheduledTask;\n      error?: string;\n    }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI"
  },
  {
    "propertyPath": "scheduledTasks.update",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "(\n      id: string,\n      input: Partial<import('../../scheduledTask/types').ScheduledTaskInput>,\n    ) => Promise<{\n      success: boolean;\n      task?: import('../../scheduledTask/types').ScheduledTask;\n      error?: string;\n    }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI"
  },
  {
    "propertyPath": "scheduledTasks.delete",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "(id: string) => Promise<{ success: boolean; error?: string }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI"
  },
  {
    "propertyPath": "scheduledTasks.toggle",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "(\n      id: string,\n      enabled: boolean,\n    ) => Promise<{\n      success: boolean;\n      task?: import('../../scheduledTask/types').ScheduledTask;\n      warning?: string;\n      error?: string;\n    }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI"
  },
  {
    "propertyPath": "scheduledTasks.runManually",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "(id: string) => Promise<{ success: boolean; error?: string }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI"
  },
  {
    "propertyPath": "scheduledTasks.stop",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "(id: string) => Promise<{ success: boolean; error?: string }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI"
  },
  {
    "propertyPath": "scheduledTasks.listRuns",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "(\n      taskId: string,\n      limit?: number,\n      offset?: number,\n      filter?: import('../../scheduledTask/types').RunFilter,\n    ) => Promise<{\n      success: boolean;\n      runs?: import('../../scheduledTask/types').ScheduledTaskRun[];\n      error?: string;\n    }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI"
  },
  {
    "propertyPath": "scheduledTasks.countRuns",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "(taskId: string) => Promise<{ success: boolean; count?: number; error?: string }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI"
  },
  {
    "propertyPath": "scheduledTasks.listAllRuns",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "(\n      limit?: number,\n      offset?: number,\n      filter?: import('../../scheduledTask/types').RunFilter,\n    ) => Promise<{\n      success: boolean;\n      ready?: boolean;\n      runs?: import('../../scheduledTask/types').ScheduledTaskRunWithName[];\n      error?: string;\n    }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI"
  },
  {
    "propertyPath": "scheduledTasks.resolveSession",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "(\n      input: string | { sessionId?: string | null; sessionKey?: string | null },\n    ) => Promise<{\n      success: boolean;\n      session?: import('./cowork').CoworkSession | null;\n      error?: string;\n    }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI"
  },
  {
    "propertyPath": "scheduledTasks.listChannels",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "() => Promise<{\n      success: boolean;\n      channels?: import('../../scheduledTask/types').ScheduledTaskChannelOption[];\n      error?: string;\n    }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI"
  },
  {
    "propertyPath": "scheduledTasks.listChannelConversations",
    "transport": "rest",
    "disposition": "ga",
    "optional": true,
    "signature": "(\n      channel: string,\n      accountId?: string,\n      filterAccountId?: string,\n    ) => Promise<{\n      success: boolean;\n      conversations?: import('../../scheduledTask/types').ScheduledTaskConversationOption[];\n      error?: string;\n    }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI"
  },
  {
    "propertyPath": "scheduledTasks.onStatusUpdate",
    "transport": "stream",
    "disposition": "ga",
    "optional": false,
    "signature": "(\n      callback: (data: import('../../scheduledTask/types').ScheduledTaskStatusEvent) => void,\n    ) => () => void",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI"
  },
  {
    "propertyPath": "scheduledTasks.onRunUpdate",
    "transport": "stream",
    "disposition": "ga",
    "optional": false,
    "signature": "(\n      callback: (data: import('../../scheduledTask/types').ScheduledTaskRunEvent) => void,\n    ) => () => void",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI"
  },
  {
    "propertyPath": "scheduledTasks.onRefresh",
    "transport": "stream",
    "disposition": "ga",
    "optional": false,
    "signature": "(callback: () => void) => () => void",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI"
  },
  {
    "propertyPath": "permissions.checkCalendar",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "() => Promise<{\n      success: boolean;\n      status?: string;\n      error?: string;\n      autoRequested?: boolean;\n    }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI"
  },
  {
    "propertyPath": "permissions.requestCalendar",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "() => Promise<{\n      success: boolean;\n      granted?: boolean;\n      status?: string;\n      error?: string;\n    }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI"
  },
  {
    "propertyPath": "auth.login",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "(loginUrl?: string) => Promise<{ success: boolean; error?: string }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI"
  },
  {
    "propertyPath": "auth.exchange",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "(\n      code: string,\n    ) => Promise<{ success: boolean; user?: any; quota?: any; error?: string }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI"
  },
  {
    "propertyPath": "auth.getUser",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "() => Promise<{ success: boolean; user?: any; quota?: any }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI"
  },
  {
    "propertyPath": "auth.getQuota",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "() => Promise<{ success: boolean; quota?: any }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI"
  },
  {
    "propertyPath": "auth.logout",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "() => Promise<{ success: boolean }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI"
  },
  {
    "propertyPath": "auth.refreshToken",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "() => Promise<{ success: boolean; accessToken?: string }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI"
  },
  {
    "propertyPath": "auth.getAccessToken",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "() => Promise<string | null>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI"
  },
  {
    "propertyPath": "auth.getModels",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "() => Promise<{\n      success: boolean;\n      models?: Array<{\n        modelId: string;\n        modelName: string;\n        provider: string;\n        apiFormat: string;\n        supportsImage?: boolean;\n        supportsThinking?: boolean;\n        contextWindow?: number;\n        explicitContextCache?: boolean;\n        costMultiplier?: number;\n        description?: string;\n        accessible?: boolean;\n        restrictionHint?: string;\n      }>;\n    }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI"
  },
  {
    "propertyPath": "auth.getPricingCatalog",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "() => Promise<{\n      success: boolean;\n      textModels?: Array<{\n        modelId: string;\n        modelName: string;\n        provider?: string;\n        providerLabel?: string;\n        description?: string;\n        supportsImage?: boolean;\n        supportsThinking?: boolean;\n        contextWindow?: number | null;\n        costMultiplier?: number;\n      }>;\n      error?: string;\n    }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI"
  },
  {
    "propertyPath": "auth.getProfileSummary",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "() => Promise<{ success: boolean; data?: ProfileSummaryData }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI"
  },
  {
    "propertyPath": "auth.getActiveClientBanner",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "() => Promise<{ success: boolean; data?: ClientBannerData | null }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI"
  },
  {
    "propertyPath": "auth.getActiveClientBanners",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "() => Promise<{ success: boolean; data?: ClientBannerData[] }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI"
  },
  {
    "propertyPath": "auth.getPendingCallback",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "() => Promise<string | null>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI"
  },
  {
    "propertyPath": "auth.onCallback",
    "transport": "stream",
    "disposition": "ga",
    "optional": false,
    "signature": "(callback: (data: { code: string }) => void) => () => void",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI"
  },
  {
    "propertyPath": "auth.onQuotaChanged",
    "transport": "stream",
    "disposition": "ga",
    "optional": false,
    "signature": "(callback: () => void) => () => void",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI"
  },
  {
    "propertyPath": "media.getModels",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "(type: 'image' | 'video') => Promise<{ success: boolean; models?: Array<{ modelId: string; displayName: string; provider: string; mediaType: string; generationTimeout: number; pricing: Record<string, unknown> }>; error?: string }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI"
  },
  {
    "propertyPath": "media.getTaskStatus",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "(taskId: number, type: 'image' | 'video') => Promise<{ success: boolean; task?: Record<string, unknown>; error?: string }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI"
  },
  {
    "propertyPath": "enterprise.getConfig",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "() => Promise<{\n      ui?: Record<string, 'hide' | 'disable' | 'readonly'>;\n      disableUpdate?: boolean;\n      version: string;\n      name: string;\n    } | null>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI"
  },
  {
    "propertyPath": "networkStatus.send",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "(status: 'online' | 'offline') => void",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI"
  },
  {
    "propertyPath": "qwen",
    "transport": "rest",
    "disposition": "ga",
    "optional": true,
    "signature": "Record<string, never>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI"
  },
  {
    "propertyPath": "feishu.install.qrcode",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "(isLark: boolean) => Promise<{\n        url: string;\n        deviceCode: string;\n        interval: number;\n        expireIn: number;\n      }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI"
  },
  {
    "propertyPath": "feishu.install.poll",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "(deviceCode: string) => Promise<{\n        done: boolean;\n        appId?: string;\n        appSecret?: string;\n        domain?: string;\n        error?: string;\n      }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI"
  },
  {
    "propertyPath": "feishu.install.verify",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "(\n        appId: string,\n        appSecret: string,\n      ) => Promise<{\n        success: boolean;\n        error?: string;\n      }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI"
  },
  {
    "propertyPath": "dingtalk.install.qrcode",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "() => Promise<{\n        url: string;\n        deviceCode: string;\n        interval: number;\n        expireIn: number;\n      }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI"
  },
  {
    "propertyPath": "dingtalk.install.poll",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "(deviceCode: string) => Promise<{\n        done: boolean;\n        clientId?: string;\n        clientSecret?: string;\n        error?: string;\n      }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI"
  },
  {
    "propertyPath": "dingtalk.install.verify",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "(\n        clientId: string,\n        clientSecret: string,\n      ) => Promise<{\n        success: boolean;\n        error?: string;\n      }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI"
  },
  {
    "propertyPath": "githubCopilot.requestDeviceCode",
    "transport": "unsupported",
    "disposition": "deferred",
    "optional": false,
    "signature": "() => Promise<{\n      userCode: string;\n      verificationUri: string;\n      deviceCode: string;\n      interval: number;\n      expiresIn: number;\n    }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI"
  },
  {
    "propertyPath": "githubCopilot.pollForToken",
    "transport": "unsupported",
    "disposition": "deferred",
    "optional": false,
    "signature": "(\n      deviceCode: string,\n      interval: number,\n      expiresIn: number,\n    ) => Promise<{\n      success: boolean;\n      token?: string;\n      githubUser?: string;\n      baseUrl?: string;\n      error?: string;\n    }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI"
  },
  {
    "propertyPath": "githubCopilot.cancelPolling",
    "transport": "unsupported",
    "disposition": "deferred",
    "optional": false,
    "signature": "() => Promise<void>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI"
  },
  {
    "propertyPath": "githubCopilot.signOut",
    "transport": "unsupported",
    "disposition": "deferred",
    "optional": false,
    "signature": "() => Promise<void>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI"
  },
  {
    "propertyPath": "githubCopilot.refreshToken",
    "transport": "unsupported",
    "disposition": "deferred",
    "optional": false,
    "signature": "() => Promise<{\n      success: boolean;\n      token?: string;\n      baseUrl?: string;\n      error?: string;\n    }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI"
  },
  {
    "propertyPath": "githubCopilot.onTokenUpdated",
    "transport": "unsupported",
    "disposition": "deferred",
    "optional": false,
    "signature": "(callback: (data: { token: string; baseUrl: string }) => void) => () => void",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI"
  },
  {
    "propertyPath": "openaiCodexOAuth.start",
    "transport": "unsupported",
    "disposition": "deferred",
    "optional": false,
    "signature": "() => Promise<\n      | { success: true; email: string | null; accountId: string | null; expiresAt: number }\n      | { success: false; error: string }\n    >",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI"
  },
  {
    "propertyPath": "openaiCodexOAuth.cancel",
    "transport": "unsupported",
    "disposition": "deferred",
    "optional": false,
    "signature": "() => Promise<void>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI"
  },
  {
    "propertyPath": "openaiCodexOAuth.logout",
    "transport": "unsupported",
    "disposition": "deferred",
    "optional": false,
    "signature": "() => Promise<void>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI"
  },
  {
    "propertyPath": "openaiCodexOAuth.status",
    "transport": "unsupported",
    "disposition": "deferred",
    "optional": false,
    "signature": "() => Promise<\n      | { loggedIn: true; email: string | null; accountId: string | null; expiresAt: number }\n      | { loggedIn: false }\n    >",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI"
  },
  {
    "propertyPath": "xaiOAuth.start",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "() => Promise<\n      | { success: true; email: string | null; flow: 'browser' | 'device-code' }\n      | { success: false; error: string }\n    >",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI"
  },
  {
    "propertyPath": "xaiOAuth.cancel",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "() => Promise<void>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI"
  },
  {
    "propertyPath": "xaiOAuth.logout",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "() => Promise<void>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI"
  },
  {
    "propertyPath": "xaiOAuth.status",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "() => Promise<{\n      loggedIn: boolean;\n      email?: string;\n      displayName?: string;\n      expiresAt?: number;\n    }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI"
  },
  {
    "propertyPath": "xaiOAuth.onDeviceCode",
    "transport": "stream",
    "disposition": "ga",
    "optional": false,
    "signature": "(\n      callback: (info: {\n        userCode: string;\n        verificationUri: string;\n        verificationUriComplete?: string;\n        expiresInMs: number;\n      }) => void,\n    ) => () => void",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI"
  }
] as const;
