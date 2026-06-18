'use strict';

const fs = require('fs');
const path = require('path');

function patchMessageHandler(dingtalkMsgHandlerPath, log) {
  if (!fs.existsSync(dingtalkMsgHandlerPath)) {
    log('dingtalk-connector not found, skipping file:// URL patch');
    return;
  }

  let dtSrc = fs.readFileSync(dingtalkMsgHandlerPath, 'utf8');
  const brokenPattern = "imageLocalPaths.map(p => `![image](file://${p})`)";
  if (dtSrc.includes(brokenPattern)) {
    dtSrc = dtSrc.replace(
      brokenPattern,
      "imageLocalPaths.map(p => { if (process.platform !== 'win32') return `![image](file://${p})`; const n = p.replace(/\\\\/g, '/'); return `![image](file:///${n})`; })"
    );
    fs.writeFileSync(dingtalkMsgHandlerPath, dtSrc);
    log('Patched dingtalk-connector/message-handler.ts: fixed file:// URL format for Windows');
  } else {
    log('dingtalk-connector/message-handler.ts: file:// pattern not found or already patched, skipping');
  }

  const exactAccountPattern = 'if (match.accountId && match.accountId !== accountId) continue;';
  const wildcardAccountPattern = 'if (match.accountId && match.accountId !== "*" && match.accountId !== accountId) continue;';
  if (dtSrc.includes(exactAccountPattern)) {
    dtSrc = dtSrc.replaceAll(exactAccountPattern, wildcardAccountPattern);
    fs.writeFileSync(dingtalkMsgHandlerPath, dtSrc);
    log('Patched dingtalk-connector/message-handler.ts: accountId wildcard bindings now match all accounts');
  } else if (dtSrc.includes(wildcardAccountPattern)) {
    log('dingtalk-connector/message-handler.ts account wildcard patch already applied, skipping');
  } else {
    log('dingtalk-connector/message-handler.ts: account binding pattern not found, skipping wildcard patch');
  }
}

function patchDingtalkAgentWorkspaceResolver(resolverPath, label, log) {
  if (!fs.existsSync(resolverPath)) {
    return;
  }

  let src = fs.readFileSync(resolverPath, 'utf8');
  const workspacePatchMarker = 'dingtalk_agent_workspace_defaults_patch';
  if (src.includes(workspacePatchMarker)) {
    log(`${label} workspace resolver patch already applied, skipping`);
    return;
  }

  const replacementJs = `function resolveAgentWorkspaceDir(cfg, agentId) {
  const expandWorkspacePath = (workspace) => /* ${workspacePatchMarker} */ workspace.startsWith("~") ? path.join(os.homedir(), workspace.slice(1)) : workspace;
  const agentConfig = cfg.agents?.list?.find((a) => a.id === agentId);
  const configuredWorkspace = agentConfig?.workspace?.trim();
  if (configuredWorkspace) {
    return expandWorkspacePath(configuredWorkspace);
  }
  const defaultAgentId = cfg.defaultAgent || cfg.agents?.list?.find((a) => a?.default === true)?.id || "main";
  const fallbackWorkspace = cfg.agents?.defaults?.workspace?.trim();
  if (agentId === "main" || agentId === defaultAgentId) {
    if (fallbackWorkspace) {
      return expandWorkspacePath(fallbackWorkspace);
    }
    return path.join(os.homedir(), ".openclaw", "workspace");
  }
  if (fallbackWorkspace) {
    return path.join(expandWorkspacePath(fallbackWorkspace), agentId);
  }
  return path.join(os.homedir(), ".openclaw", \`workspace-\${agentId}\`);
}`;

  const replacementTs = `export function resolveAgentWorkspaceDir(
  cfg: ClawdbotConfig,
  agentId: string,
): string {
  const expandWorkspacePath = (workspace: string): string => (
    /* ${workspacePatchMarker} */ workspace.startsWith('~')
      ? path.join(os.homedir(), workspace.slice(1))
      : workspace
  );

  const agentConfig = cfg.agents?.list?.find((a: any) => a.id === agentId);
  const configuredWorkspace = agentConfig?.workspace?.trim();
  if (configuredWorkspace) {
    return expandWorkspacePath(configuredWorkspace);
  }

  const defaultAgentId =
    cfg.defaultAgent ||
    cfg.agents?.list?.find((a: any) => a?.default === true)?.id ||
    'main';
  const fallbackWorkspace = cfg.agents?.defaults?.workspace?.trim();

  if (agentId === 'main' || agentId === defaultAgentId) {
    if (fallbackWorkspace) {
      return expandWorkspacePath(fallbackWorkspace);
    }
    return path.join(os.homedir(), '.openclaw', 'workspace');
  }

  if (fallbackWorkspace) {
    return path.join(expandWorkspacePath(fallbackWorkspace), agentId);
  }

  return path.join(os.homedir(), '.openclaw', \`workspace-\${agentId}\`);
}`;

  if (label.endsWith('index.js')) {
    const pattern = /function resolveAgentWorkspaceDir\(cfg, agentId\) \{[\s\S]*?return path\.join\(os\.homedir\(\), "\.openclaw", `workspace-\$\{agentId\}`\);\r?\n\}/;
    if (pattern.test(src)) {
      src = src.replace(pattern, replacementJs);
      fs.writeFileSync(resolverPath, src);
      log(`Patched ${label}: agent workspace resolver now reads agents.defaults.workspace`);
    } else {
      log(`${label}: workspace resolver pattern not found, skipping patch`);
    }
    return;
  }

  const pattern = /export function resolveAgentWorkspaceDir\(\s*cfg: ClawdbotConfig,\s*agentId: string,\s*\): string \{[\s\S]*?return path\.join\(os\.homedir\(\), '\.openclaw', `workspace-\$\{agentId\}`\);\s*\}/;
  if (pattern.test(src)) {
    src = src.replace(pattern, replacementTs);
    fs.writeFileSync(resolverPath, src);
    log(`Patched ${label}: agent workspace resolver now reads agents.defaults.workspace`);
  } else {
    log(`${label}: workspace resolver pattern not found, skipping patch`);
  }
}

function patchDingtalk({ runtimeExtensionsDir, log }) {
  patchMessageHandler(
    path.join(runtimeExtensionsDir, 'dingtalk-connector', 'src', 'core', 'message-handler.ts'),
    log
  );

  patchDingtalkAgentWorkspaceResolver(
    path.join(runtimeExtensionsDir, 'dingtalk-connector', 'index.js'),
    'dingtalk-connector/index.js',
    log
  );
  patchDingtalkAgentWorkspaceResolver(
    path.join(runtimeExtensionsDir, 'dingtalk-connector', 'src', 'utils', 'agent.ts'),
    'dingtalk-connector/src/utils/agent.ts',
    log
  );
}

module.exports = {
  patchDingtalk,
};
