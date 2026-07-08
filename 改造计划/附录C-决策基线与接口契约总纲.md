# 附录 C：决策基线、源码订正与接口契约总纲

> **本文定位（权威层）**：本附录是 2026-07-08 计划评审后新增的「拍死层」。它做三件事：
> 1. 把此前在多篇之间悬而未决 / 循环甩锅 / 自相矛盾的**跨文档决策一次性拍死**（D1–D16）；
> 2. 汇总并订正计划正文中**对现状源码的错误断言与过时计数**（§2，均标注核对日期与 `path:symbol` 证据）；
> 3. 建立**机器可读接口契约的事实源政策**与关键 schema/DDL 骨架（§3–§7），作为多个 code agent 并行落地的同源。
>
> **冲突裁决**：凡本附录与其他任何文档（含 README §4「单一事实源」）冲突，**以本附录为准**；其余文档已就本文口径就地订正。本文与 `13`（范围冻结）互补：`13` 冻结「做/不做」，本文冻结「怎么做的关键决策与契约」。
>
> **核对基线**：本文所有源码引用以仓库 `package.json` `version=2026.7.7`、`openclaw.version=v2026.6.1`、核对日期 **2026-07-08** 为准。计划正文的行号会随代码漂移，**引用现状请优先用符号名/常量名，行号仅作辅助并标注核对日期**。

---

## 1. 决策基线（D1–D16，拍死）

> 每条给出：**决策 → 理由 → 落地要点 → 影响文档**。这些是数据层 / 运行时 / 计费 / 认证四条主链的总闸，未拍死前不得开工。

### D1 · 接口契约事实源 = OpenAPI 3.1（REST）+ AsyncAPI 2.6（WS）

- **决策**：REST 用 OpenAPI 3.1、WS 流用 AsyncAPI 2.6，物理落在 `libs/shared/contracts/`（`openapi.yaml` + `asyncapi.yaml`，或等价的 `zod` schema + `ts` 类型），由 CI 生成后端 DTO 校验、前端桥类型、契约测试三方代码。
- **理由**：附录 A / 04 只到「动词+路径」，字段级 DTO 恒为 0；后端 `class-validator`、前端桥、契约测试若各自臆测必然漂移。
- **落地要点**：**附录 A / 04 降级为「导航与任务清单」，字段级一律以 `libs/shared/contracts` 为权威**；稳定态的事件与通道全集由 contracts 内的注册表导出。初始抽取要结合 `src/shared/*/constants.ts` 的 `as const` 对象、`src/main/preload.ts` 的 `onStream*`、`src/main/main.ts` runtime forwarder 与 `src/renderer/types/electron.d.ts` 的 `IElectronAPI`，**禁止用字面量 grep 数通道**（已因此漏掉 `cowork:stream:goal`，见 §2-B13）。`cowork:stream:*` 必须新增 `CoworkStreamChannel` 注册表（见 §3.2），不能误认为现有 `CoworkIpcChannel` 已覆盖全部 stream 通道。代表性 schema 见 §3。
- **影响**：04、05、08、09、11、16、附录 A。

### D2 · RLS = 强制（不是「可选」）

- **决策**：**所有 tenant-scoped 表一律 `ENABLE ROW LEVEL SECURITY` + `FORCE`**，策略 `USING/WITH CHECK (tenant_id = current_setting('app.tenant_id')::uuid)`。每请求在事务内 `SET LOCAL app.tenant_id / app.user_id`，事务归还前 `RESET`。应用层 Prisma tenant extension 与 RLS **并存**（纵深，不是二选一）。删除全部「可选 RLS」表述。
- **理由**：00/02/05/06/10/14 反复写「可选/敏感表可选/每表 FORCE」，06 文档内部即矛盾（§3.2 可选 vs §5.4 每表 FORCE），而 02/17 越权门又把「RLS 拒绝跨租户」当验收判据——判据依赖一个未拍死的开关，无法验收。
- **落地要点**：会话变量集 = `app.tenant_id` + `app.user_id`（后者供身份表登录/切租户查询）；连接层走 PgBouncer **transaction 模式**并配 `SET LOCAL`（非 `SET`）；登录首查用 `current_setting('app.tenant_id', true)` 容忍 NULL。参考实现见 §5。
- **影响**：00、02、05、06、09、10、14、15、README。

### D3 · 身份表 DDL 的唯一 owner = 06；字段权威 = 本附录 §4

- **决策**：`users / tenants / memberships / identities / refresh_tokens / auth_codes / oauth_clients` 的字段级 DDL 由 **本附录 §4** 给出，`06` 为叙述 owner 并内联引用，`05` 只保留鉴权语义与 policy，**不再互指**。
- **理由**：05 §9 指向 06、06 指回 05，两端互指、内容落空，身份 Prisma schema 无法生成，开工第一步停摆。
- **影响**：05、06。

### D4 · gVisor 为默认 runtime，Kata 为兼容档回退（V1 用兼容矩阵决定回退面）

- **决策**：标准租户会话 `runtimeClassName: gvisor`；为「重/兼容」资源档保留 `runtimeClassName: kata`，由 `resourceClass` 路由规则选择。**V1 PoC 必须产出 gVisor 工作负载兼容+性能矩阵**（npx spawn 子进程 / node / shell / npm 解包 / 常用 stdio MCP / 技能脚本 的成功率与开销），矩阵不达标的工作负载路由到 Kata。
- **理由**：02/15/18 把它留成二选一未决，07/14 又单方面把 gVisor 定为 GA 默认却无验证——而 OpenClaw 执行面恰踩 gVisor 最弱处（用户态内核下的密集子进程 spawn 与文件 IO）。两条路 RuntimeClass/YAML/内核假设完全不同，Pod spec 无法落地。
- **落地要点**：Pod spec 用变量 `runtimeClassName`，由编排器按档位注入；矩阵回退判据写进 07 与 16 的 V1 准入门。
- **影响**：02、07、15、18、16。

### D5 · 工作区挂载单位 = 工作区（现状 `workspace-*` → 目标 `ws-{workspaceId}`），单写者租约

- **决策**：挂载单位统一为**工作区**。现状 OpenClaw state-dir 名称是 `workspace-{agentId}` / main 为 `workspace-main`；目标态必须映射为每租户 PVC 子路径 `tenants/{tenantId}/ws-{workspaceId}`，并挂载到 Pod `/workspace`。`session : workspace` 为多对一。**同一工作区同一时刻只允许一个 RW 挂载**（Pod），并发访问经分布式租约（Redis + PVC 上的 lease 文件）串行化，其余请求排队或降级只读。
- **理由**：挂载单位三处打架——07 按会话 `sessions/{id}`、08 按工作区 `ws-{id}`、源码按 agent `workspace-{agentId}`。按会话隔离→跨会话记忆 / `MEMORY.md` 断裂；按工作区共享而无锁→两个 Pod 以 RWX 并发写同一批文件和 `MEMORY.md`，记忆/文件损坏。
- **落地要点**：`MEMORY.md`、dreaming 产物、`AGENTS.md` 的 LobsterAI 托管段落写入归属单一持锁 Pod；补验收「并发写同一文件不丢写/不损坏」（16）。
- **影响**：06、07、08。

### D6 · gateway RPC 方法名订正 + sessionId→sessionKey[] 寻址（1:多）

- **决策**：网关 RPC 真名为 `chat.send / chat.abort / chat.history / sessions.list / sessions.patch / sessions.compact / sessions.goal / sessions.delete`。**`session.start / session.continue / session.history / session.delete` 均不存在，全部订正**。寻址单元是 **sessionKey**（一个 `sessionId` 对应多个 sessionKey，`getSessionKeysForSession()` 返回数组）；LobsterAI 侧的 `continueSession` 是对 `chat.send` 的封装。
- **理由**：07 通篇引用不存在的 RPC 名并把 sessionId 当 1:1 键（证据 §2-A2/A3），路由表、载荷键、续接机制全写错。
- **落地要点**：解析用 `parseManagedSessionKey` / `resolveSessionIdBySessionKey`（`openclawChannelSessionSync.ts`），区分 managed / channel key 并定义多键选主。
- **影响**：07、11、附录 A。

### D7 · 控制面反向路由：会话↔owning-replica 注册表，禁止静默 no-op

- **决策**：`respondToPermission / stopSession / compactContext` 等「回指某活跃会话」的命令，经 **Redis 会话→owning-replica 注册表** + 实例订阅的命令通道下发到持有该 gateway 连接的副本。**未命中 requestId 必须返回可路由错误或经总线转发，禁止现状式静默 no-op**（`coworkEngineRouter.ts` 对未知 requestId 直接 return）。
- **理由**：多副本无状态部署下，用户点「允许」落到错副本会被静默吞掉→生成永久挂起，直接推翻 04 §9「领域服务无状态」验收。
- **落地要点**：`respondToPermission / stopSession / compactContext` 等反向命令的命令信封或路由元数据必须带 `tenantId + sessionId + requestId`；`permissionDismiss` 这类前向事件用 `StreamEnvelope` 顶层携带 `tenantId/sessionId`，其 `data` 为旧桥兼容形状 `{ requestId }`，不得把两层字段混成两套 payload。
- **影响**：04、07。

### D8 · Egress 默认拒绝，但显式放行运行时必需的内网回调

- **决策**：Pod egress `default deny`，但**必须显式放行四类集群内网调用**：① 模型 token 代理 Service、② Cowork Service 承接 AskUser 回调、③ Media 回调、④ MCP bridge 回调，外加 kube-dns。区分「外网出站强制经审计 egress-proxy」与「集群内控制面直连内网 Service（NetworkPolicy 精确 selector + 单独审计）」。模型 token 代理**托管为独立 Service**（不作 Pod sidecar，否则 Pod 持密钥），`baseUrl` 渲染为集群 DNS。
- **理由**：07 §8.3 / 14 §4.2 只放行 egress-proxy+DNS，则 Pod 内 gateway 一发模型请求即被拒，会话跑不起来；且 §5.4「走 egress 代理」与 §2.3「直连 MODEL」互斥。
- **影响**：07、14。

### D9 · 配置下发 = 创建时渲染 + 「变更→生命周期」映射；必须重启类走 drain→重建→续接

- **决策**：Pod 创建时由 initContainer 渲染一次配置；对**会话中途的配置变更**给出逐字段「可热更 / 必须重建 Pod」映射表。必须重建类走 优雅 drain → 重建 → `chat.send` 续接（承认丢失当前进行中 turn，从 capsule 重放）。评估高频变更（启用技能）的最小热 reload 子集。
- **理由**：桌面端 mcp/secret-env/bindings 变更触发 `OpenClawConfigImpact.Restart` 硬重启网关；GA 若「创建时渲染一次 + secret baked 进不可变 env」，则中途加 MCP / 启用技能 / 轮换 BYOK / 切 provider 要么静默失效、要么隐性重建丢 turn，两种后果原文都没承认。
- **落地要点**：AC-13 补「中途变更 mcp/技能 N 秒内生效」可测判据；AC-8 从「零丢失」改为「至多丢失当前 turn，历史与工作区零丢失」。
- **影响**：07。

### D10 · 消息游标 = 不可变 `(created_at, id)`；V1 不做 HASH 分区

- **决策**：分页 / WS 去重游标改用**不可变复合键 `(created_at, id)`**（或独立 ksuid），**不用 `sequence` 作游标**。`cowork_messages` **V1 不做声明式分区**；确有必要时改用 `created_at` 时间范围分区，且分区列进每个唯一约束。
- **理由**：现状 `sequence` 可空、按 `SELECT COALESCE(MAX(sequence),0)+1` 赋值、insert-before 会 shift 重排（`coworkStore.ts:1753/1791`），**不是稳定键**，现状排序已 `COALESCE(sequence, created_at), created_at, ROWID` 兜底；04 用 `cursor={sequence}` 会指向错位消息。且 Postgres 声明式 HASH 分区要求分区列进唯一约束，照 06 §5.4 DDL + §3.2 HASH 分区会直接建表报错。
- **落地要点**：导入存量会话时，`sequence` 仅作展示序,不作键；NULL sequence 保留、以 `(created_at, id)` 兜底。
- **影响**：04、06。

### D11 · 认证主流程拍死

- **决策**：`/auth/login`（密码/OIDC 回调）由 **SPA fetch 取 JSON `{ code }`，SPA 自行跳转**（不返回 302），`code` 再换 token（PKCE，绑定 `redirect_uri`+CSRF state）。**刷新统一走 `/auth/refresh`（refresh token 承载于 `HttpOnly` cookie，`Path=/`）**；移动端/非浏览器客户端走 `/oauth/token`（body 承载）。刷新 rotation 带 grace window + family 版本 + 并发锁（同 family 并发刷新不误杀）。
- **理由**：05 把登录画成 POST 返 302（与 SPA fetch 冲突），refresh 无 grace window（双标签页合法并发刷新会误杀整 family 登出用户），`Path=/auth` cookie 又发不到 `/oauth/token`，两个刷新入口矛盾。
- **影响**：05。

### D12 · 计费四桶模型为权威，Redis 4-key + 优先级 Lua 原子扣减

- **决策**：额度四桶（日/月/赠送/充值）为权威，**Redis 侧用 4 个 key（或一个 hash 的 4 字段）**，跨桶按优先级原子扣减用 Lua；单计数器方案作废。`credit_accounts` 的物化快照字段必须统一为四桶**当前可用余额**（`daily_balance/monthly_balance/granted_balance/topup_balance`），`*_used` 只能由 ledger 派生给旧 API/报表展示，不得作为快照权威字段。`GET /api/v1/billing/account` 的旧桥兼容顶层字段必须由 breakdown 派生：`creditsRemaining=Σbalance`、`creditsLimit=daily.limit+monthly.limit+granted.total+topup.balance`、`creditsUsed=creditsLimit-creditsRemaining`。预扣公式落到字段级；量纲统一 `credits = Σ(tokens_i × unit_price_i) ÷ 1000`（**修正原文漏 `÷1000` 的 1000× 放大**）；账务表统一为 `billing_ledger`，`entry_type` 固定为 `hold/settle/release/refund/topup/grant/adjust`，`credits` 为账户有符号变动（负=扣减/占用，正=入账/释放/返还），`bucket_deltas` 必须记录四桶同号分摊且 Σbucket_deltas=`credits`；`refund` 不固定正负，必须用 `reason` 区分 `usage_correction`（用量迟到/多扣修正，通常正向返还）与 `payment_refund` / `chargeback`（支付退款/拒付 clawback，负向冲销已入账 credits）；幂等唯一键 = `(tenant_id, request_id, entry_type, reason)`，`request_id` 由服务端签发（不复用客户端值，避免跨租户碰撞与重放白嫖），同一业务请求若需要写多条同 `entry_type` 分录（如模型 usage + 沙箱成本、不同退款来源）必须用稳定 `reason` 区分。
- **理由**：09 §3.2 四桶与 §5.2 单计数器互斥、Lua 无定义、预扣公式把 input/output/cache 折叠成单一 `price/maxTokens` 不可编码、量纲漏 `÷1000`、幂等键不含 `tenant_id` 且复用客户端 requestId。
- **落地要点**：schema 见 §6。`costMultiplier` 现状是 **per-model**（`renderer/services/auth.ts` 的 `Model.costMultiplier`，前端「积分消耗倍率」直接展示），09 若引入 per-plan 倍率必须说明二者叠加顺序与前端取值来源，不得默认「前端零改」。
- **影响**：09。

### D13 · 阶段门唯一命名 = V1–V6，废弃 P0–P3 / G-V/GV 别名

- **决策**：全套文档阶段门统一用 **V1–V6**。废弃 `P0–P3`、`G-V1–G-V6`、`GV1–GV6` 别名；退出子门使用 `V1.0`、`V2.1` 这类编号，且必须上卷到对应版本门。越权门、SaaS schema 迁移校验、桌面存量导入双读、egress 门等的版本时点，以本附录 §8 的唯一对照表为准，16/17/18 就地对齐。形如 `P0-2` / `P1-7` / `P2-6` 的文本仅作为历史评审问题编号保留，不代表阶段门；裸 `P0/P1/P2/P3` 只能表示缺陷、事故、告警、客户支持或测试基准里的严重级 / 优先级，不得作为路线图阶段或工程 PR 批次名。
- **理由**：三套命名并存互不映射，越权/迁移门时点在 16/17/18 间差 1–2 个版本，写 CI gate 的 agent 不知实现 3 段还是 6 段门。
- **影响**：16、17、18、附录 B、README。

### D14 · 定时任务权威 = 服务端 BullMQ + Postgres（沙箱内 OpenClaw cron 禁用）

- **决策**：目标态调度权威是**服务端 BullMQ + Postgres**，沙箱内 OpenClaw cron 禁用/不下发。**订正附录 B 中「定时任务权威 = OpenClaw gateway cron」的导航结论**（那是现状口径，被误当目标结论）。
- **理由**：附录 B 与 README §4 / 06 / 11 / 17 完全相反，会让 Scheduler Service 整块做反。
- **影响**：11、17、附录 B、README。

### D15 · 复用口径 = 按文件分级，`coworkStore` / `openclawConfigSync` 属「必须重写/移植」

- **决策**：`04 §3.2 / 02 §4.3` 的「A 类直接复用」拆成三级——**lift-as-is（纯 `libs/` 逻辑）/ 需适配 / 必须重写**。`coworkStore.ts`（3044 行，`import better-sqlite3` + `electron`，~68 处 `db.prepare`）→ 必须重写为 Prisma/PG；`openclawConfigSync.ts`（3502 行，`import { app } from 'electron'` + 约 25 个 live getter）→ 必须去 Electron 化移植为 Node 模块与 `runtime-orchestrator` 的 `config-sync` entrypoint。
- **理由**：把深度耦合 SQLite/electron 的模块标为「直接搬」，与「不得把 electron-only API 带进后端」自相矛盾，派「搬」和派「重写」的 agent 拿到相反指令。
- **落地要点**：17 为这两项各新增独立 Story（`coworkStore→PG 重写`、`Config Sync 渲染链路化` 各 20 pd P50 基准 / 30-40 pd 高风险档；20 pd 只作 WBS 排期基线）。Config Sync 默认落在 `runtime-orchestrator` 的 `config-sync` entrypoint / initContainer，不新建独立 deployable。
- **影响**：00、02、04、17。

### D16 · 预览子资源鉴权 = 预览会话级签名 Cookie 前缀；CSP 放行沙箱自身脚本

- **决策**：文件型 HTML 预览的相对子资源（`./style.css`、`img/a.png`）用**预览会话级签名 Cookie / 令牌前缀**鉴权（作用域限 `/p/{previewSessionId}/` 这类沙箱预览路径），不用 per-file 签名。`previewSessionId` 是预览网关短期授权 ID，不是 Cowork `sessionId`，不得作为 artifact 对象存储前缀。网关 CSP 的 `script-src / style-src` **加入沙箱 host（self）** 并补 `worker-src blob:`、`base-uri`、`form-action`。
- **理由**：iframe 从沙箱域加载 HTML 后，浏览器对相对子资源发起的不带 sig/exp 子请求无法逐个验签，而「沙箱域不设 Cookie」与之冲突；§4.1 CSP 只有 `unsafe-inline` 缺 self 会拦掉文件型 HTML 的外部 css/js（验收 #1 必失败）。
- **影响**：12、14。

---

## 2. 源码订正表（核对日期 2026-07-08）

> 计划正文对现状源码的断言中，以下**方向性错误 / 系统性过时**必须订正；相关文档已就地改。证据列给 `path:symbol`（行号易漂移，故以符号为准）。

### 2-A 方向性错误（高危：会让 agent 建立在错误前提上）

| # | 原文档断言 | 正确事实 | 证据 |
|---|---|---|---|
| A1 | auth token 存 renderer `localStorage`（描述为 XSS 易受形态，05 §8.4 让删该代码） | token 由主进程 `saveAuthTokens` 明文写 SQLite `kv` 表，renderer 经 IPC 按需取；renderer 无 `localStorage`。真实风险是 **kv 明文**，「删 localStorage」的代码不存在 | `main.ts` `saveAuthTokens`；`renderer/services/auth.ts` 无 `localStorage` |
| A2 | 网关 RPC 为 `session.start/continue/history/delete` | 实为 `chat.send/chat.abort/chat.history/sessions.list/patch/compact/goal/delete`（见 D6） | `openclawRuntimeAdapter.ts`、`*.test.ts` |
| A3 | `sessionId` 为 1:1 会话键 | 网关按 `sessionKey` 寻址，1 `sessionId`→多 sessionKey | `getSessionKeysForSession()`、`parseManagedSessionKey`（`openclawChannelSessionSync.ts`） |
| A4 | `window.electron` 调用「收口在 `src/renderer/services/*`」 | components 直连 **245** 处 > services **207** 处，过半绕过 services。前端桥必须 **1:1 实现整个 `window.electron` 全局表面**，非替换 services 层 | `rg -o "window\.electron" src/renderer/{components,services}` |
| A5 | `coworkStore` / `openclawConfigSync` 为「纯逻辑直接复用」 | 二者深度耦合 `better-sqlite3`/`electron`/`app.getPath`，**必须重写/移植**（见 D15） | 两文件 import 头 |
| A6 | 扫描门控：severity `critical`(50 分) → 聚合 `riskLevel='critical'`，因此自动阻断 | 现状事实：`riskScoreToLevel(50)='high'`，单条 data-exfiltration 只靠聚合 level 会落到 high。目标态不能再只看聚合 level，必须按 `10` §5.3 / `14` §8.1 新增 **finding 级 severity 硬门**：任一 `critical` severity finding 默认 `blocked`，普通租户不可自助启用，仅企业租户管理员可强制放行并审计。 | `riskScoreToLevel`；`10` §5.3 / `14` §8.1 |
| A7 | 定时任务 `Stop` 为既有能力 | `Stop` handler 现状是**空实现**（`return { result:false }`），OpenClaw 无 stop API；需作为全新能力设计取消机制 | scheduled task stop handler |
| A8 | `commandSafety` 白名单 / `managed_npx_only` / `requireScan` 为现状/复用 | 现有 `src/main/libs/commandSafety.ts` 只做**危险命令分级**（语义不同）；白名单模式是全新概念，新模块须改名（如 `mcpCommandPolicy.ts`）避免撞名 | `libs/commandSafety.ts` |

### 2-B 计数 / 规模系统性过时（订正为核对值）

| # | 原文档口径 | 订正值（2026-07-08） | 证据 |
|---|---|---|---|
| B9 | IPC handler「合计 259 / main.ts 200 / main.ts 单文件 259」三套并存 | `main.ts` 内 `ipcMain.handle 211 + on 6 = 217`；全 `src/main` `handle 277 + on 6 ≈ 283`；**无一等于 259**。42 个 `im:*` handler **全内联在 main.ts**（非独立域模块）。04 §9「259 全部完成分类」的 DoD 分母作废，改引 §8 契约清单 | `rg "ipcMain\.handle"`；`rg -c "ipcMain\.handle\('im:" main.ts` = 42 |
| B10 | `window.electron` ~446 处 / 74 文件 | 实测 **481 处 / 72 文件**（且组件直连过半，见 A4） | `rg -o` |
| B11 | patch「共 61 / v2026.6.1 有 15」 | 实测**版本内 65 个（v2026.3.2:9 / v2026.4.5:1 / v2026.4.8:9 / v2026.4.14:26 / v2026.6.1:20）+ 1 个游离顶层 `openclaw-llm-request-debug-log.patch` = 66**；游离 patch 不被脚本应用，须交代归属 | `ls scripts/patches/**` |
| B12 | 测试基数「151 个 Vitest 用例」 | 实测 **175 个 `.test.ts` 文件**（文件数≠用例数）；用作迁移/验收基线会漏 | `rg -l --glob '*.test.ts'` |
| B13 | `cowork:stream:*` 共 **9** 个事件 | 实为 **10** 个——漏 `cowork:stream:goal`（`CoworkIpcChannel.StreamGoal`，preload `onStreamGoal`、`main.ts` 发送、`cowork.ts` 订阅）。真实前端桥通道是 `message/messageUpdate/sessionStatus/contextUsage/goal/contextMaintenance/permission/permissionDismiss/complete/error`；runtime 内部事件名如 `contextUsageUpdate`、`goalUpdate` 由 adapter 归一，不能把 runtime 内部事件表误写成前端 WS 契约 | `preload.ts:onStreamGoal`；`cowork.ts:260` |
| B14 | `webContents.send` 计数 47 / 33 / 29 混用 | 统一口径：`.send(` 调用点 ≈ **51**（含非 webContents）；`webContents.send` ≈ **36**；去重事件通道 ≈ **29**。引用必须区分「调用点/`webContents.send`/去重通道」 | `rg "\.send\("` / `rg "webContents\.send"` |
| B15 | 各处精确行号（main.ts ~10560、流事件行号等） | `main.ts` 已 **11307 行**，流事件行号整体偏移约 240–750 行；`30MB` 常量为 `30*1000*1000`（十进制），真实拦截线是 `OPENCLAW_CHAT_SEND_PAYLOAD_SAFE_LIMIT_BYTES`（安全线），30MB 是 WS 帧硬限（超限触发 close 1009）。**全套改用符号名定位** | `openclawRuntimeAdapter.ts:133-138` |

### 2-C 表/字段归属与跨文档打架

| # | 问题 | 订正 |
|---|---|---|
| C16 | 「16 张表见 `sqliteStore.ts`」误导 | `im_config/im_session_mappings` 在 `im/imStore.ts`、`scheduled_task_meta` 在 `scheduledTask/metaStore.ts`；`cowork_sessions.goal_json` 列现状存在但 06 三处目标定义全漏；`SQLITE_MIGRATION_TABLES`(17 张) **不含 `cowork_session_capsules`**（导入会静默丢胶囊/压缩上下文） |
| C17 | `cowork_user_memories` 当活跃表 | 该表仅出现在 `coworkStore.test.ts`，是**测试表**；生产只建 `user_memories` / `user_memory_sources`。附录 B / 13 §2.1 勿为不存在的表写迁移 |
| C18 | `costMultiplier` 被重定义为 per-plan 且未说迁移 | 现状 **per-model**（见 D12），须说明 per-model 倍率去向与前端取值 |
| C19 | 配额字段归属错、`normalizeAuthQuota` 语义 | `creditsLimit/Used/Remaining` 在 **`main/authQuota.ts`**（非 renderer）；`normalizeAuthQuota` 是 if/else 链，判别键优先级 `freeCreditsTotal → monthlyCreditsLimit → dailyCreditsLimit → creditsLimit`，只产单一值，与 09「四桶并存」语义已变，**「前端零改」不成立** |
| C20 | 第三方 OAuth 代持口径不一 | 01 §11 标 grade S（在建）且交叉引用指错文档，与 README/00/09/13 的「GA 后续」不一致——统一为 **GA 后续** |

> **已核实无误、无须改的**（避免过度返工）：`endpoints.ts` 端点、`api:stream:${requestId}:{data,done,error,abort}` 四态、`DEFAULT_GATEWAY_PORT=18789`、`OPENCLAW_AGENT_TIMEOUT_SECONDS=3600`、`classifyErrorKey` 在 `src/common/coworkErrorClassify.ts`、Gateway token「24 字节熵 / 48 hex 字符」、SQLite 活跃业务表 16 张总数。

---

## 3. 接口契约事实源政策与代表性 schema（对应 D1）

**政策**：以下 schema 是 `libs/shared/contracts` 的规范摘要；附录 A / 04 仅作导航。每个 GA(✅) 通道都必须在 contracts 中有 request/response/error/事件 payload 的字段级定义。错误统一信封：

```jsonc
// 统一错误信封（所有 REST 4xx/5xx）
{ "error": { "code": "PERMISSION_DENIED", "message": "…", "requestId": "…", "details": {} } }
```

### 3-A 契约落地与生成规则

> 本节把 D1 从「原则」落成可执行规则：契约源码、生成物、CI diff、错误码与事件信封必须一条链闭合。任何字段级契约只允许从这里指定的事实源生成，业务文档与代码注释不得另立口径。

**事实源与物理路径**：

| 类型 | 权威源码 | 生成物路径（建议） | 消费方 |
|---|---|---|---|
| DTO / payload schema | `libs/shared/contracts/src/**/*.schema.ts`（Zod） | `libs/shared/contracts/generated/types.ts`、`libs/shared/contracts/generated/validators.ts` | 后端 controller/service、前端 Web bridge、契约测试 |
| REST API | 由 Zod + route metadata 生成 `libs/shared/contracts/openapi.yaml`（OpenAPI 3.1） | `apps/api/src/generated/openapi-types.ts`、`apps/web/src/generated/api-client.ts`、契约测试 fixture | API 服务、前端桥、supertest 契约套件 |
| WS / SSE / runtime event | 由事件 Zod schema + channel metadata 生成 `libs/shared/contracts/asyncapi.yaml`（AsyncAPI 2.6） | `apps/api/src/generated/ws-events.ts`、`apps/web/src/generated/stream-events.ts`、WS/SSE mock server | Gateway、Web bridge、Playwright 流式夹具 |
| 错误码 | `libs/shared/contracts/src/errors.ts`（`as const` + Zod enum） | `generated/error-codes.ts`、OpenAPI error responses、AsyncAPI error messages | 前后端错误分类、i18n 映射、测试断言 |

**生成与禁止项**：

- `openapi.yaml` / `asyncapi.yaml` / `generated/*` 均为生成物，文件头必须标注 `DO NOT EDIT`；**禁止手改生成物**。需要改字段时，只能改 `contracts/src` 的 Zod schema、route/event metadata 与共享常量。
- 生成命令必须是幂等的：同一输入重复运行不得产生 diff；CI 先运行 contract generate，再 `git diff --exit-code libs/shared/contracts/openapi.yaml libs/shared/contracts/asyncapi.yaml libs/shared/contracts/generated`。
- PR 修改任何 `src/shared/*/constants.ts` 的通道、状态、错误码，或修改任何 API/WS handler payload，必须同步修改 `contracts/src`；否则 contract diff / 静态覆盖断言失败。
- 契约生成物不得反向 import 应用代码；只允许 import `libs/shared/contracts/src` 与 `src/shared/*/constants.ts` 中稳定的 `as const` 常量，防止后端/前端循环依赖。

**CI contract diff 门禁**：

| 门 | 检查 | 失败含义 |
|---|---|---|
| schema compile | Zod schema、route metadata、event metadata 可生成 OpenAPI/AsyncAPI | 契约源码不可用 |
| generated diff | 生成后无未提交 diff | 手改生成物或忘记重新生成 |
| coverage diff | `CoworkIpcChannel` / API route / error code / stream event 穷举均有契约条目 | 新通道或新错误码未入契约 |
| breaking diff | 对比 main 分支上一次 contract snapshot，标记删除字段、收窄 enum、必填字段新增、错误码删除、event envelope 破坏 | 需要显式版本升级或兼容策略 |
| mock conformance | 由 OpenAPI/AsyncAPI 生成的 mock 与 Web bridge / Playwright fixture 可跑通 | 契约无法驱动消费者测试 |

**错误码规则**：

- 错误码使用稳定大写 snake case（如 `PERMISSION_DENIED`、`SESSION_BUSY`、`PAYLOAD_TOO_LARGE`、`QUOTA_EXCEEDED`、`STORAGE_QUOTA_EXCEEDED`），不得把人类可读 message 当分类依据。
- 每个错误码必须定义：`httpStatus`、是否可重试、是否可展示给用户、默认 i18n key、可选 `details` schema。REST 错误统一走 `{ error: { code, message, requestId, details } }`；WS/SSE 错误走 event envelope 的 `type:'error'`。
- 删除或重命名错误码视为 breaking change；废弃错误码须保留至少一个 GA 小版本，标注 `deprecatedSince` 与替代码。

**版本兼容规则**：

- OpenAPI/AsyncAPI 顶层版本使用 `x-lobster-contract-version`（`major.minor.patch`）。新增可选字段、增加 enum 值、增加事件类型为 minor；删除字段、字段改必填、字段类型收窄、错误码删除、event envelope 字段改名为 major。
- 服务端至少兼容当前前端发布版本与上一个 minor 的契约；前端 bridge 必须忽略未知可选字段与未知非关键事件，并对未知必需事件上报 `UNSUPPORTED_EVENT_TYPE`。
- REST 路由废弃必须在 OpenAPI 标注 `deprecated: true`，并给 `sunsetAt`；WS/SSE 事件废弃必须保留 envelope 与 no-op 解析，直到约定窗口结束。

**SSE / WebSocket event envelope**：

所有流式事件（含 `cowork:stream:*`、`api:stream:*`、任务事件、runtime 归一事件）统一用 envelope，payload 只放在 `data`：

```ts
type StreamEnvelope<TType extends string, TData> = {
  type: TType;                 // 稳定事件类型，不等同于展示文案
  version: 1;                  // envelope 版本，非业务 schema 版本
  tenantId: string;
  sessionId?: string;
  requestId?: string;
  seq?: string;                // Redis Stream id 或等价单调游标
  idempotencyKey?: string;     // 可选，重复投递去重
  emittedAt: string;           // ISO timestamptz
  data: TData;
};
```

- WS 与 SSE 只允许在传输 framing 上不同，`StreamEnvelope` 字段语义必须一致；SSE 的 `id:` 对应 `seq`，`event:` 对应 `type`。
- `tenantId` 用于服务端路由与审计，客户端不得以其越权切租户；服务端鉴权仍以 JWT/RLS 上下文为准。
- `seq` 是断连补发和去重的唯一游标；不得用可重排的展示序号替代（对齐 D10）。

### 3-B 关键 DTO / 事件覆盖清单

> 下表不是完整 OpenAPI/AsyncAPI，而是必须进入 `contracts/src` 且生成到 OpenAPI/AsyncAPI/generated types 的最小清单。任一项只在实现代码中存在、不在契约源码中存在，视为契约缺口。

| 域 | 必入 DTO / 事件 | 必须覆盖的字段或语义 | 生成物 |
|---|---|---|---|
| Auth / OAuth | `LoginRequest`、`LoginResponse{code}`、`OAuthTokenRequest`、`TokenResponse`、`RefreshRequest`、`LogoutResponse`、`AuthError` | PKCE `code_challenge`/`verifier`、`redirect_uri`、CSRF `state`、refresh rotation family、cookie refresh 与 body refresh 分流 | OpenAPI DTO + error responses |
| Tenant / RBAC | `TenantSummary`、`Membership`、`SwitchTenantRequest`、`Role`、`TenantScopedError` | `tenantId` 只来自鉴权上下文；角色 enum；跨租户/IDOR/需隐藏存在性的越权统一 404，同租户内角色不足可用 403；拒绝存在性泄露 | OpenAPI DTO + error enum |
| Cowork session | `StartSessionRequest`、`StartSessionResponse`、`ContinueTurnRequest`、`TurnAcceptedResponse`、`SessionSummary`、`SessionDetail`、`SessionPatchRequest`、`DeleteSessionResponse` | start=首 prompt 必填并立即生成；continue 返回 `requestId`；`sessionId` 与 `sessionKey[]` 关系；`goal`/`capsule` 字段 | OpenAPI DTO + bridge types |
| Message / pagination | `MessageDto`、`MessageListResponse`、`PageInfo`、`MessageCursor` | 游标为 `(created_at,id)` 或 ksuid；`sequence` 仅展示；稳定排序与 `hasMore` | OpenAPI DTO |
| Permission / AskUser | `PermissionRespondRequest`、`PermissionResult`、`PermissionUpdate`、`AskUserQuestion`、`PermissionDismissEvent` | `kind:'tool'|'ask'`；`allow/deny` 判别联合；`updatedPermissions` 表达始终允许；反向路由带 `tenantId/sessionId/requestId`（命令信封/路由元数据）；`PermissionDismissEvent.data` 保持 `{ requestId }`，`tenantId/sessionId` 在 `StreamEnvelope` 顶层 | OpenAPI + AsyncAPI event |
| Stream events / WS ticket | `StreamTicketRequest/Response`、10 个 `cowork:stream:*`、`api:stream:{data,done,error,abort}`、`goalUpdate/sessionStopped` 归一事件 | ticket body = `sessions[]` + `resourceSubscriptions[]`（至少 `files:changed` 的 `{workspaceId,path?}`），用户级事件随 auth；统一 `StreamEnvelope`；`seq` 补发；`contextUsageUpdate` 命名；`goal` 不得漏 | OpenAPI + AsyncAPI + WS/SSE generated types |
| Agent / model | `AgentDto`、`AgentCreate/UpdateRequest`、`ModelDto`、`ModelDetailResponse`、`ProviderConfig`、`PricingCatalogResponse` | agent `id='main'` 语义、skillIds、workingDirectory、model `costMultiplier`（per-model）；`GET /api/v1/models/{id}` 返回同租户可见模型详情（单价/能力/降级链），跨租户/套餐不可见/不存在统一 404；登录后 pricing-catalog 兼容视图由 `/api/v1/pricing/models` 生成旧 `textModels/imageModels/videoModels` 形状，公开定价页不得复用该 IPC | OpenAPI DTO |
| Media tasks | `MediaTaskDto`、`MediaTaskStatusResponse`、`MediaCancelResponse`、`MediaStatusPollUpdate` | `taskId` 是对外 text id（租户内唯一，不暴露内部 UUID），`GET /api/v1/media/tasks/{taskId}` 与 `POST /api/v1/media/tasks/{taskId}/cancel` 均带 tenant scope，跨租户/不存在统一 404；状态枚举 `pending/running/succeeded/failed/canceled`；结果只给对象存储签名 URL/key 引用；WS `mediaStatusPollUpdate` 与轮询响应字段同源 | OpenAPI + AsyncAPI event |
| ASR realtime | `AsrSessionCreateRequest/Response`、`AsrStreamTicket`、`AsrAudioChunk`、`AsrPartialEvent`、`AsrFinalEvent`、`AsrErrorEvent` | `POST /api/v1/asr/sessions` 返回 `asrSessionId/streamTicket/expiresAt/recommendedMimeType`；WS `/api/v1/asr/sessions/{asrSessionId}/stream` 只接受绑定同租户同用户的短期 ticket；partial/final/error 进入 AsyncAPI；计费 ledger reason=`asr_transcription`，失败/取消必须 release 或写 0 credits usage/audit | OpenAPI + AsyncAPI |
| Workspace / files | `WorkspaceListResponse`、`WorkspaceCreateRequest/Response`、`WorkspaceTreeRequest/Response`、`FileUploadIntent`、`UploadCompleteRequest/Response`、`FileDeleteResponse`、`FileSyncStatus`、`SaveInlineFileRequest/Response`、`ReadFileAsDataUrlResponse` | 工作区 list/create、S3 直传、异步落 PVC、软删、`tree` cursor/depth/sort、25MB inline 上限、桥 shim 旧形状 | OpenAPI DTO |
| Artifact / preview | `ArtifactDto`、`PreviewTokenRequest/Response`、`PreviewEvent` | `previewSessionId` 预览授权、预览会话级签名 Cookie/令牌前缀、CSP mode、file/html/svg/document 类型 | OpenAPI + AsyncAPI |
| MCP / Skills | `McpServerConfig`、`McpLaunchResolution`、`SkillManifest`、`SkillScanResult`、`SupplyChainPolicyError` | 新白名单模块命名为 `mcpCommandPolicy`，不得复用旧 `commandSafety` 名；risk level、integrity、registry、lifecycle scripts、secref | OpenAPI DTO + error enum |
| Scheduled tasks | `ScheduledTaskDto`、`TaskCreate/UpdateRequest`、`TaskRunDto`、`TaskStatusEvent`、`TaskRunEvent` | 服务端 BullMQ 权威；沙箱 OpenClaw cron 禁用；job tenant 上下文 | OpenAPI + AsyncAPI |
| Billing / quota | `QuotaBuckets`、`BillingHoldRequest/Response`、`BillingSettleRequest`、`BillingLedgerEntry`、`UsageReport`、`BillingError` | 四桶、Lua 原子扣减、`credits=Σ(tokens_i×unit_price_i)÷1000`、`billing_ledger.entry_type=hold/settle/release/refund/topup/grant/adjust`、`billing_ledger.reason` 区分 `model_usage` / `media_generation` / `asr_transcription` / `usage_correction` / `payment_refund` / `chargeback` / 沙箱成本等来源、`bucket_deltas` 四桶分摊、幂等键 `(tenant_id,request_id,entry_type,reason)`、usage missing 与 refund/adjust 补偿 | OpenAPI DTO + error enum |
| Sandbox runtime | `RuntimeSessionClaim`、`PodLease`、`RuntimeClass`、`GatewayRpcRequest/Response`、`RuntimeHealthEvent` | `runtimeClassName` gVisor/Kata、workspace 单写者租约、owning-replica、gateway RPC 真名 | AsyncAPI/internal OpenAPI |
| Sharing / content safety | `ShareCreateRequest`、`ShareDto`、`ShareAbuseReport`、`ShareTakedownEvent` | noindex、下架/CDN 失效、CSP 外链 allowlist、举报状态 | OpenAPI + AsyncAPI |

### 3.1 权限响应（对应 D2 权限流 / 历史评审编号 P0-2，非阶段门）—— 对齐真实 `PermissionResult`

```ts
// POST /api/v1/sessions/:id/permissions/:requestId/respond
// 单端点同时承接工具授权与 AskUser；requestId 同时在路径和 body 中用于桥同形/幂等校验。
type PermissionRespondRequest =
  | { kind: 'tool';   requestId: string; result: PermissionResult }
  | { kind: 'ask';    requestId: string; answers: Record<string, string> }; // AskUserQuestion

// 与源码 types.ts 的判别联合一致（原文 decision/scope/allow_always 三字段均不存在）
type PermissionResult =
  | { behavior: 'allow'; updatedInput?: unknown; updatedPermissions?: PermissionUpdate[] }
  | { behavior: 'deny';  message: string; interrupt?: boolean };
// 「本次会话始终允许」= 在 updatedPermissions 中追加对应 rule，而非独立 allow_always 布尔
```

`kind:'ask'` 分支对应 `resolveAskUser`（走 McpBridge）；MCP 工具授权的第二个 `cowork:stream:permission` 发送点须复用同一端点。

### 3.2 流式事件全集（对应 D1 / B13）—— **10 个**，以桥表面为准

当前源码里只有 `cowork:stream:goal` 被纳入 `CoworkIpcChannel.StreamGoal`，其余 stream 通道仍有字面量。因此 **PR-1 contracts/codegen 必须先新增 `CoworkStreamChannel` 共享注册表**（建议落 `libs/shared/contracts/src/cowork-stream.ts` 或等价 zod/TypeBox 源），并由该注册表生成 AsyncAPI、Web bridge 类型与静态断言。直到该注册表落地前，字段核对以 `src/main/preload.ts` 的 `onStream*` 表面 + `src/main/main.ts` runtime forwarder 为准，不能把 OpenClaw runtime 内部事件名误写成前端契约。

| 前端桥事件 | AsyncAPI channel | payload 关键字段 | 源码现状 |
|---|---|---|---|
| `cowork:stream:message` | `cowork/stream/message` | `{ sessionId, message, beforeMessageId? }` | `preload.onStreamMessage` / runtime `message` |
| `cowork:stream:messageUpdate` | `cowork/stream/message-update` | `{ sessionId, messageId, content, metadata? }` | `preload.onStreamMessageUpdate` / runtime `messageUpdate` |
| `cowork:stream:sessionStatus` | `cowork/stream/session-status` | `{ sessionId, status }` | `preload.onStreamSessionStatus` / runtime `sessionStatus` |
| `cowork:stream:contextUsage` | `cowork/stream/context-usage` | `{ sessionId, usage }` | runtime 内部名 `contextUsageUpdate`，forwarder 归一为该通道 |
| `cowork:stream:goal` **（原漏）** | `cowork/stream/goal` | `{ sessionId, goal }` | `CoworkIpcChannel.StreamGoal` / runtime `goalUpdate` |
| `cowork:stream:contextMaintenance` | `cowork/stream/context-maintenance` | `{ sessionId, active }` | `preload.onStreamContextMaintenance` |
| `cowork:stream:permission` | `cowork/stream/permission` | `{ sessionId, request }` | `preload.onStreamPermission`；工具授权与 AskUser 共用 |
| `cowork:stream:permissionDismiss` | `cowork/stream/permission-dismiss` | `{ requestId }`（`tenantId/sessionId` 在 `StreamEnvelope` 顶层） | `preload.onStreamPermissionDismiss` |
| `cowork:stream:complete` | `cowork/stream/complete` | `{ sessionId, claudeSessionId? }` | `preload.onStreamComplete` / runtime `complete` |
| `cowork:stream:error` | `cowork/stream/error` | `{ sessionId, error }` | `preload.onStreamError` / runtime `error` |

契约测试须加两条静态断言：**(1) `CoworkStreamChannel` 注册表中的每个通道都必须在 AsyncAPI 中有映射；(2) `IElectronAPI` / `ElectronBridge` 暴露的每个 `onStream*` 方法都必须绑定到注册表中的通道**。这样才能防止再次漏 `goal`，也能防止把 `delta/tool/thinking/done/abort` 这类非当前前端桥通道误写进契约。

### 3.3 会话创建语义（对应 P2-1）

`cowork:session:start` 现状是 **create + 首 prompt + 立即生成** 的原子操作（prompt 必填），不存在「创建空闲会话」；后续轮次走独立 `cowork:session:continue`。契约据此：

```
POST /api/v1/sessions              body: { agentId, prompt, cwd?, ... }  -> { sessionId, ... }  // 首 prompt 必填，立即开跑
POST /api/v1/sessions/:id/turns    body: { prompt, ... }                 -> { requestId }        // = continue
```

**canonical REST/WS 路径（PR-1 必须写入 OpenAPI/AsyncAPI，其他文档不得另起口径）。**

> 参数占位写法：正文表格里的单段 `:paramName`（例如 `:id` / `:requestId` / `:wid` / `:key` / `:taskId` / `:provider` / `:runId` / `:presetId` / `:artifactId` / `:previewSessionId` / `:asrSessionId` / `:exportId` / `:deletionId`）是 Nest/Express 风格 shorthand，便于阅读；`libs/shared/contracts/openapi.yaml` 的正式 REST 路径与 AsyncAPI channel path 必须使用对应 OpenAPI/AsyncAPI 语法 `{paramName}`。contract check 需要把任意单段文档 shorthand 与 OpenAPI/AsyncAPI `{}` 形式归一比对，禁止把二者误判为两套不同路由；但冒号式 action path（如 `/sessions/{id}:exportText`、`/plugins:detect`）不是参数 shorthand，仍按禁用路径拒绝。

| 语义 | canonical 路径 | 禁用/易错写法 |
|---|---|---|
| 创建会话并发送首 prompt | `POST /api/v1/sessions` | `/api/cowork/sessions`、创建空闲会话后另发首消息 |
| 继续会话 / 新一轮生成 | `POST /api/v1/sessions/:id/turns` | `POST /api/v1/sessions/:id/messages`、`POST /sessions/{id}/messages` |
| 拉取历史消息 | `GET /api/v1/sessions/:id/messages` | 把 `messages` 端点同时当写入/生成入口 |
| 响应工具授权 / AskUser | `POST /api/v1/sessions/:id/permissions/:requestId/respond` | `/permissions/respond` 无 sessionId、仅 body 带 requestId |
| WS ticket 申请 | `POST /api/v1/stream/ticket` | WS URL query 带 JWT、首帧长效 bearer、无 REST ticket 端点、ticket body 未校验 session/workspace scope |
| 非流式模型代理 | `POST /api/v1/model/proxy` | `/api/model/proxy`、浏览器直连 provider |
| 流式模型代理启动 | `POST /api/v1/model/stream` | `/api/model/stream`、只发 WS 控制帧启动、把启动混入 `/api/v1/model/proxy` |
| 流式模型代理取消 | `POST /api/v1/model/stream/:requestId/abort` | 另设 WS cancel 控制帧、`api:stream:cancel` 无 REST 路由 |
| ASR 会话创建 / 实时流 | `POST /api/v1/asr/sessions`；配套 AsyncAPI channel `WS /api/v1/asr/sessions/:asrSessionId/stream` | 无版本 `/asr/sessions`、把 ASR 混入 `/api/v1/model/stream`、只实现前端 MediaRecorder 而没有服务端 stream ticket / tenant scope |
| 模型配置兼容 | `GET /api/v1/model/config`、`PUT /api/v1/model/config`、`POST /api/v1/model/config/check` | `/model/config`、`/api/model/config`、`/model/config:check`、把旧 `get-api-config`/`check-api-config`/`save-api-config` 漏出 PR-1 OpenAPI 或另建并行密钥库 |
| 模型目录 / 详情 | `GET /api/v1/models`、`GET /api/v1/models/:id` | `/model/catalog`、`/api/models/available`、`/api/models/{id}`、`/model/{id}`、直接读 youdao available |
| 登录后 pricing-catalog 兼容视图 | `GET /api/v1/pricing/models` | `/billing/pricing`、`/api/models/pricing-catalog`、把 `/api/v1/models` 响应直接当旧 pricing-catalog 形状 |
| 媒体任务状态 / 取消 | `GET /api/v1/media/tasks/:taskId`、`POST /api/v1/media/tasks/:taskId/cancel` | `/api/v1/media/models`、`/media/tasks/:taskId`、`/media/tasks/:taskId/cancel`、`/media/tasks/{taskId}:cancel`、`/api/v1/media/tasks/{taskId}:cancel` |
| 计费账户 / 用量 / 套餐 / BYOK | `GET /api/v1/billing/account`、`GET /api/v1/billing/usage`、`GET /api/v1/billing/plan`、`POST /api/v1/billing/byok`、`DELETE /api/v1/billing/byok/:provider` | `/billing/account`、`/billing/usage`、`/billing/plan`、`/billing/byok`、`/api/v1/billing/quota`、把 `auth:getQuota` 继续映射到旧 quota 路径 |
| 隐私导出/删除 | `POST /api/v1/privacy/exports`、`GET /api/v1/privacy/exports/:exportId`、`POST /api/v1/privacy/deletions`、`GET /api/v1/privacy/deletions/:deletionId` | `/api/v1/privacy/export`、`/api/v1/privacy/delete`、`/api/v1/privacy/delete/:deletionId`、只在合规专题定义而不进入 PR-1 OpenAPI |
| 其它动作类端点 | 子资源 + `POST`，例如 `/api/v1/sessions/:id/stop`、`/api/v1/sessions/:id/exports/text`、`/api/v1/model/config/check`、`/api/v1/runtime/restart` | 冒号式 action path：`/sessions/{id}:exportText`、`/model/config:check`、`/runtime:restart` |

字段级 request/response 仍以 `libs/shared/contracts` 为权威；上表只冻结资源命名，避免继续出现 `/api/cowork/*` 与 `messages` 写端点混用。

> **完整路由集说明**：本节表格是高风险跨域路径的命名裁决，不是 OpenAPI/AsyncAPI 全量清单。PR-1 的完整 REST/WS 契约必须以 `附录A` 所有 ✅/部分 ✅ 通道和各专题文档的 GA 路径为输入生成，并由 contract check 逐条断言；因此 ASR realtime、artifact 预览、htmlShare、shareDeployment 静态站、scheduledTask CRUD/stop/count/resolve/channels 等即使未逐项列在上表，也仍是 contracts 必做项。缺席本表不得被解释为「不进 PR-1」或「可用无版本 shorthand」。

### 3.4 文件 / 上传（对应 P1-7）

- 统一错误码：`413` 拆为 `PAYLOAD_TOO_LARGE`（文本过大 → 改用 URL 拉取）与 `STORAGE_QUOTA_EXCEEDED`（`507`，超存储配额）；模型/账单 credits 不足仍使用 `QUOTA_EXCEEDED`（`402`，见 `09`），任务数量/触发频率分别使用 `TASK_LIMIT_EXCEEDED`（`403`）/`RATE_LIMITED`（`429`，见 `11`）。
- 大文件方向定死为 **S3 直传 → 异步落 PVC**，落地失败/重试/幂等写进同步表状态机。
- 配额「当前用量」权威读**单一来源**（Redis 预留计数，原子 `INCRBY`/回补），DB `size_bytes` 仅对账。
- REST 路径冻结：工作区 `GET /api/v1/workspaces`、`POST /api/v1/workspaces`；目录 `GET /api/v1/workspaces/:wid/files/tree?path=`；读/签名 URL `GET /api/v1/workspaces/:wid/files/download?path=&as=text|url`；内联写 `POST /api/v1/workspaces/:wid/files/upload`；直传 `POST /api/v1/workspaces/:wid/uploads`、`POST /api/v1/workspaces/:wid/uploads/:id/complete`；软删 `DELETE /api/v1/workspaces/:wid/files?path=`；元信息 `GET /api/v1/workspaces/:wid/files/stat?path=`；缩略图 `GET /api/v1/workspaces/:wid/files/thumbnail?path=`；禁止把读取写成 `/files?path=` 或冒号式 `files:download` / `files:upload`。
- `tree` 定义 cursor 编码、depth 语义、稳定排序键 `(type, name, id)`。
- 桥 shim 形状对齐现状：`saveInlineFile({ dataBase64, fileName, mimeType, cwd }) -> { success, path }`（25MB 上限）、`readFileAsDataUrl(...) -> { success, dataUrl }`——桥须把新响应适配回旧契约形状，避免打断 `ArtifactPanel`/`CodeRenderer`；其中 `cwd` 只表示 `workspaceId + project/relRoot` 语义，不得透传为服务器绝对路径或指向 `/workspace/state`。

---

## 4. 身份与租户表 DDL（对应 D3；06 为 owner，此为字段权威）

> Postgres 方言；所有 tenant-scoped 表额外 `ENABLE ROW LEVEL SECURITY` + `FORCE`（见 §5）。时间列 `timestamptz`，主键 `uuid default gen_random_uuid()`。PR-2 首个迁移必须先执行/校验 `CREATE EXTENSION IF NOT EXISTS citext`；若目标 Postgres 版本或托管库不提供内建 `gen_random_uuid()`，同一迁移必须启用 `pgcrypto` 或改为应用侧生成 UUID，并同步更新 Prisma schema、DDL 示例与导入脚本，不能让 DDL 依赖隐式扩展。

```sql
CREATE TABLE tenants (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name          text NOT NULL,
  status        text NOT NULL DEFAULT 'active'
                  CHECK (status IN ('active','suspended','deleted')),
  terms_version text,                          -- 见 P1-14 合规同意
  created_at    timestamptz NOT NULL DEFAULT now(),
  deleted_at    timestamptz
);

CREATE TABLE users (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email          citext NOT NULL,               -- citext 大小写不敏感唯一
  email_verified boolean NOT NULL DEFAULT false,
  status         text NOT NULL DEFAULT 'active'
                   CHECK (status IN ('active','suspended','deleted')),
  terms_version  text, terms_accepted_at timestamptz,  -- 注册同意采集
  created_at     timestamptz NOT NULL DEFAULT now(),
  deleted_at     timestamptz
);
CREATE UNIQUE INDEX users_email_uk ON users (email) WHERE deleted_at IS NULL;

CREATE TABLE memberships (               -- 用户↔租户 多对多 + 角色
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES users(id),
  tenant_id  uuid NOT NULL REFERENCES tenants(id),
  role       text NOT NULL CHECK (role IN ('owner','admin','member','viewer')),
  status     text NOT NULL DEFAULT 'active'
               CHECK (status IN ('invited','active','suspended')),
  invited_by uuid REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, tenant_id)
);

CREATE TABLE identities (                -- 外部 OIDC/社会化身份
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL REFERENCES users(id),
  provider      text NOT NULL,           -- 'google' | 'github' | 'password' | ...
  provider_uid  text NOT NULL,
  created_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (provider, provider_uid)
);

CREATE TABLE refresh_tokens (            -- 轮换 + family（对应 D11）
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL REFERENCES users(id),
  tenant_id    uuid REFERENCES tenants(id),
  family_id    uuid NOT NULL,            -- 同一登录 family
  token_hash   text NOT NULL,
  replaced_by  uuid REFERENCES refresh_tokens(id),
  expires_at   timestamptz NOT NULL,     -- 滑动
  absolute_exp timestamptz NOT NULL,     -- family 绝对寿命上限
  revoked_at   timestamptz,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE auth_codes (                -- OAuth2 授权码 + PKCE
  code           text PRIMARY KEY,
  user_id        uuid NOT NULL REFERENCES users(id),
  tenant_id      uuid REFERENCES tenants(id),
  client_id      text NOT NULL,
  redirect_uri   text NOT NULL,
  code_challenge text NOT NULL,          -- PKCE S256
  scope          text NOT NULL DEFAULT '',
  expires_at     timestamptz NOT NULL,
  used_at        timestamptz             -- 单次使用
);

CREATE TABLE oauth_clients (             -- redirect_uri 白名单
  client_id     text PRIMARY KEY,
  name          text NOT NULL,
  redirect_uris text[] NOT NULL,
  is_public     boolean NOT NULL DEFAULT true
);
```

身份表 RLS 用 `app.user_id`（非 `app.tenant_id`），定义三场景策略：登录首查（无 tenant 上下文，按 user_id）、切租户、成员管理。

---

## 5. RLS 落地参考实现（对应 D2）

```sql
-- 每张 tenant-scoped 表：
ALTER TABLE cowork_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE cowork_sessions FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON cowork_sessions
  USING      (tenant_id = current_setting('app.tenant_id')::uuid)
  WITH CHECK (tenant_id = current_setting('app.tenant_id')::uuid);
```

```ts
// NestJS：每请求事务内 SET LOCAL，AsyncLocalStorage 传递上下文
async function withTenant<T>(ctx: {tenantId: string; userId: string}, fn: (tx) => Promise<T>) {
  return prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT set_config('app.tenant_id', ${ctx.tenantId}, true)`;
    await tx.$executeRaw`SELECT set_config('app.user_id', ${ctx.userId}, true)`;
    return fn(tx);
  });
}
```

- 连接层 **PgBouncer transaction 模式**：必须用 `SET LOCAL`（事务级），不可用 `SET`（会话级，池化下串租户）。
- RLS 上下文注入必须走参数化 SQL（如上面的 `set_config(..., true)`，等价于事务级 `SET LOCAL`）；不得用 `$executeRawUnsafe` 或字符串拼接把 `tenantId/userId` 写进 SQL。
- Prisma tenant extension 仍在应用层强制注入 `where tenant_id`（纵深，覆盖 `upsert / createMany / aggregate / groupBy` 的注入漏洞）。
- 连接数预算：`RLS 每请求事务 × HPA 水平副本 × 连接池` 会撞 `max_connections`，PgBouncer 须列为一等部署组件（见 15）。

---

## 6. 计费引擎 schema（对应 D12）

```
Redis（每租户，原子）：
 quota:{tenantId}:daily     quota:{tenantId}:monthly
  quota:{tenantId}:granted   quota:{tenantId}:topup
预扣（Lua，按优先级 daily→monthly→granted→topup 扣减，跨桶补差，允许负余额熔断）：
  holdCredits = ceil((maxInputTokens_est × price_input + maxOutputTokens_est × price_output) ÷ 1000 × costMultiplier)
结算：真实 usage 回补差额，写 billing_ledger（幂等键唯一约束）。
```

```sql
CREATE TABLE credit_accounts (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id      uuid NOT NULL UNIQUE,
  daily_limit    numeric NOT NULL DEFAULT 0,
  daily_balance  numeric NOT NULL DEFAULT 0,
  monthly_limit  numeric NOT NULL DEFAULT 0,
  monthly_balance numeric NOT NULL DEFAULT 0,
  granted_total  numeric NOT NULL DEFAULT 0,
  granted_balance numeric NOT NULL DEFAULT 0,
  topup_balance  numeric NOT NULL DEFAULT 0,
  period_start   timestamptz NOT NULL,
  updated_at     timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE billing_ledger (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   uuid NOT NULL,
  request_id  text NOT NULL,               -- 服务端签发
  entry_type  text NOT NULL CHECK (entry_type IN ('hold','settle','release','refund','topup','grant','adjust')),
  reason      text NOT NULL,               -- model_usage/media_generation/payment_topup/usage_correction/payment_refund/chargeback/manual_adjust/seat_proration/sandbox_seconds/egress_bytes/workspace_bytes 等
  credits     numeric NOT NULL,            -- 有符号账户变动：负=扣减/占用，正=入账/释放/返还
  bucket_deltas jsonb NOT NULL,           -- {daily,monthly,granted,topup} 有符号分摊，Σ=credits，不允许省略
  model_id    text, input_tokens int, output_tokens int, cache_tokens int,
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, request_id, entry_type, reason)  -- 幂等：同请求多来源不互相冲突、跨租户不碰撞、重放不白嫖
);

CREATE TABLE byok_keys (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id  uuid NOT NULL,
  provider   text NOT NULL,
  key_cipher bytea NOT NULL,               -- KMS 信封加密
  key_version int NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, provider)
);
```

- 短期 model token：签名（内含 `tenantId/jti/maxCredits/exp`），`jti` 撤销存 Redis；`maxCredits` 为该 token 会话累计上限。
- 订阅生命周期状态机（对应 P1-14）：`active → past_due → dunning → suspended → canceled`，支付退款/拒付走 `refund + reason=payment_refund/chargeback` 负向 clawback；usage missing 或迟到 usage 的多扣修正走 `refund + reason=usage_correction` 正向返还，定义数据保留窗口。`AuthSubscriptionStatus` 枚举扩至含 `past_due/canceled`。
- 媒体计价（对应 P2-5）：新增 `media_tasks` 表（`task_id text` 统一类型、`status` 枚举）；`ModelCatalog` 补媒体计价列（固定 / per-image / per-second）。

---

## 7. 沙箱运行时契约（对应 D4/D5/D6/D7/D8/D9）

**gateway 内网 WS 桥（Cowork Service ↔ Pod）**：方法名见 D6。寻址 `chat.send { sessionKey, ... }`。

**egress allowlist（D8）**：
```yaml
# NetworkPolicy egress（default deny 之上显式放行）
- to: model-proxy Service      # 模型 token 代理（独立 Service，非 sidecar）
- to: cowork Service           # AskUser / Media / MCP bridge 回调
- to: kube-dns
- to: egress-proxy             # 唯一外网出口，审计
```

**配置变更→生命周期映射（D9，节选）**：

| 变更 | 处理 |
|---|---|
| 启用/停用技能 | 热 reload（最小子集）|
| 新增/删除 MCP server | 必须重建 Pod（drain→重建→续接）|
| 轮换 BYOK / 切 provider | 必须重建 Pod |
| IM 绑定变更 | 不影响沙箱（控制面处理）|

**受限续接（D9 / P1-9）**：gateway 会话/transcript 持久化边界须明确——若使用 Pod `/state` 保存 transcript，则该 `/state` 必须是可迁移/可恢复的运行时 state 卷并与工作区 PVC 的 `/workspace/state` 区分；否则必须声明 capsule 为可重放权威。evict/抢占给 SIGTERM grace 窗口 + capsule/工作区 flush 时序；in-flight turn「丢当前 turn 从 capsule 重放」。**AC-8 改为「至多丢当前 turn，历史与工作区零丢失」**。

---

## 8. 阶段门唯一对照表（对应 D13）

> 唯一权威；16 的必过测试、17 的 WBS、18 的风险准入门均对齐此表。废弃 P0–P3 / G-V / GV 别名。**PR-0~PR-4 scaffold/contract/db/deploy/PoC harness 是 V1 前置工程准入门（见 `19`），不作为第七个阶段门，也不计入 V1 PoC 周期。**

| 版本门 | 核心验收 | 必过测试（16） | 必清风险（18） |
|---|---|---|---|
| V1 可行性验证 | 真实 gVisor Pod 跑通一条 turn；RWX/PVC+S3 PoC；桥契约冻结；Config Sync golden；provider 直连封锁 + D8 egress 白名单 PoC；**gVisor 工作负载兼容矩阵（D4）** | 沙箱/存储/桥/配置/egress 均有实测证据 | R-OC-03、R-ISO-01、R-ISO-04、R-OC-01、R-STOR-01、R-SEC-04、R-OPS-01 |
| V2 单租户 Web 闭环 | 登录→发消息→流式→artifact | 契约测试（10 事件全覆盖）、单租户集成、WS 断连续传达标 | R-STREAM-01 |
| V3 多租户 Beta | Tenant/RBAC/**RLS 强制**、工作区 API、服务端 BullMQ 定时任务 | **跨租户越权必过（R-SEC-01 硬门）**、SaaS schema 迁移校验（Prisma migrate/DDL/RLS/幂等，R-DATA-01 硬门） | R-SEC-01、R-DATA-01 |
| V4 运行时强化 | Orchestrator、每会话 Pod、gVisor/Kata、NetworkPolicy、egress、预热、自愈 | 并发压测、沙箱逃逸、egress、冷启动、自愈；Sandbox 实测资源模型已回写 requests/limits | R-ISO-01、R-ISO-02、R-PERF-01、R-PERF-03 |
| V5 商业化生态 | 模型/ASR 代理计费、短期 model token、MCP/Skills 供应链、公开分享治理、桌面导入（含存量双读，可选） | 模型/ASR 上游计费不可绕过、stdio MCP 不在宿主执行、供应链门控、公开分享 abuse 治理、provider 故障切换演练 | R-COST-01、R-ISO-03、R-SEC-03、R-VENDOR-01 |
| V6 GA 运营 | 安全压测、混沌、告警回滚、SLO/SLA、状态页/客户支持、合规生命周期 | P0/P1 清零、DR/Chaos/回滚/on-call/状态页演练；SLA 计量同源于内部 SLO | R-COMP-01 + 全量 P0/P1 |

> R-DATA-01 澄清为两条独立门：**(a) SaaS schema 迁移校验 = V3 早硬门**；**(b) 桌面存量导入双读 = V5 可选门**。
