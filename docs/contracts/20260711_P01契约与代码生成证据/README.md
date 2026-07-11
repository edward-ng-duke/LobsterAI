# P01 契约与代码生成证据

## 运行元数据

- Developer 验证基线：`191170a9726356779bbb5bd5c56a20ced33ae8d0`
- 时间：`2026-07-11T06:11:20Z` / `2026-07-11 14:11:20 +0800`
- 环境：macOS arm64，Node `v24.15.0`，npm `11.12.1`
- 本地 gate invocationId：`5150c6f0-b7cf-4892-935f-ea0e19eb4b5a`
- CI runId：本地不可用，待 Reviewer/远端 CI 补证；未伪造远端结果。
- contract version：`1.0.0`
- source hash：`23cd3a93acf62f509d5dc397eedcfde45743c61366e30018da35c93b98d2bb9a`
- output hash：`938632af5ec833ef6d7240018076196ccd73004f6d3548f045b06b7a13c06969`
- inventory hash：`6625d36440f3787aecaea3ecebbf221b768a912d2bcbf052aa7316dabfde6413`
- counts：schema `103`；REST route `161`；Async channel/message `32`；附录 A expected/inventory `184/184`；Electron bridge unique leaf `321`；Cowork stream `10`。

## Red 证据

首个 Developer commit `54fff820` 在 P00 基线上执行：

```text
npx vitest run tests/contracts/p01-red.test.ts
exit 1; 5 tests failed
- contracts:check = P00/NOT_APPLICABLE/78
- 13 个 registry/spec/generated/checker 文件缺失
- CoworkStreamRegistry（含 goal）缺失
- route-negative checker 缺失
- test:contract 脚本缺失
```

失败均由目标行为缺失触发，不是语法或环境失败。后续 mutation 测试分别证明：移除任一附录 A 分母行、删除 AsyncAPI `goal`、加入冒号 action、手改生成物、删除/收窄契约字段以及缺失 breaking base ref 均非零退出。

## 18 AC Green 追踪

| AC | 状态 | 主要证据 |
|---|---|---|
| 01 激活门 | PASS | `contracts:check` status=`PASS`, exit `0`，report 绑定 source SHA、invocationId、runner hash |
| 02 schema 源 | PASS | 103 个 Zod exports；strict/union/required mutation 通过 |
| 03 route 注册表 | PASS | 161 route；operationId/method+path 无重复；0 orphan |
| 04 附录 A 全量 | PASS | Markdown 独立分母 184 = inventory 184；missing=extra=0；逐域计数进入 checker report |
| 05 路径规范 | PASS | 旧/无版本/冒号 action 负向全集拒绝；canonical cancel/static/node 接受 |
| 06 错误注册表 | PASS | 稳定 code metadata；未知 code 拒绝；全部 4xx/5xx 引用统一 envelope |
| 07 OpenAPI 3.1 | PASS | Swagger Parser 0 error；Zod-to-OpenAPI 生成 3.1；161 路由全值相等 |
| 08 AsyncAPI 2.6 | PASS | AsyncAPI Parser 0 error；32 message 无 orphan；独立 ASR channel |
| 09 Cowork 10 事件 | PASS | IPC/topic/wire/payload/AsyncAPI/bridge 双向一致；10 valid + 10 invalid fixtures |
| 10 桥全表面 | PASS | TypeScript compiler API 比对 IElectronAPI 与 321 unique leaf；preload `satisfies ElectronBridge`；Electron compile 0 |
| 11 ticket/control | PASS | body 仅 sessions/resources；7 种 control；cursor/lastSeq/JWT/tenantId/空 sinceSeq 拒绝 |
| 12 envelope/续传 | PASS | seq 仅 string；data 必填；ISO emittedAt；错误表含 unsupported event/stream gap |
| 13 关键 DTO | PASS | start prompt、continue requestId、PermissionResult 判别联合、cursor/goal/capsule schema |
| 14 V5 边界 DTO | PASS | model/config/pricing/media/ASR/billing 契约存在；node route 标 unsupported + 501；无 provider/ledger/网络实现 |
| 15 生成可复现 | PASS | clean→临时文件→atomic rename；两次生成一致；header/stale/hand-edit checks |
| 16 breaking diff | PASS | route/field/error/event 删除、enum 收窄、新 required 均报警；additive optional 通过；无效 base exit 2 BLOCKED；`cde584c0` bootstrap PASS |
| 17 消费方 codegen | PASS | openapi-typescript 生成 API/Web/bridge types；workspace typecheck 0；无反向 app import |
| 18 CI/总回归 | PASS（本地） | workflow 锁定 generate/check/clean diff；下列总门全绿；远端 CI runId 待补 |

## 最终命令结果

| 命令 | 结果 |
|---|---|
| `npm ci` | exit 0 |
| `npm run contracts:generate` | exit 0；counts/hash 如上 |
| `npm run contracts:check` | exit 0；stage=P03 下 P01 gate 仍为 PASS |
| `npm run test:contract` | exit 0；15/15 focused checks PASS |
| `npm run typecheck` | exit 0 |
| P01 touched-file ESLint（`--max-warnings 0`） | exit 0 |
| `npm test` | exit 0；188 files passed；2016 tests passed；1 skipped |
| `npm run build:saas` | exit 0；9 workspaces / 18 fresh artifacts |
| `npm run build` | exit 0 |
| `npm run compile:electron` | exit 0 |
| `git diff --exit-code && git diff --cached --exit-code` | exit 0 |

构建保留两类既有非阻断警告：Vite 的动态/静态 import chunk 提示，以及第三方 `lottie-web` 的 `eval` 提示；未由 P01 引入业务运行时代码。`npm rebuild` 还提示部分依赖 install scripts 尚未纳入 allowScripts 清单，属于供应链门的后续持续治理项，不影响本次 contracts 开发期工具离线锁定。

## 回滚与 Reviewer 关注点

- 整体回滚顺序：CI/gate → consumers/bridge → OpenAPI/AsyncAPI/generated → registry/schema/dependencies；源和生成物必须同退。
- `CONTRACT_BASE_REF` 无效或外部 base 不可读取时固定 `BLOCKED/2`，不得改成 PASS。
- 本任务未实现 controller/service/provider/ASR 上游/BYOK ledger/quota，也未添加伪 handler。
- Reviewer 应至少独立重跑：删 `goal`、手改生成物、冒号路径、删除附录 A 行、breaking field 五个 mutation。

## Round 2 Reviewer 退回修复（2026-07-11 15:29 +0800）

- 验证基线：`200c36943f4fb50b7a32a8e8e7d43ec7ece19130`；Node `v24.15.0`，npm `11.12.1`。
- Red：`abf478e5` 初始 9/9 failed；Green 后扩展为 10/10 PASS，覆盖 Reviewer 五项 P1 与原子 staging 故障注入。
- 最新计数：schema `103`；route `158`；channel `32`；inventory `184/184`；bridge `321`；Cowork `10`。
- 最新 hash：source `2d771c6e7552895d65d036854afbd676ce25660cf2a79844a68419175cddf394`；output `8e2e6f43c14cbf5c9173bcb2f7202fcf622d589fec3956aed43f0abe2226f24d`；inventory `a89dcc7d51bc33e282adaf51d4885f2fb8451c00573956fc951f214c77cb1c02`。
- 总门：`npm ci`、generate/check/test:contract/typecheck、changed-file lint、189-file Vitest、SaaS 9-workspace build、renderer build、Electron compile 均 exit 0。
- 关键变化：无虚构 REST；逐 operation status/security/errors；三注册表双向 target；Electron 命名类型不再擦除为 `unknown`；Cowork 10 四方 payload；递归 breaking diff；无删除窗口的 atomic publish 与 stale 拒绝。

## Round 3 Reviewer 退回修复（2026-07-11 15:54 +0800）

- Red：`e19e31a3` 初始 6/6 failed；Green 后 11/11 PASS，覆盖占位 schema、显式 operation policy、ticket scope 与 D12 billing。
- 字段级契约：`OperationRequest/OperationResponse` export 与 route identity 均为 0；改名后的旧占位结构同样由 checker 拒绝。新增 htmlShare/BYOK/model config/skills/plugins/tasks/runtime/list valid-invalid matrix。
- operation policy：158 条 route 源码逐项声明 auth、success status、error set；`/auth/refresh` 使用 `refreshCookie` security，login 包含 credential error，model proxy/config check=200、stream=202。
- D12：余额四桶 `daily/monthly/granted/topup`；delta 可为有符号数但必须同号且总和等于 ledger credits；billing account 同时冻结 breakdown 与 `creditsRemaining/creditsLimit/creditsUsed`。
- 最新计数/hash：schema `209`；route `158`；channel `32`；inventory `184/184`；bridge `321`；Cowork `10`；source `f3505cbb20ad6fa6a5445621e340efed7ab216c6b84a88f1e31fde9dfb67a2cf`；output `c84d95d7c924dcb3b81b3b905860c61bb262d4f67603ef8d9f7874b67885985a`。
- 总门：contracts 15/15、targeted 33/33、workspace typecheck、changed-file lint、190-file Vitest、SaaS 9-workspace build、renderer build、Electron compile 均 exit 0。
