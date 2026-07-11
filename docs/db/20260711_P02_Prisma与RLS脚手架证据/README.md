# P02 Prisma 与 RLS 脚手架证据

- 状态：`REVIEW_PENDING`（Reviewer Round 4）
- Developer：`/root/p02_developer`
- codeEvidenceSha：`352d0caaa1c0ea992f6a48ee8c698d56df25309c`
- code evidence-only commit：`2f8e33e42d12249470a3b800612338ac448d0751`
- stageEvidenceSha：`2f8e33e42d12249470a3b800612338ac448d0751`
- 环境：macOS arm64 / Node `v24.15.0` / PostgreSQL `17.10 (Debian 17.10-1.pgdg12+1)`
- 镜像：`postgres:17.10-bookworm@sha256:17b6c778de50f4bb9a878c36e736110fbcd9b7020377d6fdfdf20f7c0347e40a`
- P01 接受 SHA：`a6066c3138e4d6c0f36462b9ad3fb8e0877d3a28`
- P01 Tester 报告 SHA：`fc9f619fd46afe4622512c5d4168e220816f246a`
- contract：`1.0.0` / source hash `897bd39077d409e52a88e9efe89383380564812f494efb88fe09e2af6a1ed2c8`

## 证据链语义

报告不能把包含自身的提交 SHA 写进自身内容。本目录采用可机器验证的两段 evidence-only descendant 链：

1. 四份 code report 由 Round 5 精确 governance 边界实现 `352d0caa...` 原生 runner 生成，`report.sourceSha` 均等于该实现 SHA；该 source 的祖先包含 P03 最终产品提交 `f93fdd59...`，`2f8e33e4...` 只提交这些 raw report、manifest，并移除上一轮 stage snapshot。
2. 正式 `prisma:validate` stage 在 `2f8e33e4...` 上运行，stage report 的 `sourceSha` 等于该证据提交。
3. `validate-evidence.mjs` 用严格 schema 拒绝未知字段，核对每份报告内容 SHA-256 与 runner SHA-256，并要求 code/stage SHA 位于最终 HEAD 的 first-parent 链。
4. validator 从 source SHA 的下一提交起到 HEAD，逐个审计 first-parent commit；每个 commit 都与其唯一父提交做 `--name-status -z -M` 比较。A/M/D 路径和 R/C 的旧、新两端都必须在严格 allowlist，任何 merge commit 均 fail-closed。
5. mutation 测试覆盖 add、modify、delete、code→evidence rename、code→revert、merge 与 source 仅在 non-first-parent 可达。后续 revert 不能再洗掉历史代码提交。
6. P02 task 的开发/审核/测试记录，以及其他 V2 task 的同类记录使用精确 basename allowlist；`libs/`、`scripts/`、tests 和任意泛化 docs 路径仍不允许作为 evidence-only 变更。

### 外部信任边界

- 裸 `validate-evidence.mjs` 不构成合格证据，缺少 bootstrap attestation 时直接失败。
- active 入口先走 `evidence-trust-launcher.mjs`，要求外部固定的 bootstrap SHA-256；bootstrap 在 validator 加载前，对 codeEvidence Git blob 中的 validator、provenance、schema、package、launcher、P00 runner 与 gate manifest 做对比。
- P00 stage runner 先校验自身固定 digest，再校验 bootstrap/launcher 固定 digest；P02 stage 还必须接收协调者/CI 固定的 gate manifest digest。缺失或不匹配均在执行 inner command 前失败。
- stage report 同时记录 `runnerSha256`、`manifestSha256` 与 `expectedManifestSha256`，后两者必须相等并匹配当前固定 manifest。
- 四份 raw report 必须在 codeEvidence 之后恰好写入一次，并与首次 first-parent evidence commit 的 Git blob 一致；所以 raw report 与可写 manifest 协同重算 digest仍会失败。
- 可信根假设止于协调者/CI 已接受的 source SHA、P00 runner digest 与 gate manifest digest。本方案不声称能抵抗攻击者同时改写全部仓内代码和外部协调配置。

因此，本记录称“最终证据是实现 SHA 的 evidence-only descendant”，不声称报告与包含该报告的 commit 字面同 SHA。

## 原生报告

下列 JSON 均由 runner 原子写入 `.reports/` 后由 `snapshot-evidence.mjs` 逐字节复制；不是手工摘要结构：

| 文件 | 原生标识 | source SHA | 结果 |
|---|---|---|---|
| `contracts-preflight.json` | runId `e6c7b8ea-272a-42b8-ae50-e96642f34313` | `352d0caa...` | PASS |
| `preflight.json` | runId `a2d17b66-259c-4fe7-a51d-be188c309907` | `352d0caa...` | PASS；container removed |
| `integration.json` | runId `17184ecf-d751-4ec8-8569-8d7cf7be4b4f` | `352d0caa...` | PASS；24/24；skipped=0；container removed |
| `validation.json` | runId `7543b596-692a-4b5a-9b5b-27521b006e88` | `352d0caa...` | PASS；原生 `commands[]` 共 8 项 |
| `prisma-stage-gate.json` | invocationId `bf925a14-ae99-41e1-9aa0-dab7fbcda8b7` | `2f8e33e4...` | PASS；outer digests 一致 |

`evidence-manifest.json` 保存上述文件摘要、source SHA、runner 路径和 runner 摘要。当前实现与报告中的 generated Prisma client hash 均为 `c74a8965e3eef868a4da2641b86165d0ef2bd38f1bdd8ebbc93b4e74afe74441`。

## Reviewer Round 1 P1 修复

### AC12：tenant extension 接入真实 factory

- `createDatabaseFacade()` 现在把 `extendTenantClient(client, context.tenantId)` 的结果传给 facade，而不是只定义未使用的 extension。
- extension 对 `findMany/count/aggregate/groupBy/create/createMany/upsert/update/updateMany/delete/deleteMany` 强制 tenant scope；`update`、`updateMany` 和 `upsert.update` 中伪造的 `tenantId` 会被当前上下文覆盖。
- `tenant-extension.test.ts` 在独立 owner connection 中临时关闭 RLS，仅在该测试生命周期内验证应用层 extension；结束时恢复 `ENABLE ROW LEVEL SECURITY` 与 `FORCE ROW LEVEL SECURITY`。
- 动态覆盖既通过实际 factory facade，也直接调用 extended Prisma client。A 上下文的所有读写分支均不能读取、修改或删除 B 行；B-only fixture 最终仍存在。
- 显式 Testcontainers 集成套件为 21/21 PASS，`skipped=0`，cleanup `removed=true`。

### AC18：原生证据与 provenance

- 严格 `evidence-bundle.schema.json` 对所有嵌套对象使用 `additionalProperties: false`。
- 原生 validation 保留 `commands[]`，不再用手工 `commandExitCodes` 摘要代替 runner 输出。
- unknown-field、stale-source、detached-extension，以及 evidence 后 add/modify/delete/rename/revert/merge mutation 均失败。
- `prisma:validate:active` 同时执行实现验证与 committed evidence 校验；证据 bootstrap 与 core test 分离，避免循环依赖。

## 18 AC 证据映射

| AC | 主要证据 |
|---|---|
| 01 | contracts preflight 四重绑定 P01 accepted SHA、Tester SHA、contract version/hash |
| 02 | exact tag/platform/digest；Docker/平台/pull 失败均 `BLOCKED/2` |
| 03 | clean install 自动 generate；双次生成 hash 一致；native engine 不提交 |
| 04 | Tenant/Agent 真模型、snake_case、UUID、timestamptz 与 schema validate |
| 05 | A/B 的 tenant-local `main`、内部 UUID 不同、同租户重复 23505 |
| 06 | 唯一 recorded migration；空库及重复 deploy 均成功 |
| 07 | `citext` 安装与 `gen_random_uuid()` 动态检查 |
| 08 | schema/inventory/migration/live catalog 四方核对 |
| 09 | ENABLE+FORCE、USING=WITH CHECK、缺上下文 fail closed |
| 10 | app role 非 superuser、非 BYPASSRLS、非 owner，使用直接 app 连接 |
| 11 | 参数化 transaction-local tenant/user context；非法 UUID/注入串先拒绝 |
| 12 | safe package root、raw client import scan、真实 factory extension 与全操作动态覆盖 |
| 13 | 每次新 PostgreSQL 17 Testcontainer，`skipped=0`，cleanup failure 阻断 PASS |
| 14 | 原生 RLS CRUD 隔离；另在 RLS 暂停时独立证明应用层 extension 隔离 |
| 15 | commit/rollback/throw/same connection 与 A/B interleaved 池泄漏覆盖 |
| 16 | production seed guard、确定性 A/B seed、重复 seed 幂等 |
| 17 | `prisma:validate` 真 stage PASS；CI 独立 arm64 DB job，无软跳过 |
| 18 | strict raw schema、内容/runner hash、逐 first-parent commit 的 name-status evidence-only 审计 |

## Round 4 已执行验证

| 命令 | 结果 |
|---|---|
| `node scripts/db/validate.mjs` | exit 0；原生 validation runId `88a78d74-...` |
| P03 merge evidence integration | Red 2/2 → Green 2/2；codeEvidence 包含 accepted merge `43665ce1...` |
| Tester evidence boundary | exit 0；6/6 |
| external/bootstrap/outer boundary | exit 0；10/10（含双文件协同与 manifest+launcher 协同） |
| provenance/static mutation | exit 0；21/21，覆盖 add/modify/delete/rename/revert/merge/non-first-parent 与移除 bootstrap 入口 |
| `npm run test:db:unit` | exit 0；8 files / 74 tests |
| `npm run test:db:integration`（由 validation 调用） | exit 0；24/24，skipped=0 |
| `npm run prisma:validate` | exit 0；冻结 invocationId `bb9fab84-...`；集成重跑 `00329847-...`；外部 manifest digest 均匹配 |
| trusted evidence launcher | exit 0；code/stage/raw/provenance/outer digests PASS |
| `npm ci` | exit 0；lockfile clean install 与 Prisma postinstall generate 成功 |
| `npm run contracts:check` / `npm run test:contract` | exit 0；15/15 contract checks |
| `npm run typecheck` | exit 0 |
| changed-file ESLint / `npm run lint:saas` | exit 0；0 warning |
| `npm test` | exit 1；除 P03 exact-five evidence 文件外 206 files / 2199 passed / 1 skip；该文件 37 failed，见下方集成阻断 |
| `npx vitest run --exclude tests/deploy-supply-chain-evidence-files.test.ts` | exit 0；206 files / 2197 passed / 1 skip |
| `npm run build:saas` | exit 0；9 workspaces / 18 fresh artifacts |
| `npm run build` / `npm run compile:electron` | exit 0；仅既有 Vite/eval/chunk warning |

原生机器报告以本目录 JSON 与 manifest 为准。最终冻结证据链由 manifest 指向 `352d0caa...` 与 `2f8e33e4...`；implementation SHA 包含 P03 最终 resolver `f93fdd59...`、source-boundary 测试和 exact-five 角色记录的全部祖先；不声称报告与包含报告的提交自引用同 SHA。

### Round 5 协调者总表边界

- 当协调者修改权威总表后，旧 provenance 按预期拒绝；后续 revert 也因逐提交审计不能洗掉该历史，形成可复现 Red。
- 新例外只是完整 repo-relative 路径 `改造计划/20260711_V2单租户Web闭环开发/00-总体完成表.md`，且只接受 Git name-status `M`。不存在目录、basename 或 Markdown 后缀泛化允许。
- 真实临时 Git 历史 corner 固定普通修改可通过；删除、重命名到原本可允许的 task 记录、复制到相邻文档、相邻计划文档、嵌套同名和后缀伪装均 fail-closed；代码路径拒绝测试保持不变。

### P03 shared evidence 集成阻断（历史，已解除）

- P03 不依赖 exact-five raw 目录的 4 个 targeted 文件共 34 tests PASS；Docker/Helm static checker PASS。
- `tests/deploy-supply-chain-evidence-files.test.ts` 需要 ignored `.reports/supply-chain/20260712_PR3部署供应链证据`，共享 worktree 不存在该目录；36 项因 ENOENT 失败。
- 另 1 项正确发现 P03 product-source resolver 已把本 P02 `docs/db` evidence commit `613bbe91...` 当作镜像产品 source，而 accepted P03 evidence source 仍为 `187da9a...`。这会使 Reviewer/Tester 文档继续无意义推进 P03 source。
- P03 Developer 已将 resolver 收敛为实际 Docker image inputs；最终 product source 稳定为 `f93fdd59...`，exact-five invocation `5673b88b...` 在共享 worktree 存在，formal checker PASS。本轮因而以 `21e141d4...` 完成最后 rebaseline。

## 最终 rebaseline 回归

以 stage/docs clean commit `668dd0eff6216c18a01d11085e0c8c93c1eaee1b` 为起点执行；全部命令 exit `0`：

| 命令 | 结果 |
|---|---|
| P02 boundary/provenance/merge 四文件 targeted | 4 files / 32 tests PASS |
| `npm run test:db:unit` | 8 files / 74 tests PASS |
| `npm run test:db:integration` | 4 files / 24 tests PASS；runId `64a5c156-821d-419c-9e49-4c500bb380a5`；`skipped=0`；container removed |
| P03 四文件 targeted | 4 files / 74 tests PASS（旧 58 项基线后又增加 source-boundary corners） |
| P03 product-source 独立 targeted | 1 file / 19 tests PASS；docs-only 后仍解析 `f93fdd59...` |
| `node scripts/check-supply-chain.mjs` | PASS；57 assets / exact 5 image evidence；publish 诚实 `BLOCKED` |
| `node scripts/check-docker-build.mjs --static` | PASS；5 images |
| `npm run contracts:check` / `npm run test:contract` | PASS；15/15 contract checks |
| `npm run prisma:validate` | PASS；invocationId `ca6f78f9-6ef4-460e-bbeb-bb50ad1b6432` |
| `npm test` | 207 files PASS；2252 passed / 1 existing skipped；0 failed |
| `npm run typecheck` | PASS |
| P02 changed-file ESLint / `npm run lint:saas` | PASS；0 warning |
| `npm run build:saas` | PASS；9 workspaces / 18 fresh artifacts |
| `npm run build` / `npm run compile:electron` | PASS；仅既有 Vite/eval/chunk warning |

最终记录提交后再执行 trusted evidence validator 与关键 provenance 回归，确保角色文档提交只位于精确 evidence allowlist，任何后续产品代码变更仍 fail-closed。

## 已知非 P02 风险

- 根项目既有 axios/Electron/xlsx 等供应链债务不由 P02 伪装解决；破坏性升级留给 P03/专项任务。
- `npm ci` 显示根依赖树既有 22 项 audit finding（12 moderate、10 high）；本任务未越界执行破坏性 `audit fix --force`。
- 当前批准运行基线为 `linux/arm64` exact digest；未登记 amd64 digest 时 runner fail-closed，不降级使用浮动 tag。
