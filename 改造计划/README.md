# LobsterAI 桌面端 → 多租户 SaaS Web 应用 · 改造计划

> 本文件夹是一份**面向开发落地**的完整改造计划：把 LobsterAI（Electron + React 桌面端 AI Agent 应用）改造为**公网多租户 SaaS Web 应用**，几乎所有功能都 Web 化。
>
> 本目录共 **24 份 Markdown**：1 个 README + **20 篇正文（00-19）** + **3 篇附录（A/B/C）**，约 1.3 万行。每篇都尽量遵循「现状(带 `path:line` 依据) → 目标 → 步骤 → 接口/schema → 验收标准 → 风险」的闭环，并配有 mermaid 图。
>
> **⚠️ 权威裁决层**：2026-07-08 评审后新增 `附录C-决策基线与接口契约总纲.md`，一次性拍死此前跨文档悬而未决/矛盾的关键决策（RLS 是否强制、gVisor/Kata、挂载单位、gateway RPC 名、计费四桶、阶段门命名等），并订正正文对现状源码的错误断言与过时计数。**凡任何文档（含本 README §4）与附录 C 冲突，以附录 C 为准。**

---

## 1. 从哪里开始读

| 你是… | 建议阅读顺序 |
|---|---|
| **决策者 / 立项评审** | `00`（执行摘要）→ `17`（路线图/工作量）→ `18`（风险）→ `13`（功能取舍） |
| **架构师** | `00` → `01`（现状）→ `02`（目标架构）→ `07`（沙箱，最难一章）→ `14`（安全总纲） |
| **技术负责人 / 开工执行** | `19`（开工前脚手架冻结）→ `17`（路线图）→ `16`（测试验收）→ `附录C`（决策基线） |
| **前端** | `01` → `03`（前端与传输层桥）→ `附录A`（IPC→REST/WS 映射）→ `12`（Artifacts） |
| **后端** | `04`（服务拆分/API）→ `05`（认证多租户）→ `06`（数据迁移）→ `09`（模型代理/计费）→ `10`（MCP/技能）→ `11`（定时任务） |
| **平台 / SRE** | `07`（运行时编排）→ `08`（工作区存储）→ `15`（部署/可观测）→ `11`（调度） |
| **安全 / 合规** | `14`（安全总纲）→ `05`（认证隔离）→ `07`（沙箱）→ `16`（渗透/验收） |
| **术语不清时** | 随时查 `附录B`（术语表 + 分角色阅读指南） |

新读者请**先读 `00-总览与执行摘要.md`**，它是全套文档的入口与导航。

---

## 2. 关键决策（全套文档一致遵守）

- **部署形态**：多租户 SaaS（公网、多用户共享云端、按租户隔离）。
- **后端**：全部自建新后端，**不依赖现有 youdao 云**（账号 / 模型代理 / 计费 / 存储 / HTML share / 技能市场 / 更新均重建）。
- **V1-V6 GA 主线范围（做）**：核心对话 / Agent / Artifacts / Skills / MCP + 文件工作区读写 + 定时任务 + **认证多租户** + **模型代理与计费（含 ASR 上游代理与 `asr_transcription` 账务）**。其中 **第一版 V1 是技术可行性验证版**，不是商业 v1。
- **GA 后续**：IM 渠道、第三方 OAuth 代持（GitHub Copilot / OpenAI Codex device-code）。
- **明确不做**：computer-use 桌面自动化、后台虚拟机 / 用虚拟机开浏览器。
- **推荐技术栈**：复用 React SPA（Vite，静态托管 + CDN）+ 与 `window.electron` 同接口的浏览器桥；传输 REST(HTTP) + WebSocket(流式)；后端 Node.js + TypeScript（NestJS）；DB PostgreSQL + Prisma（`tenant_id` + **强制 RLS `FORCE`**，见附录 C D2）；缓存 / 队列 / 广播 Redis + BullMQ；连接池 PgBouncer(transaction 模式，一等组件)；对象存储 S3 兼容；运行时隔离 Kubernetes 每会话沙箱 Pod（gVisor 默认 / Kata 兼容档回退，见附录 C D4）+ 每租户 PVC；鉴权 OAuth2/OIDC + JWT；可观测 OpenTelemetry + Prometheus/Grafana/Loki；CI/CD GitHub Actions + Helm。
- **接口契约事实源**：REST=OpenAPI 3.1、WS=AsyncAPI 2.6，落 `libs/shared/contracts`，三方（后端 DTO / 前端桥 / 契约测试）从同源生成；**附录 A / 04 仅作导航，字段级以 contracts 为权威**（附录 C D1）。
- **WS 鉴权**：REST 使用短时 access token；WebSocket 通过 REST 申请一次性短期 ticket，连接建立后首帧校验并消费 ticket，不直接使用长效 JWT 建连，也不把 token 放 URL query。
- **容器改造计划融合口径**：原「一容器一整套 Electron + Xvfb/noVNC + 本地 SQLite 卷」方案已吸收进本计划的 Sandbox 设计。可复用的是 Linux/OpenClaw runtime 镜像构建、单卷/HOME 状态侦察、资源密度、优雅停机、入口认证和安全风险；不采用的是把 noVNC 桌面托管作为最终产品形态。GA 主线仍以纯 Web SPA + 后端服务 + 每会话 OpenClaw Sandbox Pod 为准。

范围的**权威冻结基线**见 `13-功能取舍与降级清单.md`。

---

## 3. 文档清单

### 正文
| # | 文档 | 一句话 |
|---|---|---|
| 00 | [总览与执行摘要](00-总览与执行摘要.md) | 决策者必读：目标架构图、分版本路线图、Top 风险、工作量粗估、文档导航 |
| 01 | [现状架构深度调研（知己）](01-现状架构调研.md) | 进程模型 / IPC 面 / 流式机制 / `window.electron` 耦合 / OpenClaw 运行时 / SQLite / 认证现状 / 功能可迁移性分级 |
| 02 | [目标架构与技术选型](02-目标架构与技术选型.md) | 组件图 / 部署拓扑 / 逻辑服务职责边界 / 逐项技术选型 / 一次对话端到端时序图 |
| 03 | [前端与传输层改造](03-前端与传输层改造.md) | `window.electron` → 同形 Web 桥（REST+WS），最大化复用 React SPA；含 i18n 落地 |
| 04 | [后端服务拆分与 API 设计](04-后端服务与API设计.md) | IPC handler 域映射（口径见附录C B9，无「259」）/ `main.ts` 抽取策略 / REST 约定 / WebSocket 流式协议 / 并发一致性 |
| 05 | [认证与多租户账户](05-认证与多租户账户.md) | 自建 OAuth2/OIDC + JWT、loopback → 标准 Web 重定向、`tenant_id` + RBAC、应用层过滤 + Postgres RLS 双层隔离 |
| 06 | [数据模型迁移](06-数据模型迁移.md) | SaaS Postgres schema/RLS/Prisma 设计、桌面 SQLite 可选导入映射、`tenant_id` 回填、高写表分区、导入双读校验 |
| 07 | [OpenClaw 运行时编排与沙箱隔离（最难一章）](07-OpenClaw运行时编排与沙箱隔离.md) | 本地 ws gateway → 每会话 K8s 沙箱 Pod 编排器、生命周期、config sync、预热容量、gVisor、自愈 |
| 08 | [文件工作区与对象存储](08-文件工作区与对象存储.md) | 每租户持久工作区（PVC 权威 + 对象存储镜像）、文件服务 API、签名 URL 预览、路径安全、配额清理备份 |
| 09 | [模型代理与计费](09-模型代理与计费.md) | 统一模型/ASR 上游代理、多 provider 抽象、BYOK、预扣 + 结算闭环、多层熔断、媒体生成端到端、运营侧计费 |
| 10 | [MCP 与技能（Skills/Kits）改造](10-MCP与技能改造.md) | stdio/sse/http 三态、沙箱内运行 stdio、`mcpCommandPolicy` 白名单、供应链资产清单、对象存储 + DB 元数据、强制安全扫描门控 |
| 11 | [定时任务调度](11-定时任务调度.md) | 本地 cron → 服务端 BullMQ 多租户调度、触发拉起沙箱执行、幂等重试、Web 通知 |
| 12 | [Artifacts 与预览改造](12-Artifacts与预览改造.md) | 预览网关（沙箱域名 + 签名 URL + 严格 CSP + iframe 隔离）、对象存储、HTML share 自建 |
| 13 | [功能取舍与降级清单](13-功能取舍与降级清单.md) | **范围冻结基线**：每项功能 保留 / 改造保留 / 降级 / 后续 / 不做 的权威大表 |
| 14 | [安全、合规与多租户隔离（安全总纲）](14-安全合规与多租户隔离.md) | 威胁模型、七层隔离、跨租户三红线、SSRF/CSP 权威、密钥管理、合规删除/导出、渗透验收清单 |
| 15 | [部署、运维与可观测性](15-部署运维与可观测性.md) | K8s/Helm、镜像清单（含 OpenClaw runtime 云化）、CI/CD、OTel+Prometheus+Grafana+Loki、HPA、备份 DR、SLO |
| 16 | [测试策略与验收标准](16-测试策略与验收标准.md) | 测试金字塔、契约测试、跨租户越权必过用例、SaaS schema 迁移校验、桌面导入双读、流式补发、压测基线、阶段准入门 |
| 17 | [分版本路线图与工作量估算](17-分阶段路线图与工作量估算.md) | **路线图权威**：第一版到第六版的任务级 WBS、旧 M0-M9 映射、依赖、关键路径、人月分解、团队组成 |
| 18 | [风险登记册](18-风险登记册.md) | 24 条风险总表、Top 风险深谈、阶段准入门绑定、风险治理机制 |
| 19 | [开工前补件与工程脚手架冻结](19-开工前补件与工程脚手架冻结.md) | 当前仓库尚无目标云化脚手架；V1 前必须冻结/创建 monorepo、apps/libs、contracts、Prisma、Docker、Helm、CI、codegen、package manager、tsconfig/project references；明确第一个 PR 是 scaffold PR |

### 附录
| # | 文档 | 一句话 |
|---|---|---|
| A | [IPC 通道 → REST/WS 接口映射清单](附录A-IPC通道与接口映射.md) | 逐通道把现有 Electron IPC（invoke/send）映射到 REST 端点与 WebSocket 频道，前后端联调落地清单（**字段级契约以 `附录C`/`libs/shared/contracts` 为权威，本表仅导航**）|
| B | [术语表与阅读指南](附录B-术语表与阅读指南.md) | 术语定义（Cowork/OpenClaw/沙箱 Pod/预热容量/租约/胶囊/BYOK/RLS 等）+ 索引 + 分角色阅读路线 |
| **C** | [**决策基线与接口契约总纲**](附录C-决策基线与接口契约总纲.md) | **权威裁决层**：D1–D16 拍死决策 + 源码订正表（核对 2026-07-08）+ 契约事实源政策 + 身份 DDL/RLS/计费/沙箱 schema + 阶段门唯一对照表 |

---

## 4. 单一事实源（编辑文档时勿回退这些口径）

以下数据/口径在全套文档中已统一，**修改时请以“权威文档”为准，避免再次出现跨文档矛盾**：

| 事项 | 统一口径 | 权威文档 |
|---|---|---|
| **跨文档决策与源码订正** | **一切关键决策/契约/计数订正以附录 C 为准**（RLS 强制、gVisor/Kata、挂载单位、gateway RPC 名、计费四桶、阶段门命名、auth token 存储等） | **`附录C`** |
| RLS 是否强制 | **强制**：所有 tenant-scoped 表 `ENABLE + FORCE` + 每请求 `SET LOCAL app.tenant_id/app.user_id`；应用层 Prisma extension 并存。**删除全部「可选 RLS」表述** | `附录C` D2 / `05` / `06` |
| SQLite 活跃业务表数 | **16 张**（主库 `sqliteStore.ts` 13 + IM `imStore.ts` 2 + `metaStore.ts` 1）；`scheduled_tasks`/`scheduled_task_runs`/`cowork_user_memories`（后者仅测试表）为历史遗留/迁移期表，**不计入**；迁移导出须含 `cowork_session_capsules` | `06` / `附录C` §2-C |
| 定时任务调度权威 | **目标(SaaS)= 服务端 BullMQ + Postgres**（沙箱内 OpenClaw cron 禁用/不下发）；**现状 = 本地 gateway cron** —— 两种口径勿混写 | `11` |
| `webContents.send` 计数 | `src/main` 内 `.send(` **调用点 ≈ 51**；其中 `webContents.send` **≈ 36**；**去重后事件通道 ≈ 29** —— 引用时区分“调用点”与“去重通道”（核对 2026-07-08） | `附录A` / `附录C` §2-B14 |
| `cowork:stream:*` 事件数 | **10 个**（原「9 个」漏 `cowork:stream:goal`）；PR-1 必须新增 `CoworkStreamChannel` 注册表并与 `IElectronAPI`/`ElectronBridge.onStream*`、AsyncAPI 双向断言；落地前以 `preload.ts` 的 `onStream*` + `main.ts` runtime forwarder 为核对基线，禁字面量 grep | `附录C` §3.2 |
| IPC handler 数 / `window.electron` 调用 | handler：`main.ts` 内 217、全 `src/main` ≈283（**无「259」口径**）；`window.electron` 实测 **481 处 / 72 文件**，components 直连过半（非收口 services） | `附录C` §2-B9/B10 |
| Gateway token | `crypto.randomBytes(24).toString('hex')` = **24 字节随机熵，渲染为 48 个十六进制字符**（勿写“48 字节”） | `07` |
| 路线图定义 | 以 **`17` §1.1 的第一版 V1 到第六版 V6** 为权威；旧 M0-M9 仅按 `17` §1.2 映射理解；**V1 前置 scaffold/contract/db/deploy/PoC harness 以 `19` 为准，不计入 V1 PoC 周期**；`00` 为概览 | `17` / `19` |
| 第三方 OAuth 代持 | **GA 后续**（GA 主线仅平台托管 key + 用户自带 BYOK API key；不含 Copilot/Codex device-code 代持） | `09` / `13` / `附录A` |

---

## 5. 结论摘要

- **纯 SPA 可行**：渲染层与主进程只经 `window.electron` 单一桥通信，但现状并未全部收口于 `src/renderer/services/*`；用 **1:1 同接口形状**的 Web 桥（REST + WebSocket）覆盖整张 `window.electron` 表面后，现有 React UI 可最大化复用。
- **最难的是运行时隔离（`07`）**：把“本机一个 OpenClaw ws gateway”改造成“每会话一个 K8s 沙箱 Pod + 编排器”，并做多租户隔离加固（gVisor/Kata、网络出口管控、每租户 PVC）。这是关键路径与主要不确定性来源。
- **承重章节完整**：数据迁移(`06`)、模型代理与计费(`09`)、安全总纲(`14`)、部署可观测(`15`)、测试验收(`16`)、路线图(`17`) 均已落地，可支撑立项 / 排期 / 安全评审。
- **工作量粗估**：约 **30–45 人月**，分 **第一版 V1 到第六版 V6** 推进（详见 `17`）。V1 先做可行性验证，V6 才是 GA 上线运营版。
