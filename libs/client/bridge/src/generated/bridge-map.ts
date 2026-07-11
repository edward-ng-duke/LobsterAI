// Generated file. Do not edit.
export const ElectronBridgeMap = [
  {
    "propertyPath": "platform",
    "transport": "rest",
    "disposition": "deferred",
    "optional": false,
    "signature": "string",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI",
    "targets": []
  },
  {
    "propertyPath": "arch",
    "transport": "rest",
    "disposition": "deferred",
    "optional": false,
    "signature": "string",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI",
    "targets": []
  },
  {
    "propertyPath": "store.get",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "(key: string) => Promise<any>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI",
    "target": "get_api_v1_kv_key",
    "targets": [
      "get_api_v1_kv_key"
    ]
  },
  {
    "propertyPath": "store.set",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "(key: string, value: any) => Promise<void>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI",
    "target": "put_api_v1_kv_key",
    "targets": [
      "put_api_v1_kv_key"
    ]
  },
  {
    "propertyPath": "store.remove",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "(key: string) => Promise<void>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI",
    "target": "delete_api_v1_kv_key",
    "targets": [
      "delete_api_v1_kv_key"
    ]
  },
  {
    "propertyPath": "skills.list",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "() => Promise<{ success: boolean; skills?: Skill[]; error?: string }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI",
    "target": "get_api_v1_skills",
    "targets": [
      "get_api_v1_skills"
    ]
  },
  {
    "propertyPath": "skills.setEnabled",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "(options: {\n      id: string;\n      enabled: boolean;\n    }) => Promise<{ success: boolean; skills?: Skill[]; error?: string }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI",
    "target": "patch_api_v1_skills_id",
    "targets": [
      "patch_api_v1_skills_id"
    ]
  },
  {
    "propertyPath": "skills.delete",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "(id: string) => Promise<{ success: boolean; skills?: Skill[]; error?: string }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI",
    "target": "delete_api_v1_skills_id",
    "targets": [
      "delete_api_v1_skills_id"
    ]
  },
  {
    "propertyPath": "skills.download",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "(source: string) => Promise<{\n      success: boolean;\n      skills?: Skill[];\n      error?: string;\n      auditReport?: any;\n      pendingInstallId?: string;\n    }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI",
    "target": "post_api_v1_skills_install",
    "targets": [
      "post_api_v1_skills_install"
    ]
  },
  {
    "propertyPath": "skills.upgrade",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "(\n      skillId: string,\n      downloadUrl: string,\n    ) => Promise<{\n      success: boolean;\n      skills?: Skill[];\n      error?: string;\n      auditReport?: any;\n      pendingInstallId?: string;\n    }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI",
    "target": "post_api_v1_skills_id_upgrade",
    "targets": [
      "post_api_v1_skills_id_upgrade"
    ]
  },
  {
    "propertyPath": "skills.confirmInstall",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "(\n      pendingId: string,\n      action: string,\n    ) => Promise<{ success: boolean; skills?: Skill[]; error?: string }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI",
    "target": "post_api_v1_skills_id_confirm",
    "targets": [
      "post_api_v1_skills_id_confirm"
    ]
  },
  {
    "propertyPath": "skills.getRoot",
    "transport": "rest",
    "disposition": "deferred",
    "optional": false,
    "signature": "() => Promise<{ success: boolean; path?: string; error?: string }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI",
    "targets": []
  },
  {
    "propertyPath": "skills.autoRoutingPrompt",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "() => Promise<{ success: boolean; prompt?: string | null; error?: string }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI",
    "target": "get_api_v1_skills_routing_prompt",
    "targets": [
      "get_api_v1_skills_routing_prompt"
    ]
  },
  {
    "propertyPath": "skills.getConfig",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "(\n      skillId: string,\n    ) => Promise<{ success: boolean; config?: Record<string, string>; error?: string }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI",
    "target": "get_api_v1_skills_id_config",
    "targets": [
      "get_api_v1_skills_id_config"
    ]
  },
  {
    "propertyPath": "skills.setConfig",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "(\n      skillId: string,\n      config: Record<string, string>,\n    ) => Promise<{ success: boolean; error?: string }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI",
    "target": "put_api_v1_skills_id_config",
    "targets": [
      "put_api_v1_skills_id_config"
    ]
  },
  {
    "propertyPath": "skills.getEmailAccountsConfig",
    "transport": "rest",
    "disposition": "deferred",
    "optional": false,
    "signature": "(\n      skillId: string,\n    ) => Promise<{ success: boolean; config?: EmailSkillAccountsConfig; error?: string }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI",
    "targets": []
  },
  {
    "propertyPath": "skills.setEmailAccountsConfig",
    "transport": "rest",
    "disposition": "deferred",
    "optional": false,
    "signature": "(\n      skillId: string,\n      config: EmailSkillAccountsConfig,\n    ) => Promise<{ success: boolean; error?: string }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI",
    "targets": []
  },
  {
    "propertyPath": "skills.testEmailAccountConnectivity",
    "transport": "rest",
    "disposition": "deferred",
    "optional": false,
    "signature": "(\n      skillId: string,\n      account: EmailSkillAccountConfig,\n    ) => Promise<{ success: boolean; result?: EmailConnectivityTestResult; error?: string }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI",
    "targets": []
  },
  {
    "propertyPath": "skills.testEmailConnectivity",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "(\n      skillId: string,\n      config: Record<string, string>,\n    ) => Promise<{ success: boolean; result?: EmailConnectivityTestResult; error?: string }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI",
    "target": "post_api_v1_skills_id_test",
    "targets": [
      "post_api_v1_skills_id_test"
    ]
  },
  {
    "propertyPath": "skills.fetchMarketplace",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "() => Promise<{ success: boolean; data?: string; error?: string }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI",
    "target": "get_api_v1_skills_marketplace",
    "targets": [
      "get_api_v1_skills_marketplace"
    ]
  },
  {
    "propertyPath": "skills.detectFromOpenClaw",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "() => Promise<{\n      skills: Array<{ name: string; description: string; skillKey: string; baseDir: string }>;\n      error?: string;\n    }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI",
    "target": "post_api_v1_skills_sync",
    "targets": [
      "post_api_v1_skills_sync"
    ]
  },
  {
    "propertyPath": "skills.syncFromOpenClaw",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "() => Promise<{ synced: string[]; error?: string }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI",
    "target": "post_api_v1_skills_sync",
    "targets": [
      "post_api_v1_skills_sync"
    ]
  },
  {
    "propertyPath": "skills.refreshPluginSkillIds",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "() => Promise<{ success: boolean; pluginSkillIds?: string[]; error?: string }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI",
    "target": "post_api_v1_skills_sync",
    "targets": [
      "post_api_v1_skills_sync"
    ]
  },
  {
    "propertyPath": "skills.onChanged",
    "transport": "stream",
    "disposition": "ga",
    "optional": false,
    "signature": "(callback: () => void) => () => void",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI",
    "target": "skillsChanged",
    "targets": [
      "skillsChanged"
    ]
  },
  {
    "propertyPath": "mcp.list",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "() => Promise<{ success: boolean; servers?: McpServerConfigIPC[]; error?: string }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI",
    "target": "get_api_v1_mcp_servers",
    "targets": [
      "get_api_v1_mcp_servers"
    ]
  },
  {
    "propertyPath": "mcp.create",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "(\n      data: any,\n    ) => Promise<{ success: boolean; servers?: McpServerConfigIPC[]; error?: string }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI",
    "target": "post_api_v1_mcp_servers",
    "targets": [
      "post_api_v1_mcp_servers"
    ]
  },
  {
    "propertyPath": "mcp.update",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "(\n      id: string,\n      data: any,\n    ) => Promise<{ success: boolean; servers?: McpServerConfigIPC[]; error?: string }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI",
    "target": "patch_api_v1_mcp_servers_id",
    "targets": [
      "patch_api_v1_mcp_servers_id"
    ]
  },
  {
    "propertyPath": "mcp.delete",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "(\n      id: string,\n    ) => Promise<{ success: boolean; servers?: McpServerConfigIPC[]; error?: string }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI",
    "target": "delete_api_v1_mcp_servers_id",
    "targets": [
      "delete_api_v1_mcp_servers_id"
    ]
  },
  {
    "propertyPath": "mcp.deleteByRegistryId",
    "transport": "rest",
    "disposition": "deferred",
    "optional": false,
    "signature": "(\n      registryId: string,\n    ) => Promise<{ success: boolean; servers?: McpServerConfigIPC[]; error?: string }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI",
    "targets": []
  },
  {
    "propertyPath": "mcp.setEnabled",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "(options: {\n      id: string;\n      enabled: boolean;\n    }) => Promise<{ success: boolean; servers?: McpServerConfigIPC[]; error?: string }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI",
    "target": "patch_api_v1_mcp_servers_id",
    "targets": [
      "patch_api_v1_mcp_servers_id"
    ]
  },
  {
    "propertyPath": "mcp.setEnabledByRegistryId",
    "transport": "rest",
    "disposition": "deferred",
    "optional": false,
    "signature": "(options: {\n      registryId: string;\n      enabled: boolean;\n    }) => Promise<{ success: boolean; servers?: McpServerConfigIPC[]; error?: string }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI",
    "targets": []
  },
  {
    "propertyPath": "mcp.retryLaunchResolution",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "(\n      id: string,\n    ) => Promise<{ success: boolean; servers?: McpServerConfigIPC[]; error?: string }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI",
    "target": "post_api_v1_mcp_servers_id_launch_resolution_retry",
    "targets": [
      "post_api_v1_mcp_servers_id_launch_resolution_retry"
    ]
  },
  {
    "propertyPath": "mcp.fetchMarketplace",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "() => Promise<{\n      success: boolean;\n      data?: McpMarketplaceData;\n      error?: string;\n    }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI",
    "target": "get_api_v1_mcp_marketplace",
    "targets": [
      "get_api_v1_mcp_marketplace"
    ]
  },
  {
    "propertyPath": "mcp.connectQichacha",
    "transport": "rest",
    "disposition": "deferred",
    "optional": false,
    "signature": "() => Promise<{\n      success: boolean;\n      servers?: McpServerConfigIPC[];\n      error?: string;\n    }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI",
    "targets": []
  },
  {
    "propertyPath": "mcp.onChanged",
    "transport": "stream",
    "disposition": "ga",
    "optional": false,
    "signature": "(callback: () => void) => () => void",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI",
    "target": "mcpChanged",
    "targets": [
      "mcpChanged"
    ]
  },
  {
    "propertyPath": "kits.fetchStore",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "() => Promise<{ success: boolean; data?: string; error?: string }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI",
    "target": "get_api_v1_kits_marketplace",
    "targets": [
      "get_api_v1_kits_marketplace"
    ]
  },
  {
    "propertyPath": "kits.install",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "(params: {\n      kitId: string;\n      bundleUrl: string;\n      version: string;\n      skillListIds: string[];\n      skillList?: KitSkillMetadata[];\n      mcpServers?: unknown[] | null;\n      connectors?: unknown[] | null;\n    }) => Promise<{ success: boolean; skillIds?: string[]; error?: string }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI",
    "target": "post_api_v1_kits_install",
    "targets": [
      "post_api_v1_kits_install"
    ]
  },
  {
    "propertyPath": "kits.uninstall",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "(kitId: string) => Promise<{ success: boolean; error?: string }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI",
    "target": "delete_api_v1_kits_id",
    "targets": [
      "delete_api_v1_kits_id"
    ]
  },
  {
    "propertyPath": "kits.listInstalled",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "() => Promise<{\n      success: boolean;\n      installed?: Record<string, InstalledKitRecord>;\n      error?: string;\n    }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI",
    "target": "get_api_v1_kits_installed",
    "targets": [
      "get_api_v1_kits_installed"
    ]
  },
  {
    "propertyPath": "agents.list",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "() => Promise<Agent[]>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI",
    "target": "get_api_v1_agents",
    "targets": [
      "get_api_v1_agents"
    ]
  },
  {
    "propertyPath": "agents.get",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "(id: string) => Promise<Agent | null>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI",
    "target": "get_api_v1_agents_id",
    "targets": [
      "get_api_v1_agents_id"
    ]
  },
  {
    "propertyPath": "agents.create",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "(request: {\n      id?: string;\n      name: string;\n      description?: string;\n      systemPrompt?: string;\n      identity?: string;\n      model?: string;\n      workingDirectory?: string;\n      icon?: string;\n      skillIds?: string[];\n      source?: string;\n      presetId?: string;\n    }) => Promise<Agent>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI",
    "target": "post_api_v1_agents",
    "targets": [
      "post_api_v1_agents"
    ]
  },
  {
    "propertyPath": "agents.update",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "(\n      id: string,\n      updates: {\n        name?: string;\n        description?: string;\n        systemPrompt?: string;\n        identity?: string;\n        model?: string;\n        workingDirectory?: string;\n        icon?: string;\n        skillIds?: string[];\n        enabled?: boolean;\n        pinned?: boolean;\n      },\n    ) => Promise<Agent>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI",
    "target": "patch_api_v1_agents_id",
    "targets": [
      "patch_api_v1_agents_id"
    ]
  },
  {
    "propertyPath": "agents.cleanupLegacyIdentityBlock",
    "transport": "rest",
    "disposition": "deferred",
    "optional": false,
    "signature": "(id: string) => Promise<AgentLegacyIdentityCleanupResult>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI",
    "targets": []
  },
  {
    "propertyPath": "agents.delete",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "(id: string) => Promise<boolean>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI",
    "target": "delete_api_v1_agents_id",
    "targets": [
      "delete_api_v1_agents_id"
    ]
  },
  {
    "propertyPath": "agents.presets",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "() => Promise<PresetAgent[]>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI",
    "target": "get_api_v1_agents_presets",
    "targets": [
      "get_api_v1_agents_presets"
    ]
  },
  {
    "propertyPath": "agents.presetTemplates",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "() => Promise<PresetAgent[]>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI",
    "target": "get_api_v1_agents_preset_templates",
    "targets": [
      "get_api_v1_agents_preset_templates"
    ]
  },
  {
    "propertyPath": "agents.addPreset",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "(presetId: string) => Promise<Agent>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI",
    "target": "post_api_v1_agents_presets_presetId_install",
    "targets": [
      "post_api_v1_agents_presets_presetId_install"
    ]
  },
  {
    "propertyPath": "api.fetch",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "(options: {\n      url: string;\n      method: string;\n      headers: Record<string, string>;\n      body?: string;\n    }) => Promise<ApiResponse>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI",
    "target": "post_api_v1_model_proxy",
    "targets": [
      "post_api_v1_model_proxy"
    ]
  },
  {
    "propertyPath": "api.stream",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "(options: {\n      url: string;\n      method: string;\n      headers: Record<string, string>;\n      body?: string;\n      requestId: string;\n    }) => Promise<ApiStreamResponse>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI",
    "target": "post_api_v1_model_stream",
    "targets": [
      "post_api_v1_model_stream"
    ]
  },
  {
    "propertyPath": "api.cancelStream",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "(requestId: string) => Promise<boolean>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI",
    "target": "post_api_v1_model_stream_requestId_abort",
    "targets": [
      "post_api_v1_model_stream_requestId_abort"
    ]
  },
  {
    "propertyPath": "api.onStreamData",
    "transport": "stream",
    "disposition": "ga",
    "optional": false,
    "signature": "(requestId: string, callback: (chunk: string) => void) => () => void",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI",
    "target": "apiStreamChunk",
    "targets": [
      "apiStreamChunk"
    ]
  },
  {
    "propertyPath": "api.onStreamDone",
    "transport": "stream",
    "disposition": "ga",
    "optional": false,
    "signature": "(requestId: string, callback: () => void) => () => void",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI",
    "target": "apiStreamDone",
    "targets": [
      "apiStreamDone"
    ]
  },
  {
    "propertyPath": "api.onStreamError",
    "transport": "stream",
    "disposition": "ga",
    "optional": false,
    "signature": "(requestId: string, callback: (error: string) => void) => () => void",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI",
    "target": "apiStreamError",
    "targets": [
      "apiStreamError"
    ]
  },
  {
    "propertyPath": "api.onStreamAbort",
    "transport": "stream",
    "disposition": "ga",
    "optional": false,
    "signature": "(requestId: string, callback: () => void) => () => void",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI",
    "target": "apiStreamAbort",
    "targets": [
      "apiStreamAbort"
    ]
  },
  {
    "propertyPath": "getApiConfig",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "() => Promise<CoworkApiConfig | null>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI",
    "target": "get_api_v1_model_config",
    "targets": [
      "get_api_v1_model_config"
    ]
  },
  {
    "propertyPath": "checkApiConfig",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "(options?: {\n    probeModel?: boolean;\n  }) => Promise<{ hasConfig: boolean; config: CoworkApiConfig | null; error?: string }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI",
    "target": "post_api_v1_model_config_check",
    "targets": [
      "post_api_v1_model_config_check"
    ]
  },
  {
    "propertyPath": "saveApiConfig",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "(config: CoworkApiConfig) => Promise<{ success: boolean; error?: string }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI",
    "target": "put_api_v1_model_config",
    "targets": [
      "put_api_v1_model_config"
    ]
  },
  {
    "propertyPath": "generateSessionTitle",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "(userInput: string | null) => Promise<string>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI",
    "target": "post_api_v1_sessions_id_title_generation",
    "targets": [
      "post_api_v1_sessions_id_title_generation"
    ]
  },
  {
    "propertyPath": "getRecentCwds",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "(limit?: number) => Promise<string[]>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI",
    "target": "get_api_v1_workspaces_recent",
    "targets": [
      "get_api_v1_workspaces_recent"
    ]
  },
  {
    "propertyPath": "openclaw.engine.getStatus",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "() => Promise<{ success: boolean; status?: OpenClawEngineStatus; error?: string }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI",
    "target": "get_api_v1_runtime_status",
    "targets": [
      "get_api_v1_runtime_status"
    ]
  },
  {
    "propertyPath": "openclaw.engine.install",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "() => Promise<{ success: boolean; status?: OpenClawEngineStatus; error?: string }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI",
    "target": "post_api_v1_runtime_provision",
    "targets": [
      "post_api_v1_runtime_provision"
    ]
  },
  {
    "propertyPath": "openclaw.engine.retryInstall",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "() => Promise<{\n        success: boolean;\n        status?: OpenClawEngineStatus;\n        error?: string;\n      }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI",
    "target": "post_api_v1_runtime_provision",
    "targets": [
      "post_api_v1_runtime_provision"
    ]
  },
  {
    "propertyPath": "openclaw.engine.restartGateway",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "() => Promise<{\n        success: boolean;\n        status?: OpenClawEngineStatus;\n        error?: string;\n      }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI",
    "target": "post_api_v1_runtime_restart",
    "targets": [
      "post_api_v1_runtime_restart"
    ]
  },
  {
    "propertyPath": "openclaw.engine.repairGatewayState",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "() => Promise<OpenClawGatewayRepairResult>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI",
    "target": "post_api_v1_runtime_repair",
    "targets": [
      "post_api_v1_runtime_repair"
    ]
  },
  {
    "propertyPath": "openclaw.engine.onProgress",
    "transport": "stream",
    "disposition": "ga",
    "optional": false,
    "signature": "(callback: (status: OpenClawEngineStatus) => void) => () => void",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI",
    "target": "openclawEngineProgress",
    "targets": [
      "openclawEngineProgress"
    ]
  },
  {
    "propertyPath": "openclaw.sessionPolicy.get",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "() => Promise<{\n        success: boolean;\n        config?: OpenClawSessionPolicyConfig;\n        error?: string;\n      }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI",
    "target": "get_api_v1_runtime_session_policy",
    "targets": [
      "get_api_v1_runtime_session_policy"
    ]
  },
  {
    "propertyPath": "openclaw.sessionPolicy.set",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "(\n        config: OpenClawSessionPolicyConfig,\n      ) => Promise<{ success: boolean; config?: OpenClawSessionPolicyConfig; error?: string }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI",
    "target": "put_api_v1_runtime_session_policy",
    "targets": [
      "put_api_v1_runtime_session_policy"
    ]
  },
  {
    "propertyPath": "openclaw.session.patch",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "(options: {\n        sessionId: string;\n        patch: OpenClawSessionPatch;\n      }) => Promise<{ success: boolean; session?: CoworkSession; error?: string }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI",
    "target": "patch_api_v1_sessions_id_runtime",
    "targets": [
      "patch_api_v1_sessions_id_runtime"
    ]
  },
  {
    "propertyPath": "openclaw.browser.getStatus",
    "transport": "rest",
    "disposition": "deferred",
    "optional": false,
    "signature": "(options?: { profile?: BrowserRuntimeProfile }) => Promise<{ success: boolean; status?: Record<string, unknown>; error?: string }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI",
    "targets": []
  },
  {
    "propertyPath": "openclaw.browser.listProfiles",
    "transport": "rest",
    "disposition": "deferred",
    "optional": false,
    "signature": "() => Promise<{ success: boolean; profiles?: unknown[]; error?: string }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI",
    "targets": []
  },
  {
    "propertyPath": "openclaw.browser.test",
    "transport": "rest",
    "disposition": "deferred",
    "optional": false,
    "signature": "(options?: { profile?: BrowserRuntimeProfile }) => Promise<BrowserDiagnosticResult>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI",
    "targets": []
  },
  {
    "propertyPath": "openclaw.browser.resetProfile",
    "transport": "rest",
    "disposition": "deferred",
    "optional": false,
    "signature": "(options?: { profile?: BrowserRuntimeProfile }) => Promise<{ success: boolean; result?: Record<string, unknown>; error?: string }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI",
    "targets": []
  },
  {
    "propertyPath": "openclaw.dataMigration.backup",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "() => Promise<DataMigrationBackupResult>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI",
    "target": "post_api_v1_runtime_migration_backups",
    "targets": [
      "post_api_v1_runtime_migration_backups"
    ]
  },
  {
    "propertyPath": "openclaw.dataMigration.restore",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "() => Promise<DataMigrationRestoreScheduleResult>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI",
    "target": "post_api_v1_runtime_migration_restores",
    "targets": [
      "post_api_v1_runtime_migration_restores"
    ]
  },
  {
    "propertyPath": "openclaw.dataMigration.getLastRestoreResult",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "() => Promise<DataMigrationLastRestoreResponse>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI",
    "target": "get_api_v1_runtime_migration_last_restore",
    "targets": [
      "get_api_v1_runtime_migration_last_restore"
    ]
  },
  {
    "propertyPath": "ipcRenderer.send",
    "transport": "rest",
    "disposition": "deferred",
    "optional": false,
    "signature": "(channel: string, ...args: any[]) => void",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI",
    "targets": []
  },
  {
    "propertyPath": "ipcRenderer.on",
    "transport": "rest",
    "disposition": "deferred",
    "optional": false,
    "signature": "(channel: string, func: (...args: any[]) => void) => () => void",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI",
    "targets": []
  },
  {
    "propertyPath": "window.minimize",
    "transport": "browser",
    "disposition": "browser-fallback",
    "optional": false,
    "signature": "() => void",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI",
    "targets": []
  },
  {
    "propertyPath": "window.toggleMaximize",
    "transport": "browser",
    "disposition": "browser-fallback",
    "optional": false,
    "signature": "() => void",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI",
    "targets": []
  },
  {
    "propertyPath": "window.close",
    "transport": "browser",
    "disposition": "browser-fallback",
    "optional": false,
    "signature": "() => void",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI",
    "targets": []
  },
  {
    "propertyPath": "window.isMaximized",
    "transport": "browser",
    "disposition": "browser-fallback",
    "optional": false,
    "signature": "() => Promise<boolean>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI",
    "targets": []
  },
  {
    "propertyPath": "window.showSystemMenu",
    "transport": "browser",
    "disposition": "browser-fallback",
    "optional": false,
    "signature": "(position: { x: number; y: number }) => void",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI",
    "targets": []
  },
  {
    "propertyPath": "window.onStateChanged",
    "transport": "browser",
    "disposition": "browser-fallback",
    "optional": false,
    "signature": "(callback: (state: WindowState) => void) => () => void",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI",
    "targets": []
  },
  {
    "propertyPath": "cowork.startSession",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "(options: {\n      prompt: string;\n      cwd?: string;\n      systemPrompt?: string;\n      title?: string;\n      activeSkillIds?: string[];\n      runtimeSkillIds?: string[];\n      kitIds?: string[];\n      kitReferences?: KitReference[];\n      resolvedKitCapabilities?: ResolvedKitCapabilities;\n      selectedTextSnippets?: Array<{ id: string; text: string; sourceMessageId?: string; sourceMessageType?: 'assistant' | 'artifact_markdown' | 'artifact_text'; sourceId?: string; sourceType?: 'assistant' | 'artifact_markdown' | 'artifact_text'; sourceTitle?: string; sourcePath?: string; artifactId?: string; createdAt: number; startOffset?: number; endOffset?: number }>;\n      agentId?: string;\n      imageAttachments?: Array<{ name: string; mimeType: string; base64Data: string; sizeBytes?: number; localPath?: string; previewMimeType?: string; previewBase64Data?: string }>;\n      mediaSelection?: { mode: string; modelId?: string; modelName?: string; imageModelId?: string; videoModelId?: string };\n      mediaReferences?: Array<{ token: string; mediaType: string; index: number; fileId: string; fileName: string; mimeType: string; localPath?: string; remoteUrl?: string; dataUrl?: string; role?: string }>;\n    }) => Promise<{\n      success: boolean;\n      session?: CoworkSession;\n      error?: string;\n      code?: string;\n      engineStatus?: OpenClawEngineStatus;\n    }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI",
    "target": "post_api_v1_sessions",
    "targets": [
      "post_api_v1_sessions"
    ]
  },
  {
    "propertyPath": "cowork.continueSession",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "(options: {\n      sessionId: string;\n      prompt: string;\n      systemPrompt?: string;\n      activeSkillIds?: string[];\n      runtimeSkillIds?: string[];\n      kitIds?: string[];\n      kitReferences?: KitReference[];\n      resolvedKitCapabilities?: ResolvedKitCapabilities;\n      selectedTextSnippets?: Array<{ id: string; text: string; sourceMessageId?: string; sourceMessageType?: 'assistant' | 'artifact_markdown' | 'artifact_text'; sourceId?: string; sourceType?: 'assistant' | 'artifact_markdown' | 'artifact_text'; sourceTitle?: string; sourcePath?: string; artifactId?: string; createdAt: number; startOffset?: number; endOffset?: number }>;\n      imageAttachments?: Array<{ name: string; mimeType: string; base64Data: string; sizeBytes?: number; localPath?: string; previewMimeType?: string; previewBase64Data?: string }>;\n      mediaSelection?: { mode: string; modelId?: string; modelName?: string; imageModelId?: string; videoModelId?: string };\n      mediaReferences?: Array<{ token: string; mediaType: string; index: number; fileId: string; fileName: string; mimeType: string; localPath?: string; remoteUrl?: string; dataUrl?: string; role?: string }>;\n    }) => Promise<{\n      success: boolean;\n      session?: CoworkSession;\n      error?: string;\n      code?: string;\n      engineStatus?: OpenClawEngineStatus;\n    }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI",
    "target": "post_api_v1_sessions_id_turns",
    "targets": [
      "post_api_v1_sessions_id_turns"
    ]
  },
  {
    "propertyPath": "cowork.runGoalCommand",
    "transport": "rest",
    "disposition": "deferred",
    "optional": false,
    "signature": "(options: { sessionId: string; command: string }) => Promise<{\n      success: boolean;\n      goal?: CoworkGoal | null;\n      error?: string;\n      code?: string;\n      engineStatus?: OpenClawEngineStatus;\n    }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI",
    "targets": []
  },
  {
    "propertyPath": "cowork.stopSession",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "(sessionId: string) => Promise<{ success: boolean; error?: string }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI",
    "target": "post_api_v1_sessions_id_stop",
    "targets": [
      "post_api_v1_sessions_id_stop"
    ]
  },
  {
    "propertyPath": "cowork.deleteSession",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "(sessionId: string) => Promise<{ success: boolean; error?: string }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI",
    "target": "delete_api_v1_sessions_id",
    "targets": [
      "delete_api_v1_sessions_id"
    ]
  },
  {
    "propertyPath": "cowork.deleteSessions",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "(sessionIds: string[]) => Promise<{ success: boolean; error?: string }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI",
    "target": "post_api_v1_sessions_batch_delete",
    "targets": [
      "post_api_v1_sessions_batch_delete"
    ]
  },
  {
    "propertyPath": "cowork.setSessionPinned",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "(options: {\n      sessionId: string;\n      pinned: boolean;\n    }) => Promise<{ success: boolean; pinOrder?: number | null; error?: string }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI",
    "target": "patch_api_v1_sessions_id",
    "targets": [
      "patch_api_v1_sessions_id"
    ]
  },
  {
    "propertyPath": "cowork.renameSession",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "(options: {\n      sessionId: string;\n      title: string;\n    }) => Promise<{ success: boolean; error?: string }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI",
    "target": "patch_api_v1_sessions_id",
    "targets": [
      "patch_api_v1_sessions_id"
    ]
  },
  {
    "propertyPath": "cowork.forkSession",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "(options: {\n      sessionId: string;\n      forkedFromMessageId?: string | null;\n      title?: string;\n    }) => Promise<{ success: boolean; session?: CoworkSession; error?: string }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI",
    "target": "post_api_v1_sessions_id_fork",
    "targets": [
      "post_api_v1_sessions_id_fork"
    ]
  },
  {
    "propertyPath": "cowork.getSession",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "(\n      sessionId: string,\n    ) => Promise<{ success: boolean; session?: CoworkSession; error?: string }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI",
    "target": "get_api_v1_sessions_id",
    "targets": [
      "get_api_v1_sessions_id"
    ]
  },
  {
    "propertyPath": "cowork.markSessionViewed",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "(\n      sessionId: string,\n    ) => Promise<{ success: boolean; error?: string }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI",
    "target": "post_api_v1_sessions_id_viewed",
    "targets": [
      "post_api_v1_sessions_id_viewed"
    ]
  },
  {
    "propertyPath": "cowork.remoteManaged",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "(\n      sessionId: string,\n    ) => Promise<{ success: boolean; remoteManaged: boolean; error?: string }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI",
    "target": "get_api_v1_sessions_id_managed",
    "targets": [
      "get_api_v1_sessions_id_managed"
    ]
  },
  {
    "propertyPath": "cowork.listSessions",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "(options?: { limit?: number; offset?: number; agentId?: string; searchQuery?: string }) => Promise<{\n      success: boolean;\n      sessions?: CoworkSessionSummary[];\n      hasMore?: boolean;\n      error?: string;\n    }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI",
    "target": "get_api_v1_sessions",
    "targets": [
      "get_api_v1_sessions"
    ]
  },
  {
    "propertyPath": "cowork.getContextUsage",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "(\n      sessionId: string,\n    ) => Promise<{\n      success: boolean;\n      usage?: CoworkContextUsage | null;\n      source?: CoworkContextUsageSource;\n      reason?: CoworkContextUsageFailureReason;\n      error?: string;\n    }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI",
    "target": "get_api_v1_sessions_id_context_usage",
    "targets": [
      "get_api_v1_sessions_id_context_usage"
    ]
  },
  {
    "propertyPath": "cowork.compactContext",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "(\n      sessionId: string,\n    ) => Promise<{\n      success: boolean;\n      compacted?: boolean;\n      reason?: string;\n      usage?: CoworkContextUsage | null;\n      error?: string;\n    }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI",
    "target": "post_api_v1_sessions_id_compact_context",
    "targets": [
      "post_api_v1_sessions_id_compact_context"
    ]
  },
  {
    "propertyPath": "cowork.getSessionMessages",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "(options: {\n      sessionId: string;\n      limit?: number;\n      offset?: number;\n    }) => Promise<{\n      success: boolean;\n      messages?: CoworkMessage[];\n      offset?: number;\n      total?: number;\n      error?: string;\n    }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI",
    "target": "get_api_v1_sessions_id_messages",
    "targets": [
      "get_api_v1_sessions_id_messages"
    ]
  },
  {
    "propertyPath": "cowork.getSessionMessageRailIndex",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "(\n      sessionId: string,\n    ) => Promise<{\n      success: boolean;\n      items?: CoworkMessageRailIndexItem[];\n      error?: string;\n    }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI",
    "target": "get_api_v1_sessions_id_rail_index",
    "targets": [
      "get_api_v1_sessions_id_rail_index"
    ]
  },
  {
    "propertyPath": "cowork.exportResultImage",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "(options: {\n      rect: { x: number; y: number; width: number; height: number };\n      defaultFileName?: string;\n    }) => Promise<{ success: boolean; canceled?: boolean; path?: string; error?: string }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI",
    "target": "post_api_v1_sessions_id_exports_result_image",
    "targets": [
      "post_api_v1_sessions_id_exports_result_image"
    ]
  },
  {
    "propertyPath": "cowork.captureImageChunk",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "(options: {\n      rect: { x: number; y: number; width: number; height: number };\n    }) => Promise<{\n      success: boolean;\n      width?: number;\n      height?: number;\n      pngBase64?: string;\n      error?: string;\n    }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI",
    "target": "post_api_v1_sessions_id_result_image_chunks",
    "targets": [
      "post_api_v1_sessions_id_result_image_chunks"
    ]
  },
  {
    "propertyPath": "cowork.saveResultImage",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "(options: {\n      pngBase64: string;\n      defaultFileName?: string;\n    }) => Promise<{ success: boolean; canceled?: boolean; path?: string; error?: string }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI",
    "target": "post_api_v1_sessions_id_result_image_files",
    "targets": [
      "post_api_v1_sessions_id_result_image_files"
    ]
  },
  {
    "propertyPath": "cowork.exportSessionText",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "(options: {\n      content: string;\n      defaultFileName?: string;\n      fileExtension?: string;\n    }) => Promise<{ success: boolean; canceled?: boolean; path?: string; error?: string }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI",
    "target": "post_api_v1_sessions_id_exports_text",
    "targets": [
      "post_api_v1_sessions_id_exports_text"
    ]
  },
  {
    "propertyPath": "cowork.exportSessionDiagnostics",
    "transport": "rest",
    "disposition": "deferred",
    "optional": false,
    "signature": "(options: {\n      sessionId: string;\n    }) => Promise<{ success: boolean; canceled?: boolean; path?: string; error?: string }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI",
    "targets": []
  },
  {
    "propertyPath": "cowork.cancelMediaTask",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "(taskId: string) => Promise<{ success: boolean; message?: string }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI",
    "target": "post_api_v1_media_tasks_taskId_cancel",
    "targets": [
      "post_api_v1_media_tasks_taskId_cancel"
    ]
  },
  {
    "propertyPath": "cowork.getSubTaskHistory",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "(options: {\n      parentSessionId: string;\n      agentId: string;\n      sessionKey?: string;\n    }) => Promise<{\n      success: boolean;\n      messages?: Array<{\n        id: string;\n        type: 'user' | 'assistant' | 'tool_use' | 'tool_result' | 'system';\n        content: string;\n        timestamp: number;\n        metadata?: {\n          toolName?: string;\n          toolInput?: Record<string, unknown>;\n          toolResult?: string;\n          toolUseId?: string | null;\n          isError?: boolean;\n          [key: string]: unknown;\n        };\n      }>;\n      error?: string;\n    }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI",
    "target": "get_api_v1_subagents_runId_messages",
    "targets": [
      "get_api_v1_subagents_runId_messages"
    ]
  },
  {
    "propertyPath": "cowork.listSubagentSessions",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "(parentSessionId: string) => Promise<{\n      success: boolean;\n      runs?: Array<{\n        id: string;\n        agentId: string | null;\n        task: string | null;\n        label: string | null;\n        sessionKey: string | null;\n        status: 'running' | 'done' | 'error';\n        createdAt: number;\n        endedAt: number | null;\n      }>;\n      error?: string;\n    }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI",
    "target": "get_api_v1_sessions_id_subagents",
    "targets": [
      "get_api_v1_sessions_id_subagents"
    ]
  },
  {
    "propertyPath": "cowork.deleteSubagentSession",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "(options: {\n      parentSessionId: string;\n      runId: string;\n    }) => Promise<{ success: boolean; deleted?: boolean; error?: string }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI",
    "target": "delete_api_v1_subagents_runId",
    "targets": [
      "delete_api_v1_subagents_runId"
    ]
  },
  {
    "propertyPath": "cowork.respondToPermission",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "(options: {\n      requestId: string;\n      result: CoworkPermissionResult;\n    }) => Promise<{ success: boolean; error?: string }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI",
    "target": "post_api_v1_sessions_id_permissions_requestId_respond",
    "targets": [
      "post_api_v1_sessions_id_permissions_requestId_respond"
    ]
  },
  {
    "propertyPath": "cowork.getConfig",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "() => Promise<{ success: boolean; config?: CoworkConfig; error?: string }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI",
    "target": "get_api_v1_cowork_config",
    "targets": [
      "get_api_v1_cowork_config"
    ]
  },
  {
    "propertyPath": "cowork.setConfig",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "(config: CoworkConfigUpdate) => Promise<{ success: boolean; error?: string }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI",
    "target": "patch_api_v1_cowork_config",
    "targets": [
      "patch_api_v1_cowork_config"
    ]
  },
  {
    "propertyPath": "cowork.getDreamingStatus",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "() => Promise<{ success: boolean; data?: Record<string, unknown> | null; error?: string }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI",
    "target": "get_api_v1_cowork_dreaming_status",
    "targets": [
      "get_api_v1_cowork_dreaming_status"
    ]
  },
  {
    "propertyPath": "cowork.getDreamDiary",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "() => Promise<{ success: boolean; data?: Record<string, unknown>; error?: string }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI",
    "target": "get_api_v1_cowork_dreaming_diary",
    "targets": [
      "get_api_v1_cowork_dreaming_diary"
    ]
  },
  {
    "propertyPath": "cowork.notifyOpenSessionFromNotificationReady",
    "transport": "rest",
    "disposition": "deferred",
    "optional": false,
    "signature": "() => Promise<{ success: boolean; error?: string }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI",
    "targets": []
  },
  {
    "propertyPath": "cowork.onOpenSessionFromNotification",
    "transport": "stream",
    "disposition": "ga",
    "optional": false,
    "signature": "(\n      callback: (data: { sessionId: string }) => void,\n    ) => () => void",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI",
    "target": "openSessionFromNotification",
    "targets": [
      "openSessionFromNotification"
    ]
  },
  {
    "propertyPath": "cowork.listMemoryEntries",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "(input: {\n      query?: string;\n      limit?: number;\n      offset?: number;\n    }) => Promise<{ success: boolean; entries?: CoworkUserMemoryEntry[]; error?: string }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI",
    "target": "get_api_v1_cowork_memory_entries",
    "targets": [
      "get_api_v1_cowork_memory_entries"
    ]
  },
  {
    "propertyPath": "cowork.createMemoryEntry",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "(input: {\n      text: string;\n    }) => Promise<{ success: boolean; entry?: CoworkUserMemoryEntry; error?: string }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI",
    "target": "post_api_v1_cowork_memory_entries",
    "targets": [
      "post_api_v1_cowork_memory_entries"
    ]
  },
  {
    "propertyPath": "cowork.updateMemoryEntry",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "(input: {\n      id: string;\n      text: string;\n    }) => Promise<{ success: boolean; entry?: CoworkUserMemoryEntry; error?: string }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI",
    "target": "patch_api_v1_cowork_memory_entries_id",
    "targets": [
      "patch_api_v1_cowork_memory_entries_id"
    ]
  },
  {
    "propertyPath": "cowork.deleteMemoryEntry",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "(input: { id: string }) => Promise<{ success: boolean; error?: string }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI",
    "target": "delete_api_v1_cowork_memory_entries_id",
    "targets": [
      "delete_api_v1_cowork_memory_entries_id"
    ]
  },
  {
    "propertyPath": "cowork.getMemoryStats",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "() => Promise<{ success: boolean; stats?: CoworkMemoryStats; error?: string }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI",
    "target": "get_api_v1_cowork_memory_stats",
    "targets": [
      "get_api_v1_cowork_memory_stats"
    ]
  },
  {
    "propertyPath": "cowork.readMemoryFileRaw",
    "transport": "rest",
    "disposition": "deferred",
    "optional": false,
    "signature": "() => Promise<{ success: boolean; content?: string; error?: string }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI",
    "targets": []
  },
  {
    "propertyPath": "cowork.writeMemoryFileRaw",
    "transport": "rest",
    "disposition": "deferred",
    "optional": false,
    "signature": "(input: {\n      content: string;\n    }) => Promise<{ success: boolean; error?: string }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI",
    "targets": []
  },
  {
    "propertyPath": "cowork.readBootstrapFile",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "(\n      filename: string,\n    ) => Promise<{ success: boolean; content: string; error?: string }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI",
    "target": "get_api_v1_cowork_bootstrap",
    "targets": [
      "get_api_v1_cowork_bootstrap"
    ]
  },
  {
    "propertyPath": "cowork.writeBootstrapFile",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "(\n      filename: string,\n      content: string,\n    ) => Promise<{ success: boolean; error?: string }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI",
    "target": "put_api_v1_cowork_bootstrap",
    "targets": [
      "put_api_v1_cowork_bootstrap"
    ]
  },
  {
    "propertyPath": "cowork.onStreamMessage",
    "transport": "stream",
    "disposition": "ga",
    "optional": false,
    "signature": "(\n      callback: (data: { sessionId: string; message: CoworkMessage; beforeMessageId?: string }) => void,\n    ) => () => void",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI",
    "target": "message",
    "targets": [
      "message"
    ]
  },
  {
    "propertyPath": "cowork.onStreamMessageUpdate",
    "transport": "stream",
    "disposition": "ga",
    "optional": false,
    "signature": "(\n      callback: (data: {\n        sessionId: string;\n        messageId: string;\n        content: string;\n        metadata?: Record<string, unknown>;\n      }) => void,\n    ) => () => void",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI",
    "target": "messageUpdate",
    "targets": [
      "messageUpdate"
    ]
  },
  {
    "propertyPath": "cowork.onMediaStatusPollUpdate",
    "transport": "stream",
    "disposition": "ga",
    "optional": true,
    "signature": "(\n      callback: (data: { sessionId: string; toolCallId: string; details: Record<string, unknown> }) => void,\n    ) => () => void",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI",
    "target": "mediaStatusPollUpdate",
    "targets": [
      "mediaStatusPollUpdate"
    ]
  },
  {
    "propertyPath": "cowork.onStreamSessionStatus",
    "transport": "stream",
    "disposition": "ga",
    "optional": false,
    "signature": "(\n      callback: (data: { sessionId: string; status: CoworkSessionStatus }) => void,\n    ) => () => void",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI",
    "target": "sessionStatus",
    "targets": [
      "sessionStatus"
    ]
  },
  {
    "propertyPath": "cowork.onStreamContextUsage",
    "transport": "stream",
    "disposition": "ga",
    "optional": true,
    "signature": "(\n      callback: (data: { sessionId: string; usage: CoworkContextUsage }) => void,\n    ) => () => void",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI",
    "target": "contextUsage",
    "targets": [
      "contextUsage"
    ]
  },
  {
    "propertyPath": "cowork.onStreamGoal",
    "transport": "stream",
    "disposition": "ga",
    "optional": true,
    "signature": "(\n      callback: (data: { sessionId: string; goal: CoworkGoal | null }) => void,\n    ) => () => void",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI",
    "target": "goal",
    "targets": [
      "goal"
    ]
  },
  {
    "propertyPath": "cowork.onStreamContextMaintenance",
    "transport": "stream",
    "disposition": "ga",
    "optional": true,
    "signature": "(\n      callback: (data: { sessionId: string; active: boolean }) => void,\n    ) => () => void",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI",
    "target": "contextMaintenance",
    "targets": [
      "contextMaintenance"
    ]
  },
  {
    "propertyPath": "cowork.onStreamPermission",
    "transport": "stream",
    "disposition": "ga",
    "optional": false,
    "signature": "(\n      callback: (data: { sessionId: string; request: CoworkPermissionRequest }) => void,\n    ) => () => void",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI",
    "target": "permission",
    "targets": [
      "permission"
    ]
  },
  {
    "propertyPath": "cowork.onStreamPermissionDismiss",
    "transport": "stream",
    "disposition": "ga",
    "optional": false,
    "signature": "(callback: (data: { requestId: string }) => void) => () => void",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI",
    "target": "permissionDismiss",
    "targets": [
      "permissionDismiss"
    ]
  },
  {
    "propertyPath": "cowork.onStreamComplete",
    "transport": "stream",
    "disposition": "ga",
    "optional": false,
    "signature": "(\n      callback: (data: { sessionId: string; claudeSessionId: string | null }) => void,\n    ) => () => void",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI",
    "target": "complete",
    "targets": [
      "complete"
    ]
  },
  {
    "propertyPath": "cowork.onStreamError",
    "transport": "stream",
    "disposition": "ga",
    "optional": false,
    "signature": "(callback: (data: { sessionId: string; error: string }) => void) => () => void",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI",
    "target": "error",
    "targets": [
      "error"
    ]
  },
  {
    "propertyPath": "cowork.onSessionsChanged",
    "transport": "stream",
    "disposition": "ga",
    "optional": false,
    "signature": "(callback: () => void) => () => void",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI",
    "target": "sessionsChanged",
    "targets": [
      "sessionsChanged"
    ]
  },
  {
    "propertyPath": "cowork.onSessionModelOverrideChanged",
    "transport": "stream",
    "disposition": "deferred",
    "optional": true,
    "signature": "(\n      callback: (data: { sessionId: string; modelOverride: string }) => void,\n    ) => () => void",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI",
    "targets": []
  },
  {
    "propertyPath": "dialog.selectDirectory",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "() => Promise<{ success: boolean; path: string | null }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI",
    "target": "get_api_v1_workspaces_wid_files_tree",
    "targets": [
      "get_api_v1_workspaces_wid_files_tree"
    ]
  },
  {
    "propertyPath": "dialog.selectFile",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "(options?: {\n      title?: string;\n      filters?: { name: string; extensions: string[] }[];\n    }) => Promise<{ success: boolean; path: string | null }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI",
    "target": "post_api_v1_workspaces_wid_files_upload",
    "targets": [
      "post_api_v1_workspaces_wid_files_upload"
    ]
  },
  {
    "propertyPath": "dialog.selectFiles",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "(options?: {\n      title?: string;\n      filters?: { name: string; extensions: string[] }[];\n    }) => Promise<{ success: boolean; paths: string[] }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI",
    "target": "post_api_v1_workspaces_wid_files_upload",
    "targets": [
      "post_api_v1_workspaces_wid_files_upload"
    ]
  },
  {
    "propertyPath": "dialog.saveInlineFile",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "(options: {\n      dataBase64: string;\n      fileName?: string;\n      mimeType?: string;\n      cwd?: string;\n    }) => Promise<{ success: boolean; path: string | null; error?: string }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI",
    "target": "post_api_v1_workspaces_wid_files_upload",
    "targets": [
      "post_api_v1_workspaces_wid_files_upload"
    ]
  },
  {
    "propertyPath": "dialog.readFileAsDataUrl",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "(\n      filePath: string,\n    ) => Promise<{ success: boolean; dataUrl?: string; error?: string }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI",
    "target": "get_api_v1_workspaces_wid_files_download",
    "targets": [
      "get_api_v1_workspaces_wid_files_download"
    ]
  },
  {
    "propertyPath": "dialog.statFile",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "(\n      filePath: string,\n    ) => Promise<{ success: boolean; isFile?: boolean; size?: number; mtimeMs?: number; error?: string }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI",
    "target": "get_api_v1_workspaces_wid_files_stat",
    "targets": [
      "get_api_v1_workspaces_wid_files_stat"
    ]
  },
  {
    "propertyPath": "dialog.readTextFile",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "(\n      filePath: string,\n    ) => Promise<{\n      success: boolean;\n      content?: string;\n      size?: number;\n      readBytes?: number;\n      truncated?: boolean;\n      error?: string;\n    }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI",
    "target": "get_api_v1_workspaces_wid_files_download",
    "targets": [
      "get_api_v1_workspaces_wid_files_download"
    ]
  },
  {
    "propertyPath": "dialog.generateThumbnail",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "(\n      filePath: string,\n    ) => Promise<{ success: boolean; dataUrl?: string; error?: string }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI",
    "target": "get_api_v1_workspaces_wid_files_thumbnail",
    "targets": [
      "get_api_v1_workspaces_wid_files_thumbnail"
    ]
  },
  {
    "propertyPath": "dialog.showMessageBox",
    "transport": "rest",
    "disposition": "deferred",
    "optional": false,
    "signature": "(options: {\n      message: string;\n      type?: 'none' | 'info' | 'error' | 'question' | 'warning';\n      title?: string;\n    }) => Promise<{ response: number }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI",
    "targets": []
  },
  {
    "propertyPath": "shell.openPath",
    "transport": "browser",
    "disposition": "browser-fallback",
    "optional": false,
    "signature": "(filePath: string) => Promise<ShellActionResponse>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI",
    "targets": []
  },
  {
    "propertyPath": "shell.showItemInFolder",
    "transport": "browser",
    "disposition": "browser-fallback",
    "optional": false,
    "signature": "(filePath: string) => Promise<ShellActionResponse>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI",
    "targets": []
  },
  {
    "propertyPath": "shell.openExternal",
    "transport": "browser",
    "disposition": "browser-fallback",
    "optional": false,
    "signature": "(url: string) => Promise<{ success: boolean; error?: string }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI",
    "targets": []
  },
  {
    "propertyPath": "shell.openHtmlInBrowser",
    "transport": "browser",
    "disposition": "browser-fallback",
    "optional": false,
    "signature": "(htmlContent: string) => Promise<{ success: boolean; error?: string }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI",
    "targets": []
  },
  {
    "propertyPath": "shell.getAppsForFile",
    "transport": "browser",
    "disposition": "browser-fallback",
    "optional": false,
    "signature": "(\n      filePath: string,\n    ) => Promise<{\n      success: boolean;\n      apps: Array<{ name: string; path: string; isDefault: boolean; icon?: string }>;\n      error?: string;\n    }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI",
    "targets": []
  },
  {
    "propertyPath": "shell.getBrowserApps",
    "transport": "browser",
    "disposition": "browser-fallback",
    "optional": false,
    "signature": "(options?: ShellGetBrowserAppsInput) => Promise<{\n      success: boolean;\n      apps: Array<{ name: string; path: string; isDefault: boolean; icon?: string }>;\n      error?: string;\n    }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI",
    "targets": []
  },
  {
    "propertyPath": "shell.openPathWithApp",
    "transport": "browser",
    "disposition": "browser-fallback",
    "optional": false,
    "signature": "(\n      filePath: string,\n      appPath: string,\n    ) => Promise<ShellActionResponse>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI",
    "targets": []
  },
  {
    "propertyPath": "shell.openUrlWithApp",
    "transport": "browser",
    "disposition": "browser-fallback",
    "optional": false,
    "signature": "(\n      url: string,\n      appPath: string,\n    ) => Promise<ShellActionResponse>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI",
    "targets": []
  },
  {
    "propertyPath": "clipboard.writeText",
    "transport": "browser",
    "disposition": "browser-fallback",
    "optional": false,
    "signature": "(text: string) => Promise<{ success: boolean; error?: string }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI",
    "targets": []
  },
  {
    "propertyPath": "clipboard.writeImageFromFile",
    "transport": "browser",
    "disposition": "browser-fallback",
    "optional": false,
    "signature": "(filePath: string) => Promise<{ success: boolean; error?: string }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI",
    "targets": []
  },
  {
    "propertyPath": "clipboard.writeImageFromDataUrl",
    "transport": "browser",
    "disposition": "browser-fallback",
    "optional": false,
    "signature": "(dataUrl: string) => Promise<{ success: boolean; error?: string }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI",
    "targets": []
  },
  {
    "propertyPath": "htmlShare.createFromHtmlFile",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "(options: {\n      sessionId: string;\n      artifactId: string;\n      filePath: string;\n      title: string;\n      accessMode?: HtmlShareAccessMode;\n    }) => Promise<HtmlShareResult>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI",
    "target": "post_api_v1_html_shares",
    "targets": [
      "post_api_v1_html_shares"
    ]
  },
  {
    "propertyPath": "htmlShare.updateFromHtmlFile",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "(options: {\n      shareId: string;\n      sessionId: string;\n      artifactId: string;\n      filePath: string;\n      title: string;\n      currentStatus?: HtmlShareStatus;\n      accessMode?: HtmlShareAccessMode;\n    }) => Promise<HtmlShareResult>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI",
    "target": "put_api_v1_html_shares_id",
    "targets": [
      "put_api_v1_html_shares_id"
    ]
  },
  {
    "propertyPath": "htmlShare.getByHtmlFile",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "(options: {\n      filePath: string;\n    }) => Promise<{ success: boolean; share?: HtmlShareResult | null; error?: string; code?: number }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI",
    "target": "get_api_v1_html_shares",
    "targets": [
      "get_api_v1_html_shares"
    ]
  },
  {
    "propertyPath": "htmlShare.createFromArtifactFile",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "(options: {\n      sourceType: HtmlShareSourceType;\n      sessionId: string;\n      artifactId: string;\n      title: string;\n      accessMode?: HtmlShareAccessMode;\n      fileName?: string;\n      filePath?: string;\n      content?: string;\n      remoteUrl?: string;\n    }) => Promise<HtmlShareResult>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI",
    "target": "post_api_v1_html_shares",
    "targets": [
      "post_api_v1_html_shares"
    ]
  },
  {
    "propertyPath": "htmlShare.updateFromArtifactFile",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "(options: {\n      sourceType: HtmlShareSourceType;\n      shareId: string;\n      sessionId: string;\n      artifactId: string;\n      title: string;\n      accessMode?: HtmlShareAccessMode;\n      fileName?: string;\n      filePath?: string;\n      content?: string;\n      remoteUrl?: string;\n      currentStatus?: HtmlShareStatus;\n    }) => Promise<HtmlShareResult>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI",
    "target": "put_api_v1_html_shares_id",
    "targets": [
      "put_api_v1_html_shares_id"
    ]
  },
  {
    "propertyPath": "htmlShare.getByArtifactFile",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "(options: {\n      sourceType: HtmlShareSourceType;\n      sessionId?: string;\n      artifactId?: string;\n      filePath?: string;\n    }) => Promise<{ success: boolean; share?: HtmlShareResult | null; error?: string; code?: number }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI",
    "target": "get_api_v1_html_shares",
    "targets": [
      "get_api_v1_html_shares"
    ]
  },
  {
    "propertyPath": "htmlShare.updateStatus",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "(options: {\n      shareId: string;\n      status: HtmlShareConfigurableStatus;\n    }) => Promise<HtmlShareResult>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI",
    "target": "patch_api_v1_html_shares_id_status",
    "targets": [
      "patch_api_v1_html_shares_id_status"
    ]
  },
  {
    "propertyPath": "htmlShare.updateAccessMode",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "(options: {\n      shareId: string;\n      accessMode: HtmlShareAccessMode;\n    }) => Promise<HtmlShareResult>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI",
    "target": "patch_api_v1_html_shares_id_access_mode",
    "targets": [
      "patch_api_v1_html_shares_id_access_mode"
    ]
  },
  {
    "propertyPath": "htmlShare.disable",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "(shareId: string) => Promise<HtmlShareResult>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI",
    "target": "patch_api_v1_html_shares_id_status",
    "targets": [
      "patch_api_v1_html_shares_id_status"
    ]
  },
  {
    "propertyPath": "htmlShare.get",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "(shareId: string) => Promise<{ success: boolean; share?: unknown; error?: string }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI",
    "target": "get_api_v1_html_shares_id",
    "targets": [
      "get_api_v1_html_shares_id"
    ]
  },
  {
    "propertyPath": "shareDeployment.detectProjectCandidates",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "(\n      options: ShareDeploymentDetectCandidatesInput,\n    ) => Promise<ShareDeploymentDetectCandidatesResult>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI",
    "target": "post_api_v1_share_deployments_candidates",
    "targets": [
      "post_api_v1_share_deployments_candidates"
    ]
  },
  {
    "propertyPath": "shareDeployment.analyzeProjectDirectory",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "(\n      options: ShareDeploymentAnalyzeProjectInput,\n    ) => Promise<ShareDeploymentProjectAnalysis>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI",
    "target": "post_api_v1_share_deployments_analyze",
    "targets": [
      "post_api_v1_share_deployments_analyze"
    ]
  },
  {
    "propertyPath": "shareDeployment.createNodeDeployment",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "(\n      options: ShareDeploymentCreateNodeInput,\n    ) => Promise<ShareDeploymentResult>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI",
    "target": "post_api_v1_share_deployments_static",
    "targets": [
      "post_api_v1_share_deployments_static",
      "post_api_v1_share_deployments_node"
    ]
  },
  {
    "propertyPath": "shareDeployment.get",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "(deploymentId: string) => Promise<ShareDeploymentResult>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI",
    "target": "get_api_v1_share_deployments_deploymentId",
    "targets": [
      "get_api_v1_share_deployments_deploymentId"
    ]
  },
  {
    "propertyPath": "shareDeployment.getByLocalService",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "(options: ShareDeploymentGetByLocalServiceInput) => Promise<ShareDeploymentResult>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI",
    "target": "get_api_v1_html_shares_shareId_deployment",
    "targets": [
      "get_api_v1_html_shares_shareId_deployment"
    ]
  },
  {
    "propertyPath": "asr.createRealtimeSession",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "(options: AsrRealtimeSessionRequest) => Promise<AsrRealtimeSessionResult>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI",
    "target": "post_api_v1_asr_sessions",
    "targets": [
      "post_api_v1_asr_sessions",
      "asrAudioChunk",
      "asrPartial",
      "asrFinal",
      "asrError"
    ]
  },
  {
    "propertyPath": "artifact.watchFile",
    "transport": "stream",
    "disposition": "ga",
    "optional": false,
    "signature": "(filePath: string) => Promise<void>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI",
    "target": "clientControl",
    "targets": [
      "clientControl"
    ]
  },
  {
    "propertyPath": "artifact.unwatchFile",
    "transport": "stream",
    "disposition": "ga",
    "optional": false,
    "signature": "(filePath: string) => Promise<void>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI",
    "target": "clientControl",
    "targets": [
      "clientControl"
    ]
  },
  {
    "propertyPath": "artifact.onFileChanged",
    "transport": "stream",
    "disposition": "ga",
    "optional": false,
    "signature": "(callback: (data: { filePath: string }) => void) => () => void",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI",
    "target": "filesChanged",
    "targets": [
      "filesChanged"
    ]
  },
  {
    "propertyPath": "artifact.createPreviewSession",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "(\n      filePath: string,\n    ) => Promise<{ success: boolean; sessionId?: string; url?: string; error?: string }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI",
    "target": "post_api_v1_artifacts_artifactId_preview",
    "targets": [
      "post_api_v1_artifacts_artifactId_preview"
    ]
  },
  {
    "propertyPath": "artifact.createOfficePreviewSession",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "(\n      filePath: string,\n    ) => Promise<{ success: boolean; sessionId?: string; url?: string; error?: string }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI",
    "target": "post_api_v1_artifacts_artifactId_preview",
    "targets": [
      "post_api_v1_artifacts_artifactId_preview"
    ]
  },
  {
    "propertyPath": "artifact.destroyPreviewSession",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "(sessionId: string) => Promise<{ success: boolean }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI",
    "target": "delete_api_v1_artifacts_preview_sessions_previewSessionId",
    "targets": [
      "delete_api_v1_artifacts_preview_sessions_previewSessionId"
    ]
  },
  {
    "propertyPath": "artifact.clearBrowserCookies",
    "transport": "rest",
    "disposition": "deferred",
    "optional": false,
    "signature": "() => Promise<{ success: boolean; error?: string }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI",
    "targets": []
  },
  {
    "propertyPath": "artifact.clearBrowserCache",
    "transport": "rest",
    "disposition": "deferred",
    "optional": false,
    "signature": "() => Promise<{ success: boolean; error?: string }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI",
    "targets": []
  },
  {
    "propertyPath": "artifact.listLocalWebServices",
    "transport": "rest",
    "disposition": "deferred",
    "optional": false,
    "signature": "(options?: ListLocalWebServicesOptions) => Promise<LocalWebService[]>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI",
    "targets": []
  },
  {
    "propertyPath": "autoLaunch.get",
    "transport": "rest",
    "disposition": "deferred",
    "optional": false,
    "signature": "() => Promise<{ enabled: boolean }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI",
    "targets": []
  },
  {
    "propertyPath": "autoLaunch.set",
    "transport": "rest",
    "disposition": "deferred",
    "optional": false,
    "signature": "(enabled: boolean) => Promise<{ success: boolean; enabled?: boolean; error?: string; errorCode?: string }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI",
    "targets": []
  },
  {
    "propertyPath": "preventSleep.get",
    "transport": "rest",
    "disposition": "deferred",
    "optional": false,
    "signature": "() => Promise<{ enabled: boolean }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI",
    "targets": []
  },
  {
    "propertyPath": "preventSleep.set",
    "transport": "rest",
    "disposition": "deferred",
    "optional": false,
    "signature": "(enabled: boolean) => Promise<{ success: boolean; error?: string }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI",
    "targets": []
  },
  {
    "propertyPath": "appInfo.getVersion",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "() => Promise<string>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI",
    "target": "get_api_v1_config_app_info",
    "targets": [
      "get_api_v1_config_app_info"
    ]
  },
  {
    "propertyPath": "appInfo.getSystemLocale",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "() => Promise<string>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI",
    "target": "get_api_v1_config_app_info",
    "targets": [
      "get_api_v1_config_app_info"
    ]
  },
  {
    "propertyPath": "appInfo.getKeyfromAttribution",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "() => Promise<{\n      firstKeyfrom: string;\n      latestKeyfrom: string;\n      updatedAt: number;\n    }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI",
    "target": "get_api_v1_config_app_info",
    "targets": [
      "get_api_v1_config_app_info"
    ]
  },
  {
    "propertyPath": "appInfo.relaunch",
    "transport": "rest",
    "disposition": "deferred",
    "optional": false,
    "signature": "() => Promise<void>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI",
    "targets": []
  },
  {
    "propertyPath": "appUpdate.getState",
    "transport": "unsupported",
    "disposition": "deferred",
    "optional": false,
    "signature": "() => Promise<AppUpdateRuntimeState>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI",
    "targets": []
  },
  {
    "propertyPath": "appUpdate.checkNow",
    "transport": "unsupported",
    "disposition": "deferred",
    "optional": false,
    "signature": "(options?: {\n      manual?: boolean;\n      userId?: string | null;\n    }) => Promise<AppUpdateCheckResult>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI",
    "targets": []
  },
  {
    "propertyPath": "appUpdate.retryDownload",
    "transport": "unsupported",
    "disposition": "deferred",
    "optional": false,
    "signature": "() => Promise<{ success: boolean; state: AppUpdateRuntimeState }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI",
    "targets": []
  },
  {
    "propertyPath": "appUpdate.cancelDownload",
    "transport": "unsupported",
    "disposition": "deferred",
    "optional": false,
    "signature": "() => Promise<{ success: boolean; state: AppUpdateRuntimeState }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI",
    "targets": []
  },
  {
    "propertyPath": "appUpdate.installReady",
    "transport": "unsupported",
    "disposition": "deferred",
    "optional": false,
    "signature": "() => Promise<{ success: boolean; state: AppUpdateRuntimeState; error?: string }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI",
    "targets": []
  },
  {
    "propertyPath": "appUpdate.onStateChanged",
    "transport": "unsupported",
    "disposition": "deferred",
    "optional": false,
    "signature": "(callback: (data: AppUpdateRuntimeState) => void) => () => void",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI",
    "targets": []
  },
  {
    "propertyPath": "log.getPath",
    "transport": "rest",
    "disposition": "deferred",
    "optional": false,
    "signature": "() => Promise<string>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI",
    "targets": []
  },
  {
    "propertyPath": "log.openFolder",
    "transport": "rest",
    "disposition": "deferred",
    "optional": false,
    "signature": "() => Promise<void>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI",
    "targets": []
  },
  {
    "propertyPath": "log.exportZip",
    "transport": "rest",
    "disposition": "deferred",
    "optional": false,
    "signature": "() => Promise<{\n      success: boolean;\n      canceled?: boolean;\n      path?: string;\n      missingEntries?: string[];\n      error?: string;\n    }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI",
    "targets": []
  },
  {
    "propertyPath": "log.fromRenderer",
    "transport": "rest",
    "disposition": "deferred",
    "optional": false,
    "signature": "(level: string, tag: string, message: string) => void",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI",
    "targets": []
  },
  {
    "propertyPath": "plugins.list",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "() => Promise<{\n      success: boolean;\n      plugins?: Array<{\n        pluginId: string;\n        version?: string;\n        description?: string;\n        source: 'npm' | 'clawhub' | 'git' | 'local' | 'bundled' | 'openclaw';\n        enabled: boolean;\n        canUninstall: boolean;\n        hasConfig: boolean;\n      }>;\n      error?: string;\n    }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI",
    "target": "get_api_v1_plugins",
    "targets": [
      "get_api_v1_plugins"
    ]
  },
  {
    "propertyPath": "plugins.install",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "(params: {\n      source: 'npm' | 'clawhub' | 'git' | 'local';\n      spec: string;\n      registry?: string;\n      version?: string;\n    }) => Promise<{ ok: boolean; pluginId?: string; version?: string; error?: string }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI",
    "target": "post_api_v1_plugins_install",
    "targets": [
      "post_api_v1_plugins_install"
    ]
  },
  {
    "propertyPath": "plugins.uninstall",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "(pluginId: string) => Promise<{ ok: boolean; error?: string }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI",
    "target": "delete_api_v1_plugins_id",
    "targets": [
      "delete_api_v1_plugins_id"
    ]
  },
  {
    "propertyPath": "plugins.setEnabled",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "(pluginId: string, enabled: boolean) => Promise<{ ok: boolean; error?: string }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI",
    "target": "patch_api_v1_plugins_id",
    "targets": [
      "patch_api_v1_plugins_id"
    ]
  },
  {
    "propertyPath": "plugins.getConfigSchema",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "(pluginId: string) => Promise<{\n      success: boolean;\n      schema?: {\n        configSchema: Record<string, unknown>;\n        uiHints: Record<\n          string,\n          {\n            label?: string;\n            help?: string;\n            sensitive?: boolean;\n            advanced?: boolean;\n            placeholder?: string;\n            order?: number;\n          }\n        >;\n      } | null;\n      config?: Record<string, unknown> | null;\n      error?: string;\n    }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI",
    "target": "get_api_v1_plugins_id_config_schema",
    "targets": [
      "get_api_v1_plugins_id_config_schema"
    ]
  },
  {
    "propertyPath": "plugins.saveConfig",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "(\n      pluginId: string,\n      config: Record<string, unknown>,\n    ) => Promise<{ ok: boolean; error?: string }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI",
    "target": "put_api_v1_plugins_id_config",
    "targets": [
      "put_api_v1_plugins_id_config"
    ]
  },
  {
    "propertyPath": "plugins.batchSave",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "(changes: {\n      toggles?: Array<{ pluginId: string; enabled: boolean }>;\n      configs?: Array<{ pluginId: string; config: Record<string, unknown> }>;\n    }) => Promise<{ ok: boolean; error?: string }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI",
    "target": "post_api_v1_plugins_batch_save",
    "targets": [
      "post_api_v1_plugins_batch_save"
    ]
  },
  {
    "propertyPath": "plugins.detect",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "() => Promise<{ plugins: string[]; error?: string }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI",
    "target": "post_api_v1_plugins_detect",
    "targets": [
      "post_api_v1_plugins_detect"
    ]
  },
  {
    "propertyPath": "plugins.sync",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "() => Promise<{ synced: string[]; error?: string }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI",
    "target": "post_api_v1_plugins_sync",
    "targets": [
      "post_api_v1_plugins_sync"
    ]
  },
  {
    "propertyPath": "plugins.checkUpdates",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "(pluginIds?: string[]) => Promise<{\n      success: boolean;\n      updates?: Array<{\n        pluginId: string;\n        currentVersion: string | null;\n        latestVersion: string | null;\n        hasUpdate: boolean;\n        error?: string;\n      }>;\n      error?: string;\n    }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI",
    "target": "get_api_v1_plugins_updates_check",
    "targets": [
      "get_api_v1_plugins_updates_check"
    ]
  },
  {
    "propertyPath": "plugins.update",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "(pluginId: string) => Promise<{ ok: boolean; version?: string; error?: string }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI",
    "target": "post_api_v1_plugins_id_update",
    "targets": [
      "post_api_v1_plugins_id_update"
    ]
  },
  {
    "propertyPath": "plugins.onInstallLog",
    "transport": "stream",
    "disposition": "ga",
    "optional": false,
    "signature": "(callback: (line: string) => void) => () => void",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI",
    "target": "pluginsInstallLog",
    "targets": [
      "pluginsInstallLog"
    ]
  },
  {
    "propertyPath": "im.getConfig",
    "transport": "unsupported",
    "disposition": "deferred",
    "optional": false,
    "signature": "() => Promise<{ success: boolean; config?: IMGatewayConfig; error?: string }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI",
    "targets": []
  },
  {
    "propertyPath": "im.setConfig",
    "transport": "unsupported",
    "disposition": "deferred",
    "optional": false,
    "signature": "(\n      config: Partial<IMGatewayConfig>,\n      options?: { syncGateway?: boolean; restartGatewayIfRunning?: boolean; markRestartOnSave?: boolean },\n    ) => Promise<{ success: boolean; error?: string }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI",
    "targets": []
  },
  {
    "propertyPath": "im.syncConfig",
    "transport": "unsupported",
    "disposition": "deferred",
    "optional": false,
    "signature": "() => Promise<{ success: boolean; skipped?: boolean; error?: string }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI",
    "targets": []
  },
  {
    "propertyPath": "im.startGateway",
    "transport": "unsupported",
    "disposition": "deferred",
    "optional": false,
    "signature": "(platform: Platform) => Promise<{ success: boolean; error?: string }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI",
    "targets": []
  },
  {
    "propertyPath": "im.stopGateway",
    "transport": "unsupported",
    "disposition": "deferred",
    "optional": false,
    "signature": "(platform: Platform) => Promise<{ success: boolean; error?: string }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI",
    "targets": []
  },
  {
    "propertyPath": "im.testGateway",
    "transport": "unsupported",
    "disposition": "deferred",
    "optional": false,
    "signature": "(\n      platform: Platform,\n      configOverride?: Partial<IMGatewayConfig>,\n    ) => Promise<{ success: boolean; result?: IMConnectivityTestResult; error?: string }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI",
    "targets": []
  },
  {
    "propertyPath": "im.getStatus",
    "transport": "unsupported",
    "disposition": "deferred",
    "optional": false,
    "signature": "() => Promise<{ success: boolean; status?: IMGatewayStatus; error?: string }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI",
    "targets": []
  },
  {
    "propertyPath": "im.getLocalIp",
    "transport": "unsupported",
    "disposition": "deferred",
    "optional": false,
    "signature": "() => Promise<string>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI",
    "targets": []
  },
  {
    "propertyPath": "im.getOpenClawConfigSchema",
    "transport": "unsupported",
    "disposition": "deferred",
    "optional": false,
    "signature": "() => Promise<{\n      success: boolean;\n      result?: {\n        schema: Record<string, unknown>;\n        uiHints: Record<string, Record<string, unknown>>;\n      };\n      error?: string;\n    }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI",
    "targets": []
  },
  {
    "propertyPath": "im.weixinQrLoginStart",
    "transport": "unsupported",
    "disposition": "deferred",
    "optional": false,
    "signature": "() => Promise<{\n      success: boolean;\n      qrDataUrl?: string;\n      message: string;\n      sessionKey?: string;\n    }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI",
    "targets": []
  },
  {
    "propertyPath": "im.weixinQrLoginWait",
    "transport": "unsupported",
    "disposition": "deferred",
    "optional": false,
    "signature": "(sessionKey?: string) => Promise<{\n      success: boolean;\n      connected: boolean;\n      message: string;\n      accountId?: string;\n      alreadyConnected?: boolean;\n    }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI",
    "targets": []
  },
  {
    "propertyPath": "im.popoQrLoginStart",
    "transport": "unsupported",
    "disposition": "deferred",
    "optional": false,
    "signature": "() => Promise<{\n      success: boolean;\n      qrUrl?: string;\n      taskToken?: string;\n      timeoutMs?: number;\n      message?: string;\n    }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI",
    "targets": []
  },
  {
    "propertyPath": "im.popoQrLoginPoll",
    "transport": "unsupported",
    "disposition": "deferred",
    "optional": false,
    "signature": "(taskToken: string) => Promise<{\n      success: boolean;\n      appKey?: string;\n      appSecret?: string;\n      aesKey?: string;\n      message: string;\n    }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI",
    "targets": []
  },
  {
    "propertyPath": "im.addPopoInstance",
    "transport": "unsupported",
    "disposition": "deferred",
    "optional": false,
    "signature": "(\n      name: string,\n    ) => Promise<{\n      success: boolean;\n      instance?: import('./im').PopoInstanceConfig;\n      error?: string;\n    }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI",
    "targets": []
  },
  {
    "propertyPath": "im.deletePopoInstance",
    "transport": "unsupported",
    "disposition": "deferred",
    "optional": false,
    "signature": "(instanceId: string) => Promise<{ success: boolean; error?: string }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI",
    "targets": []
  },
  {
    "propertyPath": "im.setPopoInstanceConfig",
    "transport": "unsupported",
    "disposition": "deferred",
    "optional": false,
    "signature": "(\n      instanceId: string,\n      config: Record<string, unknown>,\n      options?: { syncGateway?: boolean; restartGatewayIfRunning?: boolean; markRestartOnSave?: boolean },\n    ) => Promise<{ success: boolean; error?: string }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI",
    "targets": []
  },
  {
    "propertyPath": "im.listPairingRequests",
    "transport": "unsupported",
    "disposition": "deferred",
    "optional": false,
    "signature": "(platform: string) => Promise<{\n      success: boolean;\n      requests: Array<{\n        id: string;\n        code: string;\n        createdAt: string;\n        lastSeenAt: string;\n        meta?: Record<string, string>;\n      }>;\n      allowFrom: string[];\n      error?: string;\n    }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI",
    "targets": []
  },
  {
    "propertyPath": "im.approvePairingCode",
    "transport": "unsupported",
    "disposition": "deferred",
    "optional": false,
    "signature": "(\n      platform: string,\n      code: string,\n    ) => Promise<{ success: boolean; error?: string }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI",
    "targets": []
  },
  {
    "propertyPath": "im.rejectPairingRequest",
    "transport": "unsupported",
    "disposition": "deferred",
    "optional": false,
    "signature": "(\n      platform: string,\n      code: string,\n    ) => Promise<{ success: boolean; error?: string }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI",
    "targets": []
  },
  {
    "propertyPath": "im.nimQrLoginStart",
    "transport": "unsupported",
    "disposition": "deferred",
    "optional": false,
    "signature": "() => Promise<{\n      uuid: string;\n      qrValue: string;\n      expiresIn: number;\n      pollInterval: number;\n      credentialKind: 'split';\n      rawData: Record<string, unknown> | null;\n    }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI",
    "targets": []
  },
  {
    "propertyPath": "im.nimQrLoginPoll",
    "transport": "unsupported",
    "disposition": "deferred",
    "optional": false,
    "signature": "(uuid: string) => Promise<{\n      status: 'pending' | 'success' | 'failed';\n      credentials?: {\n        appKey: string;\n        account: string;\n        token: string;\n      };\n      errorCode?: string;\n      error?: string;\n    }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI",
    "targets": []
  },
  {
    "propertyPath": "im.addNimInstance",
    "transport": "unsupported",
    "disposition": "deferred",
    "optional": false,
    "signature": "(\n      name: string,\n    ) => Promise<{ success: boolean; instance?: NimInstanceConfig; error?: string }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI",
    "targets": []
  },
  {
    "propertyPath": "im.deleteNimInstance",
    "transport": "unsupported",
    "disposition": "deferred",
    "optional": false,
    "signature": "(instanceId: string) => Promise<{ success: boolean; error?: string }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI",
    "targets": []
  },
  {
    "propertyPath": "im.setNimInstanceConfig",
    "transport": "unsupported",
    "disposition": "deferred",
    "optional": false,
    "signature": "(\n      instanceId: string,\n      config: any,\n      options?: { syncGateway?: boolean; restartGatewayIfRunning?: boolean; markRestartOnSave?: boolean },\n    ) => Promise<{ success: boolean; error?: string }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI",
    "targets": []
  },
  {
    "propertyPath": "im.addQQInstance",
    "transport": "unsupported",
    "disposition": "deferred",
    "optional": false,
    "signature": "(\n      name: string,\n    ) => Promise<{ success: boolean; instance?: QQInstanceConfig; error?: string }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI",
    "targets": []
  },
  {
    "propertyPath": "im.deleteQQInstance",
    "transport": "unsupported",
    "disposition": "deferred",
    "optional": false,
    "signature": "(instanceId: string) => Promise<{ success: boolean; error?: string }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI",
    "targets": []
  },
  {
    "propertyPath": "im.setQQInstanceConfig",
    "transport": "unsupported",
    "disposition": "deferred",
    "optional": false,
    "signature": "(\n      instanceId: string,\n      config: any,\n      options?: { syncGateway?: boolean; restartGatewayIfRunning?: boolean; markRestartOnSave?: boolean },\n    ) => Promise<{ success: boolean; error?: string }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI",
    "targets": []
  },
  {
    "propertyPath": "im.addFeishuInstance",
    "transport": "unsupported",
    "disposition": "deferred",
    "optional": false,
    "signature": "(\n      name: string,\n    ) => Promise<{ success: boolean; instance?: FeishuInstanceConfig; error?: string }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI",
    "targets": []
  },
  {
    "propertyPath": "im.deleteFeishuInstance",
    "transport": "unsupported",
    "disposition": "deferred",
    "optional": false,
    "signature": "(instanceId: string) => Promise<{ success: boolean; error?: string }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI",
    "targets": []
  },
  {
    "propertyPath": "im.setFeishuInstanceConfig",
    "transport": "unsupported",
    "disposition": "deferred",
    "optional": false,
    "signature": "(\n      instanceId: string,\n      config: any,\n      options?: { syncGateway?: boolean; restartGatewayIfRunning?: boolean; markRestartOnSave?: boolean },\n    ) => Promise<{ success: boolean; error?: string }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI",
    "targets": []
  },
  {
    "propertyPath": "im.addDingTalkInstance",
    "transport": "unsupported",
    "disposition": "deferred",
    "optional": false,
    "signature": "(\n      name: string,\n    ) => Promise<{ success: boolean; instance?: DingTalkInstanceConfig; error?: string }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI",
    "targets": []
  },
  {
    "propertyPath": "im.deleteDingTalkInstance",
    "transport": "unsupported",
    "disposition": "deferred",
    "optional": false,
    "signature": "(instanceId: string) => Promise<{ success: boolean; error?: string }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI",
    "targets": []
  },
  {
    "propertyPath": "im.setDingTalkInstanceConfig",
    "transport": "unsupported",
    "disposition": "deferred",
    "optional": false,
    "signature": "(\n      instanceId: string,\n      config: any,\n      options?: { syncGateway?: boolean; restartGatewayIfRunning?: boolean; markRestartOnSave?: boolean },\n    ) => Promise<{ success: boolean; error?: string }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI",
    "targets": []
  },
  {
    "propertyPath": "im.addEmailInstance",
    "transport": "unsupported",
    "disposition": "deferred",
    "optional": false,
    "signature": "(\n      name: string,\n    ) => Promise<{ success: boolean; instance?: EmailInstanceConfig; error?: string }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI",
    "targets": []
  },
  {
    "propertyPath": "im.deleteEmailInstance",
    "transport": "unsupported",
    "disposition": "deferred",
    "optional": false,
    "signature": "(instanceId: string) => Promise<{ success: boolean; error?: string }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI",
    "targets": []
  },
  {
    "propertyPath": "im.setEmailInstanceConfig",
    "transport": "unsupported",
    "disposition": "deferred",
    "optional": false,
    "signature": "(\n      instanceId: string,\n      config: any,\n      options?: { syncGateway?: boolean; restartGatewayIfRunning?: boolean; markRestartOnSave?: boolean },\n    ) => Promise<{ success: boolean; error?: string }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI",
    "targets": []
  },
  {
    "propertyPath": "im.addWecomInstance",
    "transport": "unsupported",
    "disposition": "deferred",
    "optional": false,
    "signature": "(\n      name: string,\n    ) => Promise<{ success: boolean; instance?: WecomInstanceConfig; error?: string }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI",
    "targets": []
  },
  {
    "propertyPath": "im.deleteWecomInstance",
    "transport": "unsupported",
    "disposition": "deferred",
    "optional": false,
    "signature": "(instanceId: string) => Promise<{ success: boolean; error?: string }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI",
    "targets": []
  },
  {
    "propertyPath": "im.setWecomInstanceConfig",
    "transport": "unsupported",
    "disposition": "deferred",
    "optional": false,
    "signature": "(\n      instanceId: string,\n      config: any,\n      options?: { syncGateway?: boolean; restartGatewayIfRunning?: boolean; markRestartOnSave?: boolean },\n    ) => Promise<{ success: boolean; error?: string }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI",
    "targets": []
  },
  {
    "propertyPath": "im.addTelegramInstance",
    "transport": "unsupported",
    "disposition": "deferred",
    "optional": false,
    "signature": "(\n      name: string,\n    ) => Promise<{ success: boolean; instance?: TelegramInstanceConfig; error?: string }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI",
    "targets": []
  },
  {
    "propertyPath": "im.deleteTelegramInstance",
    "transport": "unsupported",
    "disposition": "deferred",
    "optional": false,
    "signature": "(instanceId: string) => Promise<{ success: boolean; error?: string }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI",
    "targets": []
  },
  {
    "propertyPath": "im.setTelegramInstanceConfig",
    "transport": "unsupported",
    "disposition": "deferred",
    "optional": false,
    "signature": "(\n      instanceId: string,\n      config: any,\n      options?: { syncGateway?: boolean; restartGatewayIfRunning?: boolean; markRestartOnSave?: boolean },\n    ) => Promise<{ success: boolean; error?: string }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI",
    "targets": []
  },
  {
    "propertyPath": "im.addDiscordInstance",
    "transport": "unsupported",
    "disposition": "deferred",
    "optional": false,
    "signature": "(\n      name: string,\n    ) => Promise<{ success: boolean; instance?: DiscordInstanceConfig; error?: string }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI",
    "targets": []
  },
  {
    "propertyPath": "im.deleteDiscordInstance",
    "transport": "unsupported",
    "disposition": "deferred",
    "optional": false,
    "signature": "(instanceId: string) => Promise<{ success: boolean; error?: string }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI",
    "targets": []
  },
  {
    "propertyPath": "im.setDiscordInstanceConfig",
    "transport": "unsupported",
    "disposition": "deferred",
    "optional": false,
    "signature": "(\n      instanceId: string,\n      config: any,\n      options?: { syncGateway?: boolean; restartGatewayIfRunning?: boolean; markRestartOnSave?: boolean },\n    ) => Promise<{ success: boolean; error?: string }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI",
    "targets": []
  },
  {
    "propertyPath": "im.onStatusChange",
    "transport": "unsupported",
    "disposition": "deferred",
    "optional": false,
    "signature": "(callback: (status: IMGatewayStatus) => void) => () => void",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI",
    "targets": []
  },
  {
    "propertyPath": "im.onMessageReceived",
    "transport": "unsupported",
    "disposition": "deferred",
    "optional": false,
    "signature": "(callback: (message: IMMessage) => void) => () => void",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI",
    "targets": []
  },
  {
    "propertyPath": "scheduledTasks.list",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "() => Promise<{\n      success: boolean;\n      ready?: boolean;\n      tasks?: import('../../scheduledTask/types').ScheduledTask[];\n      error?: string;\n    }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI",
    "target": "get_api_v1_scheduled_tasks",
    "targets": [
      "get_api_v1_scheduled_tasks"
    ]
  },
  {
    "propertyPath": "scheduledTasks.get",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "(id: string) => Promise<{\n      success: boolean;\n      task?: import('../../scheduledTask/types').ScheduledTask;\n      error?: string;\n    }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI",
    "target": "get_api_v1_scheduled_tasks_id",
    "targets": [
      "get_api_v1_scheduled_tasks_id"
    ]
  },
  {
    "propertyPath": "scheduledTasks.create",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "(input: import('../../scheduledTask/types').ScheduledTaskInput) => Promise<{\n      success: boolean;\n      task?: import('../../scheduledTask/types').ScheduledTask;\n      error?: string;\n    }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI",
    "target": "post_api_v1_scheduled_tasks",
    "targets": [
      "post_api_v1_scheduled_tasks"
    ]
  },
  {
    "propertyPath": "scheduledTasks.update",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "(\n      id: string,\n      input: Partial<import('../../scheduledTask/types').ScheduledTaskInput>,\n    ) => Promise<{\n      success: boolean;\n      task?: import('../../scheduledTask/types').ScheduledTask;\n      error?: string;\n    }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI",
    "target": "patch_api_v1_scheduled_tasks_id",
    "targets": [
      "patch_api_v1_scheduled_tasks_id"
    ]
  },
  {
    "propertyPath": "scheduledTasks.delete",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "(id: string) => Promise<{ success: boolean; error?: string }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI",
    "target": "delete_api_v1_scheduled_tasks_id",
    "targets": [
      "delete_api_v1_scheduled_tasks_id"
    ]
  },
  {
    "propertyPath": "scheduledTasks.toggle",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "(\n      id: string,\n      enabled: boolean,\n    ) => Promise<{\n      success: boolean;\n      task?: import('../../scheduledTask/types').ScheduledTask;\n      warning?: string;\n      error?: string;\n    }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI",
    "target": "patch_api_v1_scheduled_tasks_id",
    "targets": [
      "patch_api_v1_scheduled_tasks_id"
    ]
  },
  {
    "propertyPath": "scheduledTasks.runManually",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "(id: string) => Promise<{ success: boolean; error?: string }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI",
    "target": "post_api_v1_scheduled_tasks_id_runs",
    "targets": [
      "post_api_v1_scheduled_tasks_id_runs"
    ]
  },
  {
    "propertyPath": "scheduledTasks.stop",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "(id: string) => Promise<{ success: boolean; error?: string }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI",
    "target": "post_api_v1_scheduled_tasks_id_stop",
    "targets": [
      "post_api_v1_scheduled_tasks_id_stop"
    ]
  },
  {
    "propertyPath": "scheduledTasks.listRuns",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "(\n      taskId: string,\n      limit?: number,\n      offset?: number,\n      filter?: import('../../scheduledTask/types').RunFilter,\n    ) => Promise<{\n      success: boolean;\n      runs?: import('../../scheduledTask/types').ScheduledTaskRun[];\n      error?: string;\n    }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI",
    "target": "get_api_v1_scheduled_tasks_id_runs",
    "targets": [
      "get_api_v1_scheduled_tasks_id_runs"
    ]
  },
  {
    "propertyPath": "scheduledTasks.countRuns",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "(taskId: string) => Promise<{ success: boolean; count?: number; error?: string }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI",
    "target": "get_api_v1_scheduled_tasks_id_runs_count",
    "targets": [
      "get_api_v1_scheduled_tasks_id_runs_count"
    ]
  },
  {
    "propertyPath": "scheduledTasks.listAllRuns",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "(\n      limit?: number,\n      offset?: number,\n      filter?: import('../../scheduledTask/types').RunFilter,\n    ) => Promise<{\n      success: boolean;\n      ready?: boolean;\n      runs?: import('../../scheduledTask/types').ScheduledTaskRunWithName[];\n      error?: string;\n    }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI",
    "target": "get_api_v1_scheduled_tasks_runs",
    "targets": [
      "get_api_v1_scheduled_tasks_runs"
    ]
  },
  {
    "propertyPath": "scheduledTasks.resolveSession",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "(\n      input: string | { sessionId?: string | null; sessionKey?: string | null },\n    ) => Promise<{\n      success: boolean;\n      session?: import('./cowork').CoworkSession | null;\n      error?: string;\n    }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI",
    "target": "get_api_v1_scheduled_tasks_runs_runId_session",
    "targets": [
      "get_api_v1_scheduled_tasks_runs_runId_session"
    ]
  },
  {
    "propertyPath": "scheduledTasks.listChannels",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "() => Promise<{\n      success: boolean;\n      channels?: import('../../scheduledTask/types').ScheduledTaskChannelOption[];\n      error?: string;\n    }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI",
    "target": "get_api_v1_scheduled_tasks_channels",
    "targets": [
      "get_api_v1_scheduled_tasks_channels"
    ]
  },
  {
    "propertyPath": "scheduledTasks.listChannelConversations",
    "transport": "rest",
    "disposition": "ga",
    "optional": true,
    "signature": "(\n      channel: string,\n      accountId?: string,\n      filterAccountId?: string,\n    ) => Promise<{\n      success: boolean;\n      conversations?: import('../../scheduledTask/types').ScheduledTaskConversationOption[];\n      error?: string;\n    }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI",
    "target": "get_api_v1_scheduled_tasks_channels_ch_conversations",
    "targets": [
      "get_api_v1_scheduled_tasks_channels_ch_conversations"
    ]
  },
  {
    "propertyPath": "scheduledTasks.onStatusUpdate",
    "transport": "stream",
    "disposition": "ga",
    "optional": false,
    "signature": "(\n      callback: (data: import('../../scheduledTask/types').ScheduledTaskStatusEvent) => void,\n    ) => () => void",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI",
    "target": "taskStatus",
    "targets": [
      "taskStatus"
    ]
  },
  {
    "propertyPath": "scheduledTasks.onRunUpdate",
    "transport": "stream",
    "disposition": "ga",
    "optional": false,
    "signature": "(\n      callback: (data: import('../../scheduledTask/types').ScheduledTaskRunEvent) => void,\n    ) => () => void",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI",
    "target": "taskRun",
    "targets": [
      "taskRun"
    ]
  },
  {
    "propertyPath": "scheduledTasks.onRefresh",
    "transport": "stream",
    "disposition": "ga",
    "optional": false,
    "signature": "(callback: () => void) => () => void",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI",
    "target": "taskRefresh",
    "targets": [
      "taskRefresh"
    ]
  },
  {
    "propertyPath": "permissions.checkCalendar",
    "transport": "rest",
    "disposition": "deferred",
    "optional": false,
    "signature": "() => Promise<{\n      success: boolean;\n      status?: string;\n      error?: string;\n      autoRequested?: boolean;\n    }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI",
    "targets": []
  },
  {
    "propertyPath": "permissions.requestCalendar",
    "transport": "rest",
    "disposition": "deferred",
    "optional": false,
    "signature": "() => Promise<{\n      success: boolean;\n      granted?: boolean;\n      status?: string;\n      error?: string;\n    }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI",
    "targets": []
  },
  {
    "propertyPath": "auth.login",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "(loginUrl?: string) => Promise<{ success: boolean; error?: string }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI",
    "target": "post_auth_login",
    "targets": [
      "post_auth_login",
      "post_oauth_authorize"
    ]
  },
  {
    "propertyPath": "auth.exchange",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "(\n      code: string,\n    ) => Promise<{ success: boolean; user?: any; quota?: any; error?: string }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI",
    "target": "post_oauth_token",
    "targets": [
      "post_oauth_token"
    ]
  },
  {
    "propertyPath": "auth.getUser",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "() => Promise<{ success: boolean; user?: any; quota?: any }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI",
    "target": "get_auth_me",
    "targets": [
      "get_auth_me"
    ]
  },
  {
    "propertyPath": "auth.getQuota",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "() => Promise<{ success: boolean; quota?: any }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI",
    "target": "get_api_v1_billing_account",
    "targets": [
      "get_api_v1_billing_account"
    ]
  },
  {
    "propertyPath": "auth.logout",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "() => Promise<{ success: boolean }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI",
    "target": "post_auth_logout",
    "targets": [
      "post_auth_logout"
    ]
  },
  {
    "propertyPath": "auth.refreshToken",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "() => Promise<{ success: boolean; accessToken?: string }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI",
    "target": "post_auth_refresh",
    "targets": [
      "post_auth_refresh"
    ]
  },
  {
    "propertyPath": "auth.getAccessToken",
    "transport": "rest",
    "disposition": "deferred",
    "optional": false,
    "signature": "() => Promise<string | null>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI",
    "targets": []
  },
  {
    "propertyPath": "auth.getModels",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "() => Promise<{\n      success: boolean;\n      models?: Array<{\n        modelId: string;\n        modelName: string;\n        provider: string;\n        apiFormat: string;\n        supportsImage?: boolean;\n        supportsThinking?: boolean;\n        contextWindow?: number;\n        explicitContextCache?: boolean;\n        costMultiplier?: number;\n        description?: string;\n        accessible?: boolean;\n        restrictionHint?: string;\n      }>;\n    }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI",
    "target": "get_api_v1_models",
    "targets": [
      "get_api_v1_models"
    ]
  },
  {
    "propertyPath": "auth.getPricingCatalog",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "() => Promise<{\n      success: boolean;\n      textModels?: Array<{\n        modelId: string;\n        modelName: string;\n        provider?: string;\n        providerLabel?: string;\n        description?: string;\n        supportsImage?: boolean;\n        supportsThinking?: boolean;\n        contextWindow?: number | null;\n        costMultiplier?: number;\n      }>;\n      error?: string;\n    }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI",
    "target": "get_api_v1_pricing_models",
    "targets": [
      "get_api_v1_pricing_models"
    ]
  },
  {
    "propertyPath": "auth.getProfileSummary",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "() => Promise<{ success: boolean; data?: ProfileSummaryData }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI",
    "target": "get_auth_profile_summary",
    "targets": [
      "get_auth_profile_summary"
    ]
  },
  {
    "propertyPath": "auth.getActiveClientBanner",
    "transport": "rest",
    "disposition": "deferred",
    "optional": false,
    "signature": "() => Promise<{ success: boolean; data?: ClientBannerData | null }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI",
    "targets": []
  },
  {
    "propertyPath": "auth.getActiveClientBanners",
    "transport": "rest",
    "disposition": "deferred",
    "optional": false,
    "signature": "() => Promise<{ success: boolean; data?: ClientBannerData[] }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI",
    "targets": []
  },
  {
    "propertyPath": "auth.getPendingCallback",
    "transport": "rest",
    "disposition": "deferred",
    "optional": false,
    "signature": "() => Promise<string | null>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI",
    "targets": []
  },
  {
    "propertyPath": "auth.onCallback",
    "transport": "stream",
    "disposition": "ga",
    "optional": false,
    "signature": "(callback: (data: { code: string }) => void) => () => void",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI",
    "target": "authCallback",
    "targets": [
      "authCallback"
    ]
  },
  {
    "propertyPath": "auth.onQuotaChanged",
    "transport": "stream",
    "disposition": "ga",
    "optional": false,
    "signature": "(callback: () => void) => () => void",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI",
    "target": "quotaChanged",
    "targets": [
      "quotaChanged"
    ]
  },
  {
    "propertyPath": "media.getModels",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "(type: 'image' | 'video') => Promise<{ success: boolean; models?: Array<{ modelId: string; displayName: string; provider: string; mediaType: string; generationTimeout: number; pricing: Record<string, unknown> }>; error?: string }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI",
    "target": "get_api_v1_models",
    "targets": [
      "get_api_v1_models"
    ]
  },
  {
    "propertyPath": "media.getTaskStatus",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "(taskId: number, type: 'image' | 'video') => Promise<{ success: boolean; task?: Record<string, unknown>; error?: string }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI",
    "target": "get_api_v1_media_tasks_taskId",
    "targets": [
      "get_api_v1_media_tasks_taskId"
    ]
  },
  {
    "propertyPath": "enterprise.getConfig",
    "transport": "rest",
    "disposition": "ga",
    "optional": false,
    "signature": "() => Promise<{\n      ui?: Record<string, 'hide' | 'disable' | 'readonly'>;\n      disableUpdate?: boolean;\n      version: string;\n      name: string;\n    } | null>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI",
    "target": "get_api_v1_config_enterprise",
    "targets": [
      "get_api_v1_config_enterprise"
    ]
  },
  {
    "propertyPath": "networkStatus.send",
    "transport": "rest",
    "disposition": "deferred",
    "optional": false,
    "signature": "(status: 'online' | 'offline') => void",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI",
    "targets": []
  },
  {
    "propertyPath": "qwen",
    "transport": "rest",
    "disposition": "deferred",
    "optional": true,
    "signature": "Record<string, never>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI",
    "targets": []
  },
  {
    "propertyPath": "feishu.install.qrcode",
    "transport": "rest",
    "disposition": "deferred",
    "optional": false,
    "signature": "(isLark: boolean) => Promise<{\n        url: string;\n        deviceCode: string;\n        interval: number;\n        expireIn: number;\n      }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI",
    "targets": []
  },
  {
    "propertyPath": "feishu.install.poll",
    "transport": "rest",
    "disposition": "deferred",
    "optional": false,
    "signature": "(deviceCode: string) => Promise<{\n        done: boolean;\n        appId?: string;\n        appSecret?: string;\n        domain?: string;\n        error?: string;\n      }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI",
    "targets": []
  },
  {
    "propertyPath": "feishu.install.verify",
    "transport": "rest",
    "disposition": "deferred",
    "optional": false,
    "signature": "(\n        appId: string,\n        appSecret: string,\n      ) => Promise<{\n        success: boolean;\n        error?: string;\n      }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI",
    "targets": []
  },
  {
    "propertyPath": "dingtalk.install.qrcode",
    "transport": "rest",
    "disposition": "deferred",
    "optional": false,
    "signature": "() => Promise<{\n        url: string;\n        deviceCode: string;\n        interval: number;\n        expireIn: number;\n      }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI",
    "targets": []
  },
  {
    "propertyPath": "dingtalk.install.poll",
    "transport": "rest",
    "disposition": "deferred",
    "optional": false,
    "signature": "(deviceCode: string) => Promise<{\n        done: boolean;\n        clientId?: string;\n        clientSecret?: string;\n        error?: string;\n      }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI",
    "targets": []
  },
  {
    "propertyPath": "dingtalk.install.verify",
    "transport": "rest",
    "disposition": "deferred",
    "optional": false,
    "signature": "(\n        clientId: string,\n        clientSecret: string,\n      ) => Promise<{\n        success: boolean;\n        error?: string;\n      }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI",
    "targets": []
  },
  {
    "propertyPath": "githubCopilot.requestDeviceCode",
    "transport": "unsupported",
    "disposition": "deferred",
    "optional": false,
    "signature": "() => Promise<{\n      userCode: string;\n      verificationUri: string;\n      deviceCode: string;\n      interval: number;\n      expiresIn: number;\n    }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI",
    "targets": []
  },
  {
    "propertyPath": "githubCopilot.pollForToken",
    "transport": "unsupported",
    "disposition": "deferred",
    "optional": false,
    "signature": "(\n      deviceCode: string,\n      interval: number,\n      expiresIn: number,\n    ) => Promise<{\n      success: boolean;\n      token?: string;\n      githubUser?: string;\n      baseUrl?: string;\n      error?: string;\n    }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI",
    "targets": []
  },
  {
    "propertyPath": "githubCopilot.cancelPolling",
    "transport": "unsupported",
    "disposition": "deferred",
    "optional": false,
    "signature": "() => Promise<void>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI",
    "targets": []
  },
  {
    "propertyPath": "githubCopilot.signOut",
    "transport": "unsupported",
    "disposition": "deferred",
    "optional": false,
    "signature": "() => Promise<void>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI",
    "targets": []
  },
  {
    "propertyPath": "githubCopilot.refreshToken",
    "transport": "unsupported",
    "disposition": "deferred",
    "optional": false,
    "signature": "() => Promise<{\n      success: boolean;\n      token?: string;\n      baseUrl?: string;\n      error?: string;\n    }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI",
    "targets": []
  },
  {
    "propertyPath": "githubCopilot.onTokenUpdated",
    "transport": "unsupported",
    "disposition": "deferred",
    "optional": false,
    "signature": "(callback: (data: { token: string; baseUrl: string }) => void) => () => void",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI",
    "targets": []
  },
  {
    "propertyPath": "openaiCodexOAuth.start",
    "transport": "unsupported",
    "disposition": "deferred",
    "optional": false,
    "signature": "() => Promise<\n      | { success: true; email: string | null; accountId: string | null; expiresAt: number }\n      | { success: false; error: string }\n    >",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI",
    "targets": []
  },
  {
    "propertyPath": "openaiCodexOAuth.cancel",
    "transport": "unsupported",
    "disposition": "deferred",
    "optional": false,
    "signature": "() => Promise<void>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI",
    "targets": []
  },
  {
    "propertyPath": "openaiCodexOAuth.logout",
    "transport": "unsupported",
    "disposition": "deferred",
    "optional": false,
    "signature": "() => Promise<void>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI",
    "targets": []
  },
  {
    "propertyPath": "openaiCodexOAuth.status",
    "transport": "unsupported",
    "disposition": "deferred",
    "optional": false,
    "signature": "() => Promise<\n      | { loggedIn: true; email: string | null; accountId: string | null; expiresAt: number }\n      | { loggedIn: false }\n    >",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI",
    "targets": []
  },
  {
    "propertyPath": "xaiOAuth.start",
    "transport": "rest",
    "disposition": "deferred",
    "optional": false,
    "signature": "() => Promise<\n      | { success: true; email: string | null; flow: 'browser' | 'device-code' }\n      | { success: false; error: string }\n    >",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI",
    "targets": []
  },
  {
    "propertyPath": "xaiOAuth.cancel",
    "transport": "rest",
    "disposition": "deferred",
    "optional": false,
    "signature": "() => Promise<void>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI",
    "targets": []
  },
  {
    "propertyPath": "xaiOAuth.logout",
    "transport": "rest",
    "disposition": "deferred",
    "optional": false,
    "signature": "() => Promise<void>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI",
    "targets": []
  },
  {
    "propertyPath": "xaiOAuth.status",
    "transport": "rest",
    "disposition": "deferred",
    "optional": false,
    "signature": "() => Promise<{\n      loggedIn: boolean;\n      email?: string;\n      displayName?: string;\n      expiresAt?: number;\n    }>",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI",
    "targets": []
  },
  {
    "propertyPath": "xaiOAuth.onDeviceCode",
    "transport": "stream",
    "disposition": "deferred",
    "optional": false,
    "signature": "(\n      callback: (info: {\n        userCode: string;\n        verificationUri: string;\n        verificationUriComplete?: string;\n        expiresInMs: number;\n      }) => void,\n    ) => () => void",
    "sourceRef": "src/renderer/types/electron.d.ts:IElectronAPI",
    "targets": []
  }
] as const;
