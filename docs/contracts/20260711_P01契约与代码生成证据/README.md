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
| 16 breaking diff | PASS | route/field/error/event 删除、enum 收窄、新 required 均报警；additive optional 通过；无效 base exit 2 BLOCKED；`cde584c0` 经显式 pre-contract allowlist 使用 frozen canonical bootstrap PASS，不把该提交中的 Generic/fake spec 当成公开契约 |
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

## Round 4 Reviewer 退回修复（2026-07-11 16:25 +0800）

- 验证实现基线：`aae6cc8223eba44fe46ef30c16c656a1ef022ec4`；Red commit `94d4cdef`在修复前得到 20/20 failed，Green 后 20/20 PASS。
- route location：RouteRegistry 分离 path/query/body schema；OpenAPI 现生成 sessions/messages/html-share/task-run/file/tree 的 query parameters 及类型化 path parameters；path/body equality 用 `x-lobster-path-body-equality` 锁定。
- operation policy：独立 `RoutePolicyExpectations` 对 login/token/refresh、session read/write、file read/write、billing read/write、task list/create 做 exact error-set equality，不从 RouteRegistry/OpenAPI 自证。
- D11/canonical DTO：password 必须 credentials+PKCE/CSRF；cookie refresh 无 body；非浏览器 refresh 仅 OAuth `refresh_token` grant；HTML `html|artifact`、plugin `Record<string, unknown>`、schedule `at/every/cron` 均进 Zod 与 OpenAPI。
- ticket/D12：OpenAPI arrays 含 `uniqueItems: true`且复合 resource 唯一性有稳定扩展；billing breakdown 含 daily/monthly limit、granted total、topup balance，三项兼容 credits 字段由 breakdown 唯一派生并有可审计公式 metadata。
- 最新计数：schema `216`；route `158`；channel `32`；inventory `184/184`；bridge `321`；Cowork `10`。
- 最新 hash：source `3e9c1cac73c37407c43512e2c0e292aa250f524aebe0571820a8a788039a3fe9`；output `d75f6768a566d6735ee9501c0de70f769fdba9f6924e7112143ac48a4e07c1ed`；inventory `a89dcc7d51bc33e282adaf51d4885f2fb8451c00573956fc951f214c77cb1c02`。
- gate invocationId：`c3dc0efb-240e-4f3a-82e3-ce7900f9e72b`；本地 CI runId 不可用，未伪造。
- 最终总门：`contracts:check`、15/15 `test:contract`、workspace typecheck、zero-warning changed-file ESLint、192-file Vitest（2064 passed / 1 skipped）、SaaS 9-workspace/18-artifact build、renderer build、Electron compile 均 exit 0。
- 两个原子生成破坏性 mutation 已在 `304e9755` / `aae6cc82` 迁入独立临时仓库，不再与全仓并行测试竞争真实 generated 目录。

## Round 5 Reviewer 退回修复（2026-07-11 16:59 +0800）

- Red `3716b670`：12 tests 中 11 failed / 1 passed；Green 后 12/12 PASS，覆盖 scheduled runs query、真实 schedule bridge shape、158-route 独立 error policy 双向分母、19 条假错误与 task stop 专用错误。
- 两条 runs 路由的 OpenAPI query 均为 `cursor/endDate/limit/startDate/status`；schedule 只接受真实 `at`、`everyMs/anchorMs`、`expr/tz/staggerMs` 判别联合。
- `ExpectedRouteOperationIds` 独立显式列出 158 个 operation；checker 要求 expectation/registry 双向相等并逐项 exact errors。GET/DELETE 与 `QUOTA_EXCEEDED/TASK_LIMIT_EXCEEDED/PAYLOAD_TOO_LARGE/STORAGE_QUOTA_EXCEEDED` 交集为 0。
- task stop 精确含 `NO_RUNNING_TASK_RUN/CANCEL_NOT_OWNED/CANCEL_FAILED`，不含 `TASK_LIMIT_EXCEEDED/SESSION_BUSY/IN_PROGRESS`。
- 最新 counts/hash：schema `216`；route `158`；channel `32`；inventory `184/184`；bridge `321`；Cowork `10`；source `a7672b976c10ea78a8b18518ddb4ab98f02c417d62e7182937acacbb6f47fe39`；output `99a3b2a1ad3927447330925bab2ee87887952678f290d757ee5a933298a6e9bb`。
- 最终总门：`contracts:check`、15/15 `test:contract`、typecheck、changed-file ESLint、193-file Vitest（2076 passed / 1 skipped）、SaaS 9-workspace/18-artifact build、renderer build、Electron compile 均 exit 0。Gate invocationId `7f64369b-88f4-41aa-a24a-2dadb6849fe0`；本地无 CI runId。

## Round 6 Reviewer 退回修复（2026-07-11 17:22 +0800）

- Red `53a2383f`：15 tests 中 10 failed / 5 passed；Green 后 15/15 PASS。禁止 default/nullish profile，覆盖 no-input global/status、collection empty-list、item existence 与 domain action 语义。
- expectation 中 158 个 operation 均显式 `operationId -> PolicyProfile`，无 fallback；Actual `routes.ts` 保持独立分配，不导入 expectation；checker 逐 operation 双向 exact equality。
- 全量语义结果：35 个无 path GET 的 item-only `NOT_FOUND` 已清零；37 个无输入路由的 `VALIDATION_FAILED` 已清零；parameterized item GET 保留 `NOT_FOUND`；query collection 保留 validation 但无 `NOT_FOUND`。
- 最新 counts/hash：schema `216`；route `158`；channel `32`；inventory `184/184`；bridge `321`；Cowork `10`；source `897bd39077d409e52a88e9efe89383380564812f494efb88fe09e2af6a1ed2c8`；output `583f7b819dd84131362d6d8190ce3ea34ae68b82cc8524ab15e1c9a04937e748`。
- 最终总门：`contracts:check`、15/15 `test:contract`、typecheck、changed-file ESLint、80/80 targeted、194-file Vitest（2091 passed / 1 skipped）、SaaS 9-workspace/18-artifact build、Renderer build、Electron compile 均 exit 0。Gate invocationId `8f620cb0-bde6-4d41-8eb9-96d56798f560`；本地无 CI runId。

## Round 7 Tester 退回修复（2026-07-11 17:48 +0800）

- Red 直接采用独立 Tester commit `4af5d7ee`：10 tests 中 6 PASS / 4 FAIL；三个 formal path mutation 和 pre-contract bootstrap 确定性失败，未复制同类测试。
- `4d1e4fd2` / `9a95a446`：formal path 拒绝明文/percent-encoded dot segment、编码 slash/backslash、重复斜杠、反斜杠、query/hash/control 字符；保留 `{param}`、canonical cancel 和既有 colon-action 精确诊断。
- `e9149751`：删除早期 Generic/fake bootstrap spec；`policy.json` 显式 allowlist `cde584c0` 为 pre-contract commit，并绑定受版本控制的空 canonical OpenAPI/AsyncAPI bootstrap。非 allowlist ref 不再静默 fallback：缺契约或坏 ref 为 BLOCKED/2，真实契约 ref 仍执行 breaking 比较。
- 最终：Tester 10/10 PASS；Tester + 旧 Reviewer targeted 90/90；contracts 15/15；Vitest 195 files / 2101 passed / 1 skipped；typecheck、SaaS 9/18、Renderer、Electron 均 exit 0。Gate invocationId `60cc2acf-242a-468a-8ded-1cb72c55b329`；契约 counts/hash 未因 checker/bootstrap 修复变化。
