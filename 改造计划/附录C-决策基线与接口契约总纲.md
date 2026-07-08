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
- **落地要点**：**附录 A / 04 降级为「导航与任务清单」，字段级一律以 `libs/shared/contracts` 为权威**；事件与通道全集从 `src/shared/*/constants.ts` 的 `as const` 对象穷举导出，**禁止用字面量 grep 数通道**（已因此漏掉 `cowork:stream:goal`，见 §2-B13）。代表性 schema 见 §3。
- **影响**：04、05、08、09、11、16、附录 A。

### D2 · RLS = 强制（不是「可选」）

- **决策**：**所有 tenant-scoped 表一律 `ENABLE ROW LEVEL SECURITY` + `FORCE`**，策略 `USING/WITH CHECK (tenant_id = current_setting('app.tenant_id')::uuid)`。每请求在事务内 `SET LOCAL app.tenant_id / app.user_id`，事务归还前 `RESET`。应用层 Prisma tenant extension 与 RLS **并存**（纵深，不是二选一）。删除全部「可选 RLS」表述。
- **理由**：00/02/05/06/10/14 反复写「可选/敏感表可选/每表 FORCE」，06 文档内部即矛盾（§3.2 可选 vs §5.4 每表 FORCE），而 02/17 越权门又把「RLS 拒绝跨租户」当验收判据——判据依赖一个未拍死的开关，无法验收。
- **落地要点**：会话变量集 = `app.tenant_id` + `app.user_id`（后者供身份表登录/切租户查询）；连接层走 PgBouncer **transaction 模式**并配 `SET LOCAL`（非 `SET`）；登录首查用 `current_setting('app.tenant_id', true)` 容忍 NULL。参考实现见 §5。
- **影响**：00、02、05、06、09、10、14、15、README。

### D3 · 身份表 DDL 的唯一 owner = 06；字段权威 = 本附录 §4

- **决策**：`users / tenants / memberships / identities / refresh_tokens / auth_codes / oauth_clients` 的字段级 DDL 由 **本附录 §4** 给出，`06` 为叙述 owner 并内联引用，`05` 只保留鉴权语义与 policy，**不再互指**。
- **理由**：05 §9 指向 06、06 指回 05，两端互指、内容落空，身份 Prisma schema 无法生成，P0 第一步停摆。
- **影响**：05、06。

### D4 · gVisor 为默认 runtime，Kata 为兼容档回退（V1 用兼容矩阵决定回退面）

- **决策**：标准租户会话 `runtimeClassName: gvisor`；为「重/兼容」资源档保留 `runtimeClassName: kata`，由 `resourceClass` 路由规则选择。**V1 PoC 必须产出 gVisor 工作负载兼容+性能矩阵**（npx spawn 子进程 / node / shell / npm 解包 / 常用 stdio MCP / 技能脚本 的成功率与开销），矩阵不达标的工作负载路由到 Kata。
- **理由**：02/15/18 把它留成二选一未决，07/14 又单方面把 gVisor 定为 GA 默认却无验证——而 OpenClaw 执行面恰踩 gVisor 最弱处（用户态内核下的密集子进程 spawn 与文件 IO）。两条路 RuntimeClass/YAML/内核假设完全不同，Pod spec 无法落地。
- **落地要点**：Pod spec 用变量 `runtimeClassName`，由编排器按档位注入；矩阵回退判据写进 07 与 16 的 V1 准入门。
- **影响**：02、07、15、18、16。

### D5 · 工作区挂载单位 = 工作区（`workspace-{agentId}`），单写者租约

- **决策**：挂载单位统一为**工作区**（现状 OpenClaw state-dir 即 `workspace-{agentId}` / main 为 `workspace-main`），映射到每租户 PVC 的子路径。`session : workspace` 为多对一。**同一工作区同一时刻只允许一个 RW 挂载**（Pod），并发访问经分布式租约（Redis + PVC 上的 lease 文件）串行化，其余请求排队或降级只读。
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
- **落地要点**：`permissionDismiss` 等所有反向命令 payload 补 `sessionId` + `tenantId`。
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

- **决策**：额度四桶（日/月/赠送/充值）为权威，**Redis 侧用 4 个 key（或一个 hash 的 4 字段）**，跨桶按优先级原子扣减用 Lua；单计数器方案作废。预扣公式落到字段级；量纲统一 `credits = Σ(tokens_i × unit_price_i) ÷ 1000`（**修正原文漏 `÷1000` 的 1000× 放大**）；幂等唯一键 = `(tenant_id, request_id, entry_type)`，`request_id` 由服务端签发（不复用客户端值，避免跨租户碰撞与重放白嫖）。
- **理由**：09 §3.2 四桶与 §5.2 单计数器互斥、Lua 无定义、预扣公式把 input/output/cache 折叠成单一 `price/maxTokens` 不可编码、量纲漏 `÷1000`、幂等键不含 `tenant_id` 且复用客户端 requestId。
- **落地要点**：schema 见 §6。`costMultiplier` 现状是 **per-model**（`renderer/services/auth.ts` 的 `Model.costMultiplier`，前端「积分消耗倍率」直接展示），09 若引入 per-plan 倍率必须说明二者叠加顺序与前端取值来源，不得默认「前端零改」。
- **影响**：09。

### D13 · 阶段门唯一命名 = V1–V6，废弃 P0–P3 / GV 别名

- **决策**：全套文档阶段门统一用 **V1–V6**。废弃 `P0–P3`、`GV1–GV6` 别名。越权门、迁移双读门、egress 门等的版本时点，以本附录 §8 的唯一对照表为准，16/17/18 就地对齐。
- **理由**：三套命名并存互不映射，越权/迁移门时点在 16/17/18 间差 1–2 个版本，写 CI gate 的 agent 不知实现 3 段还是 6 段门。
- **影响**：16、17、18、附录 B、README。

### D14 · 定时任务权威 = 服务端 BullMQ + Postgres（沙箱内 OpenClaw cron 禁用）

- **决策**：目标态调度权威是**服务端 BullMQ + Postgres**，沙箱内 OpenClaw cron 禁用/不下发。**订正附录 B 中「定时任务权威 = OpenClaw gateway cron」的导航结论**（那是现状口径，被误当目标结论）。
- **理由**：附录 B 与 README §4 / 06 / 11 / 17 完全相反，会让 Scheduler Service 整块做反。
- **影响**：11、17、附录 B、README。

### D15 · 复用口径 = 按文件分级，`coworkStore` / `openclawConfigSync` 属「必须重写/移植」

- **决策**：`04 §3.2 / 02 §4.3` 的「A 类直接复用」拆成三级——**lift-as-is（纯 `libs/` 逻辑）/ 需适配 / 必须重写**。`coworkStore.ts`（3044 行，`import better-sqlite3` + `electron`，~68 处 `db.prepare`）→ 必须重写为 Prisma/PG；`openclawConfigSync.ts`（3502 行，`import { app } from 'electron'` + 约 25 个 live getter）→ 必须去 Electron 化移植为 Node 服务。
- **理由**：把深度耦合 SQLite/electron 的模块标为「直接搬」，与「不得把 electron-only API 带进后端」自相矛盾，派「搬」和派「重写」的 agent 拿到相反指令。
- **落地要点**：17 为这两项各新增独立 Story（`coworkStore→PG 重写`、`Config Sync Service 化` 各 15–25pd）。
- **影响**：00、02、04、17。

### D16 · 预览子资源鉴权 = 会话级签名 Cookie 前缀；CSP 放行沙箱自身脚本

- **决策**：文件型 HTML 预览的相对子资源（`./style.css`、`img/a.png`）用**会话级签名 Cookie / 令牌前缀**鉴权（作用域限沙箱预览路径），不用 per-file 签名。网关 CSP 的 `script-src / style-src` **加入沙箱 host（self）** 并补 `worker-src blob:`、`base-uri`、`form-action`。
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
| A6 | 扫描门控：severity `critical`(50 分) → 阻断，普通租户无法启用 | `riskScoreToLevel(50)='high'`，单条 data-exfiltration 得 high 而非 blocked，「普通租户无法启用」实为假 | `riskScoreToLevel` |
| A7 | 定时任务 `Stop` 为既有能力 | `Stop` handler 现状是**空实现**（`return { result:false }`），OpenClaw 无 stop API；需作为全新能力设计取消机制 | scheduled task stop handler |
| A8 | `commandSafety` 白名单 / `managed_npx_only` / `requireScan` 为现状/复用 | 现有 `src/main/libs/commandSafety.ts` 只做**危险命令分级**（语义不同）；白名单模式是全新概念，新模块须改名（如 `mcpCommandPolicy.ts`）避免撞名 | `libs/commandSafety.ts` |

### 2-B 计数 / 规模系统性过时（订正为核对值）

| # | 原文档口径 | 订正值（2026-07-08） | 证据 |
|---|---|---|---|
| B9 | IPC handler「合计 259 / main.ts 200 / main.ts 单文件 259」三套并存 | `main.ts` 内 `ipcMain.handle 211 + on 6 = 217`；全 `src/main` `handle 277 + on 6 ≈ 283`；**无一等于 259**。42 个 `im:*` handler **全内联在 main.ts**（非独立域模块）。04 §9「259 全部完成分类」的 DoD 分母作废，改引 §8 契约清单 | `rg "ipcMain\.handle"`；`rg -c "ipcMain\.handle\('im:" main.ts` = 42 |
| B10 | `window.electron` ~446 处 / 74 文件 | 实测 **481 处 / 72 文件**（且组件直连过半，见 A4） | `rg -o` |
| B11 | patch「共 61 / v2026.6.1 有 15」 | 实测**版本内 65 个（v2026.3.2:9 / v2026.4.5:1 / v2026.4.8:9 / v2026.4.14:26 / v2026.6.1:20）+ 1 个游离顶层 `openclaw-llm-request-debug-log.patch` = 66**；游离 patch 不被脚本应用，须交代归属 | `ls scripts/patches/**` |
| B12 | 测试基数「151 个 Vitest 用例」 | 实测 **175 个 `.test.ts` 文件**（文件数≠用例数）；用作迁移/验收基线会漏 | `rg -l --glob '*.test.ts'` |
| B13 | `cowork:stream:*` 共 **9** 个事件 | 实为 **10** 个——漏 `cowork:stream:goal`（`CoworkIpcChannel.StreamGoal`，preload `onStreamGoal`、`main.ts` 发送、`cowork.ts` 订阅）。runtime 侧另有 `goalUpdate/sessionStopped`，事件名是 `contextUsageUpdate`（非 `contextUsage`） | `preload.ts:onStreamGoal`；`cowork.ts:260` |
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

### 3.1 权限响应（对应 D2 权限流 / P0-2）—— 对齐真实 `PermissionResult`

```ts
// POST /cowork/sessions/:id/permission  —— 单端点同时承接工具授权与 AskUser
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

### 3.2 流式事件全集（对应 D1 / B13）—— **10 个**，从 constants 穷举

| 事件（`CoworkIpcChannel.*`）| AsyncAPI channel | payload 关键字段 |
|---|---|---|
| `cowork:stream:delta` | `cowork/stream/delta` | `{ sessionId, requestId, text }` |
| `cowork:stream:tool` | `cowork/stream/tool` | `{ sessionId, requestId, tool, input }` |
| `cowork:stream:permission` | `cowork/stream/permission` | `{ sessionId, requestId, permission }` |
| `cowork:stream:thinking` | `cowork/stream/thinking` | `{ sessionId, requestId, text }` |
| `cowork:stream:contextUsage` | `cowork/stream/context-usage` | 事件名实为 `contextUsageUpdate` |
| `cowork:stream:goal` **（原漏）** | `cowork/stream/goal` | `{ sessionId, goal }` |
| `cowork:stream:done` | `cowork/stream/done` | `{ sessionId, requestId }` |
| `cowork:stream:error` | `cowork/stream/error` | `{ sessionId, requestId, errorKey }` |
| `cowork:stream:abort` | `cowork/stream/abort` | `{ sessionId, requestId }` |
| （runtime）`goalUpdate/sessionStopped` | 内部 | 由 adapter 归一 |

契约测试须加静态断言：**`CoworkIpcChannel` 中每个 `Stream*` 通道都必须在 AsyncAPI 中有映射**（防再次漏事件）。

### 3.3 会话创建语义（对应 P2-1）

`cowork:session:start` 现状是 **create + 首 prompt + 立即生成** 的原子操作（prompt 必填），不存在「创建空闲会话」；后续轮次走独立 `cowork:session:continue`。契约据此：

```
POST /cowork/sessions            body: { agentId, prompt, cwd?, ... }  -> { sessionId, ... }  // 首 prompt 必填，立即开跑
POST /cowork/sessions/:id/turns  body: { prompt, ... }                 -> { requestId }        // = continue
```

### 3.4 文件 / 上传（对应 P1-7）

- 统一错误码：`413` 拆为 `PAYLOAD_TOO_LARGE`（文本过大 → 改用 URL 拉取）与 `QUOTA_EXCEEDED`（`507`，超配额）。
- 大文件方向定死为 **S3 直传 → 异步落 PVC**，落地失败/重试/幂等写进同步表状态机。
- 配额「当前用量」权威读**单一来源**（Redis 预留计数，原子 `INCRBY`/回补），DB `size_bytes` 仅对账。
- `tree` 定义 cursor 编码、depth 语义、稳定排序键 `(type, name, id)`。
- 桥 shim 形状对齐现状：`saveInlineFile({ dataBase64, fileName, mimeType, cwd }) -> { success, path }`（25MB 上限）、`readFileAsDataUrl(...) -> { success, dataUrl }`——桥须把新响应适配回旧契约形状，避免打断 `ArtifactPanel`/`CodeRenderer`。

---

## 4. 身份与租户表 DDL（对应 D3；06 为 owner，此为字段权威）

> Postgres 方言；所有 tenant-scoped 表额外 `ENABLE ROW LEVEL SECURITY` + `FORCE`（见 §5）。时间列 `timestamptz`，主键 `uuid default gen_random_uuid()`。

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
  role       text NOT NULL CHECK (role IN ('owner','admin','member')),
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
    await tx.$executeRawUnsafe(`SET LOCAL app.tenant_id = '${ctx.tenantId}'`);
    await tx.$executeRawUnsafe(`SET LOCAL app.user_id  = '${ctx.userId}'`);
    return fn(tx);
  });
}
```

- 连接层 **PgBouncer transaction 模式**：必须用 `SET LOCAL`（事务级），不可用 `SET`（会话级，池化下串租户）。
- Prisma tenant extension 仍在应用层强制注入 `where tenant_id`（纵深，覆盖 `upsert / createMany / aggregate / groupBy` 的注入漏洞）。
- 连接数预算：`RLS 每请求事务 × HPA 水平副本 × 连接池` 会撞 `max_connections`，PgBouncer 须列为一等部署组件（见 15）。

---

## 6. 计费引擎 schema（对应 D12）

```
Redis（每租户，原子）：
  quota:{tenantId}:daily     quota:{tenantId}:monthly
  quota:{tenantId}:granted   quota:{tenantId}:topup
预扣（Lua，按优先级 daily→monthly→granted→topup 扣减，跨桶补差，允许负余额熔断）：
  hold = ceil( maxTokens_est × unit_price_out ÷ 1000 )   -- 量纲修正
结算：真实 usage 回补差额，写 ledger（幂等键唯一约束）。
```

```sql
CREATE TABLE billing_ledger (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   uuid NOT NULL,
  request_id  text NOT NULL,               -- 服务端签发
  entry_type  text NOT NULL CHECK (entry_type IN ('hold','settle','refund','topup','grant')),
  credits     numeric NOT NULL,            -- 负=扣，正=入
  model_id    text, input_tokens int, output_tokens int, cache_tokens int,
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, request_id, entry_type)  -- 幂等：跨租户不碰撞、重放不白嫖
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
- 订阅生命周期状态机（对应 P1-14）：`active → past_due → dunning → suspended → canceled`，退款走 `refund` 分录 clawback，定义数据保留窗口。`AuthSubscriptionStatus` 枚举扩至含 `past_due/canceled`。
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

**无损续接（D9 / P1-9）**：gateway 会话/transcript 持久化边界须明确——`/state` 上 PVC 或声明 capsule 为可重放权威；evict/抢占给 SIGTERM grace 窗口 + capsule/工作区 flush 时序；in-flight turn「丢当前 turn 从 capsule 重放」。**AC-8 改为「至多丢当前 turn，历史与工作区零丢失」**。

---

## 8. 阶段门唯一对照表（对应 D13）

> 唯一权威；16 的必过测试、17 的 WBS、18 的风险准入门均对齐此表。废弃 P0–P3 / GV 别名。

| 版本 | 门 ID | 核心验收 | 必过测试（16） | 必清风险（18） |
|---|---|---|---|---|
| V1 可行性验证 | G-V1 | 真实 gVisor Pod 跑通一条 turn；RWX/PVC+S3 PoC；桥契约冻结；Config Sync golden；模型出网封锁 PoC；**gVisor 工作负载兼容矩阵（D4）** | 沙箱/存储/桥/配置/egress 均有实测证据 | R-OC-01、R-OC-02 证伪 |
| V2 单租户 Web 闭环 | G-V2 | 登录→发消息→流式→artifact | 契约测试（10 事件全覆盖）、单租户集成 | — |
| V3 多租户 Beta | G-V3 | Tenant/RBAC/**RLS 强制**、工作区 API、服务端 BullMQ 定时任务 | **跨租户越权必过（R-SEC-01 硬门）**、迁移双读校验（SaaS schema，R-DATA-01 硬门） | R-SEC-01、R-DATA-01 |
| V4 运行时强化 | G-V4 | Orchestrator、每会话 Pod、gVisor/Kata、NetworkPolicy、egress、预热、自愈 | 并发压测、沙箱逃逸、egress、冷启动、自愈 | R1、R2 |
| V5 商业化生态 | G-V5 | 模型网关计费、短期 model token、MCP/Skills 供应链、公开分享治理、桌面导入（含存量双读，可选） | 计费不可绕过、stdio MCP 不在宿主执行、供应链门控 | R5、供应链 |
| V6 GA 运营 | G-V6 | 安全压测、混沌、告警回滚、SLO、合规生命周期 | P0/P1 清零、DR/Chaos/回滚/on-call 演练 | 全量 |

> R-DATA-01 澄清为两条独立门：**(a) SaaS schema 迁移校验 = V3 早硬门**；**(b) 桌面存量导入双读 = V5 可选门**。
