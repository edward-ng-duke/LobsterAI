# Qwen Coding Plan Provider ID 修复 Spec

## 1. 背景

用户在设置里启用 Qwen Coding Plan 后，`qwen3.5-plus` 可以正常工作，`qwen3.6-plus` 报错：

```text
Agent failed before reply: Unknown model: qwen/qwen3.6-plus
```

从现场日志看，LobsterAI 已经把 Qwen Coding Plan 的 baseURL 写成了阿里 Coding Plan 端点：

```text
baseUrl: https://coding.dashscope.aliyuncs.com/v1
api: openai-completions
models: qwen3.6-plus, qwen3.5-plus
primaryModel: qwen-portal/qwen3.6-plus
```

但 OpenClaw gateway 启动后仍按 `qwen/qwen3.6-plus` 解析模型，并在 warmup 和正式会话中报 `Unknown model`。这说明问题不是 Settings 没有把 Coding Plan 开关传下去，而是 OpenClaw runtime 侧进入了普通 Qwen provider 路径。

阿里云 OpenClaw Coding Plan 文档中的 provider 不是 `qwen` 或 `qwen-portal`，而是：

```json
{
  "agents": {
    "defaults": {
      "model": {
        "primary": "bailian-coding-plan/qwen3.6-plus"
      }
    }
  },
  "models": {
    "providers": {
      "bailian-coding-plan": {
        "baseUrl": "https://coding.dashscope.aliyuncs.com/v1"
      }
    }
  }
}
```

因此 `qwen/qwen3.6-plus` 与 `bailian-coding-plan/qwen3.6-plus` 不是等价配置。

## 2. 关键判断

上一版“只在 `providerName === qwen && codingPlanEnabled` 时改 provider id”的方案不够完整。

它可以覆盖内置 Qwen provider 的 Coding Plan 开关，但不能覆盖这个场景：

1. 用户添加 `custom_0`
2. `custom_0.baseUrl = https://coding.dashscope.aliyuncs.com/v1`
3. `custom_0.models = [{ id: 'qwen3.6-plus' }]`

当前逻辑会把模型引用写成 `custom_0/qwen3.6-plus`，不会自动进入官方文档的 `bailian-coding-plan/qwen3.6-plus` 路径。为了让自定义模型也适配，需要按“有效 baseURL”识别阿里 Coding Plan，而不能只看 providerName。

## 3. 根因

### 3.1 LobsterAI 写出的 provider id 不符合 Coding Plan 文档

当前 LobsterAI 的 provider 映射为：

| 场景 | 当前 OpenClaw provider id |
|---|---|
| Qwen 标准端点 | `qwen-portal` |
| Qwen Coding Plan | `qwen-portal` |
| 自定义 provider + 阿里 Coding Plan baseURL | `custom_N` |

但阿里 Coding Plan 文档要求：

| 场景 | 应使用的 OpenClaw provider id |
|---|---|
| 阿里 Coding Plan endpoint | `bailian-coding-plan` |

### 3.2 OpenClaw v2026.4.14 的普通 Qwen provider 会过滤 Coding Plan 下的 qwen3.6-plus

当前 bundled OpenClaw runtime 的 Qwen extension 中存在如下行为：

```text
coding.dashscope.aliyuncs.com endpoint:
  qwen3.5-plus advertised
  qwen3.6-plus suppressed
```

这与现场现象一致：`qwen3.5-plus` 可以工作，`qwen3.6-plus` 在普通 Qwen provider 路径下被判定为 unknown model。

所以修复不能继续把 Coding Plan 走 `qwen` / `qwen-portal` provider 路径。需要让它走 `bailian-coding-plan`，或升级/补丁 OpenClaw runtime 让该 provider id 可用。

## 4. 目标行为

| 输入配置 | OpenClaw config 期望 |
|---|---|
| 内置 Qwen，Coding Plan 关闭，`qwen3.6-plus` | `qwen-portal/qwen3.6-plus` |
| 内置 Qwen，Coding Plan 开启，`qwen3.6-plus` | `bailian-coding-plan/qwen3.6-plus` |
| 内置 Qwen，Coding Plan 开启，`qwen3.5-plus` | `bailian-coding-plan/qwen3.5-plus` |
| 自定义 provider，baseURL 是 `https://coding.dashscope.aliyuncs.com/v1`，`qwen3.6-plus` | `bailian-coding-plan/qwen3.6-plus` |
| 自定义 provider，baseURL 是 `https://coding-intl.dashscope.aliyuncs.com/v1`，`qwen3.6-plus` | `bailian-coding-plan/qwen3.6-plus` |
| 自定义 provider，普通 OpenAI-compatible baseURL，`qwen3.6-plus` | `custom_N/qwen3.6-plus` |

## 5. 设计原则

1. **按有效 endpoint 识别 Coding Plan。** 内置 Qwen 开关、自定义 baseURL、导入配置都最终归一到同一判断函数。
2. **provider id 和展示 provider 分离。** UI 里仍显示用户配置的 provider 名称，例如 `Qwen` 或 `Custom0`；写给 OpenClaw 的 runtime provider id 可以是 `bailian-coding-plan`。
3. **不破坏标准 Qwen。** `dashscope.aliyuncs.com/compatible-mode/v1` 仍使用 `qwen-portal`。
4. **不静默吞掉多凭证冲突。** 多个启用 provider 同时映射到 `bailian-coding-plan` 且 API key/baseURL 不一致时，不能用第一个配置悄悄覆盖另一个。
5. **OpenClaw runtime 必须支持该 provider id。** 如果 bundled runtime 没有 `bailian-coding-plan` provider，LobsterAI 仅改配置生成仍不完整。

## 6. 详细方案

### 6.1 新增 provider id 常量

修改 `src/shared/providers/constants.ts`：

```typescript
export const OpenClawProviderId = {
  // ...
  Qwen: 'qwen-portal',
  BailianCodingPlan: 'bailian-coding-plan',
  // ...
} as const;
```

### 6.2 提取阿里 Coding Plan endpoint 判断

在 shared provider 模块中提供一个 main/renderer 共用函数：

```typescript
export function isAliyunCodingPlanBaseUrl(baseUrl?: string): boolean {
  if (!baseUrl?.trim()) return false;
  try {
    const url = new URL(baseUrl);
    const hostname = url.hostname.toLowerCase();
    return hostname === 'coding.dashscope.aliyuncs.com'
      || hostname === 'coding-intl.dashscope.aliyuncs.com';
  } catch {
    return false;
  }
}
```

调用方必须传“有效 baseURL”，也就是已经经过 `resolveCodingPlanBaseUrl()` 和 apiFormat 切换后的 URL。

### 6.3 Main 进程 provider selection

修改 `src/main/libs/openclawConfigSync.ts`：

1. `buildProviderSelection()` 先计算 effective baseURL。
2. `resolveDescriptor()` 接收 effective baseURL。
3. 如果 `isAliyunCodingPlanBaseUrl(effectiveBaseURL)` 为 true，返回 `bailian-coding-plan` descriptor。
4. 该逻辑不限制 `providerName === qwen`，因此自定义 provider 也能命中。

伪代码：

```typescript
const baseDescriptor = resolveDescriptor({
  providerName,
  codingPlanEnabled: !!options.codingPlanEnabled,
  authType: options.authType,
});
const effectiveBaseUrl = baseDescriptor.resolveRuntimeBaseUrl?.()
  ?? baseDescriptor.normalizeBaseUrl(options.baseURL);

const descriptor = resolveDescriptor({
  providerName,
  codingPlanEnabled: !!options.codingPlanEnabled,
  authType: options.authType,
  effectiveBaseUrl,
});
```

`bailian-coding-plan` descriptor：

```typescript
{
  providerId: OpenClawProviderId.BailianCodingPlan,
  resolveApi: () => OpenClawApi.OpenAICompletions,
  normalizeBaseUrl: stripChatCompletionsSuffix,
}
```

API key env var 仍按原始 providerName 生成：

| 原始 provider | provider id | apiKey placeholder |
|---|---|---|
| `qwen` | `bailian-coding-plan` | `${LOBSTER_APIKEY_QWEN}` |
| `custom_0` | `bailian-coding-plan` | `${LOBSTER_APIKEY_CUSTOM_0}` |

这样自定义 provider 不需要把密钥复制到 Qwen 内置配置。

### 6.4 Renderer 模型引用生成

修改这些位置的 `getOpenClawProviderIdForConfig()`：

- `src/renderer/App.tsx`
- `src/renderer/components/settings/modelProviderUtils.ts`

函数签名需要能看到 providerConfig.baseUrl 和 codingPlanEnabled。逻辑：

```typescript
export const getOpenClawProviderIdForConfig = (
  providerName: string,
  providerConfig: ProviderConfig,
): string => {
  if (providerName === ProviderName.OpenAI && providerConfig.authType === 'oauth') {
    return OpenClawProviderId.OpenAICodex;
  }

  const effectiveBaseUrl = resolveEffectiveProviderBaseUrl(providerName, providerConfig);
  if (isAliyunCodingPlanBaseUrl(effectiveBaseUrl)) {
    return OpenClawProviderId.BailianCodingPlan;
  }

  return ProviderRegistry.getOpenClawProviderId(providerName);
};
```

否则 UI 创建 session 时仍会把 `modelOverride` patch 成 `qwen-portal/qwen3.6-plus` 或 `custom_0/qwen3.6-plus`，main 进程配置即使写对也会被 session override 盖掉。

### 6.5 Provider 合并冲突处理

`openclaw.json.models.providers` 以 provider id 为 key。多个 LobsterAI provider 同时映射到 `bailian-coding-plan` 时，会发生合并。

必须补一个冲突检测：

```text
same providerId:
  baseUrl/api/auth/apiKey placeholder 完全一致 -> 合并 models
  任一字段不同 -> 标记冲突，不静默覆盖
```

MVP 行为建议：

1. 如果冲突 provider 中包含当前默认模型所在 provider，优先写当前默认 provider 的凭证，并在日志 warn。
2. 其余 provider 的模型不要合并到该 provider，以免用错误密钥调用。
3. 后续 UI 可提示“多个阿里 Coding Plan provider 使用不同密钥，OpenClaw 只能启用其中一个”。

更完整的长期方案是 OpenClaw 支持 provider instance alias，例如 `bailian-coding-plan:custom_0`，但当前 provider map 结构不支持无损表达。

### 6.6 OpenClaw runtime 兼容要求

LobsterAI bundled runtime 必须满足至少一个条件：

1. 升级到已经支持 `bailian-coding-plan` provider 的 OpenClaw 版本。
2. 或在 `scripts/patches/v2026.4.14/` 增加 runtime patch：
   - 添加 `bailian-coding-plan` provider id
   - catalog 中包含 `qwen3.6-plus`
   - 不把 `bailian-coding-plan` normalize 到 `qwen`
   - 普通 Qwen provider 的 Coding Plan suppression 不作用到 `bailian-coding-plan`

如果只改 LobsterAI，不补 runtime，gateway 可能会从 `Unknown model: qwen/qwen3.6-plus` 变成 `Unknown model: bailian-coding-plan/qwen3.6-plus`。

## 7. 测试计划

### 7.1 LobsterAI 单元测试

`src/main/libs/openclawConfigSync.runtime.test.ts`：

1. Qwen 标准端点：
   - input: `providerName=qwen`, `codingPlanEnabled=false`, `baseURL=https://dashscope.aliyuncs.com/compatible-mode/v1`
   - expect: `providerId=qwen-portal`, `primaryModel=qwen-portal/qwen3.6-plus`
2. Qwen Coding Plan：
   - input: `providerName=qwen`, `codingPlanEnabled=true`, `baseURL=https://coding.dashscope.aliyuncs.com/v1`
   - expect: `providerId=bailian-coding-plan`, `primaryModel=bailian-coding-plan/qwen3.6-plus`
3. Custom Aliyun Coding Plan：
   - input: `providerName=custom_0`, `baseURL=https://coding.dashscope.aliyuncs.com/v1`
   - expect: `providerId=bailian-coding-plan`, `primaryModel=bailian-coding-plan/qwen3.6-plus`
4. Custom normal endpoint：
   - input: `providerName=custom_0`, `baseURL=https://example.com/v1`
   - expect: `providerId=custom_0`, `primaryModel=custom_0/qwen3.6-plus`
5. Multiple provider collision：
   - `qwen` 和 `custom_0` 都映射 `bailian-coding-plan`，但 API key 不同
   - expect: 不静默合并错误凭证，输出可诊断 warn

`src/renderer/components/cowork/agentModelSelection.test.ts` 或新增 model ref 测试：

1. available model 的 `openClawProviderId=bailian-coding-plan`
2. `toOpenClawModelRef()` 返回 `bailian-coding-plan/qwen3.6-plus`
3. session modelOverride 不再生成 `qwen-portal/qwen3.6-plus`

### 7.2 OpenClaw runtime 测试

如果采用 runtime patch，需要补：

1. `bailian-coding-plan/qwen3.6-plus` 能进入 model catalog
2. startup warmup 不报 unknown model
3. `qwen/qwen3.6-plus` 在 Coding Plan endpoint 下仍可保持原 suppression，避免错误改变普通 Qwen provider 行为
4. `bailian-coding-plan/qwen3.5-plus` 和 `bailian-coding-plan/qwen3.6-plus` 都可发起 LLM 请求

### 7.3 手动验证

1. 设置页启用内置 Qwen Coding Plan，选择 `qwen3.6-plus`，新建 Cowork session，确认没有 `Unknown model`。
2. 设置页启用内置 Qwen Coding Plan，选择 `qwen3.5-plus`，确认仍正常。
3. 新增 `custom_0`，baseURL 填 `https://coding.dashscope.aliyuncs.com/v1`，模型填 `qwen3.6-plus`，确认 session override 和 openclaw.json 均为 `bailian-coding-plan/qwen3.6-plus`。
4. 新增 `custom_1`，baseURL 填普通兼容端点，确认仍为 `custom_1/model`。

## 8. 风险和边界

| 风险 | 处理 |
|---|---|
| bundled OpenClaw 没有 `bailian-coding-plan` provider | 必须升级 runtime 或加 patch，否则 LobsterAI 配置修复不完整 |
| 多个 provider 使用不同 Coding Plan API key | 检测冲突，不静默合并 |
| 自定义 provider 只是代理到阿里 Coding Plan 但 hostname 不是 `coding.dashscope.aliyuncs.com` | 默认不自动识别，继续走 `custom_N`，避免误判 |
| 用户手动填 `/apps/anthropic` Coding Plan 端点 | 仍识别为 Aliyun Coding Plan，并在 OpenClaw provider selection 中转换到 OpenAI-compatible `/v1` |
| 标准 Qwen endpoint 被误判为 Coding Plan | host 必须是 `coding.dashscope.aliyuncs.com` 或 `coding-intl.dashscope.aliyuncs.com`，标准 endpoint 不命中 |

## 9. 实施顺序

1. 先确认 bundled OpenClaw 是否已有 `bailian-coding-plan` provider。没有就先做 runtime patch 或升级 runtime。
2. 在 shared providers 中新增 `OpenClawProviderId.BailianCodingPlan` 和 `isAliyunCodingPlanBaseUrl()`。
3. 改 main 进程 `buildProviderSelection()`，按 effective baseURL 映射 `bailian-coding-plan`。
4. 改 renderer 的 `getOpenClawProviderIdForConfig()`，保证 UI session override 与 main 配置一致。
5. 加 provider 合并冲突检测。
6. 补单元测试和手动验证。

## 10. 参考

- 阿里云 OpenClaw Coding Plan 文档：`https://help.aliyun.com/zh/model-studio/openclaw-coding-plan`
