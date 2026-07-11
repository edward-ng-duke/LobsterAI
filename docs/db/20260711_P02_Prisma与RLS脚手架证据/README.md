# P02 Prisma 与 RLS 脚手架证据

- 状态：`REVIEW_PENDING`（Reviewer Round 3）
- Developer：`/root/p02_developer`
- codeEvidenceSha：`3d8eb58b3fcbe7efd4d84788658cf6b350862cd2`
- code evidence-only commit：`37c7a4819fafd9a62c52202c022604024c8a3c26`
- stageEvidenceSha：`37c7a4819fafd9a62c52202c022604024c8a3c26`
- 环境：macOS arm64 / Node `v24.15.0` / PostgreSQL `17.10 (Debian 17.10-1.pgdg12+1)`
- 镜像：`postgres:17.10-bookworm@sha256:17b6c778de50f4bb9a878c36e736110fbcd9b7020377d6fdfdf20f7c0347e40a`
- P01 接受 SHA：`a6066c3138e4d6c0f36462b9ad3fb8e0877d3a28`
- P01 Tester 报告 SHA：`fc9f619fd46afe4622512c5d4168e220816f246a`
- contract：`1.0.0` / source hash `897bd39077d409e52a88e9efe89383380564812f494efb88fe09e2af6a1ed2c8`

## 证据链语义

报告不能把包含自身的提交 SHA 写进自身内容。本目录采用可机器验证的两段 evidence-only descendant 链：

1. 四份 code report 由实现提交 `3d8eb58b...` 的原生 runner 生成，`report.sourceSha` 均等于该实现 SHA；`37c7a481...` 只提交这些 raw report、manifest，并移除上一轮 stage snapshot。
2. 正式 `prisma:validate` stage 在 `37c7a481...` 上运行，stage report 的 `sourceSha` 等于该证据提交；后续提交只允许本目录和 P02 Developer 开发记录发生变化。
3. `validate-evidence.mjs` 用严格 schema 拒绝未知字段，核对每份报告内容 SHA-256 与 runner SHA-256，并要求 code/stage SHA 位于最终 HEAD 的 first-parent 链。
4. validator 从 source SHA 的下一提交起到 HEAD，逐个审计 first-parent commit；每个 commit 都与其唯一父提交做 `--name-status -z -M` 比较。A/M/D 路径和 R/C 的旧、新两端都必须在严格 allowlist，任何 merge commit 均 fail-closed。
5. mutation 测试覆盖 add、modify、delete、code→evidence rename、code→revert、merge 与 source 仅在 non-first-parent 可达。后续 revert 不能再洗掉历史代码提交。

因此，本记录称“最终证据是实现 SHA 的 evidence-only descendant”，不声称报告与包含该报告的 commit 字面同 SHA。

## 原生报告

下列 JSON 均由 runner 原子写入 `.reports/` 后由 `snapshot-evidence.mjs` 逐字节复制；不是手工摘要结构：

| 文件 | 原生标识 | source SHA | 结果 |
|---|---|---|---|
| `contracts-preflight.json` | runId `cf242ecc-c3ff-4d2b-a53c-ceb8d2ff082d` | `3d8eb58b...` | PASS |
| `preflight.json` | runId `400e274b-de63-4ca7-bf7c-0a9f3efd2e15` | `3d8eb58b...` | PASS；container removed |
| `integration.json` | runId `2e80be88-6437-492f-bd75-0653bb1d9882` | `3d8eb58b...` | PASS；skipped=0；container removed |
| `validation.json` | runId `c0a7cccd-d312-4d2c-8094-6af2e256739c` | `3d8eb58b...` | PASS；原生 `commands[]` 共 8 项 |
| `prisma-stage-gate.json` | invocationId `fa89ea5b-d583-4827-92f6-0ed6e60cede8` | `37c7a481...` | PASS |

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

## Round 3 已执行验证

| 命令 | 结果 |
|---|---|
| `node scripts/db/validate.mjs` | exit 0；原生 validation runId `c0a7cccd-...` |
| provenance mutation | exit 0；20/20，覆盖 add/modify/delete/rename/revert/merge/non-first-parent |
| `npm run test:db:unit` | exit 0；62/62 |
| `npm run test:db:integration`（由 validation 调用） | exit 0；21/21，skipped=0 |
| `npm run prisma:validate` | exit 0；invocationId `fa89ea5b-...` |
| `node scripts/db/validate-evidence.mjs` | exit 0；code/stage provenance PASS |
| `npm ci` | exit 0；lockfile clean install 与 Prisma postinstall generate 成功 |
| `npm run contracts:check` / `npm run test:contract` | exit 0；15/15 contract checks |
| `npm run typecheck` | exit 0 |
| changed-file ESLint / `npm run lint:saas` | exit 0；0 warning |
| `npm test` | exit 0；202 files，2173 passed，1 个既有 skip |
| `npm run build:saas` | exit 0；9 workspaces / 18 fresh artifacts |
| `npm run build` / `npm run compile:electron` | exit 0；仅既有 Vite/eval/chunk warning |

原生机器报告以本目录 JSON 与 manifest 为准。冻结证据链由 manifest 指向 `3d8eb58b...` 与 `37c7a481...`；不声称报告与包含报告的提交自引用同 SHA。交付前在 stage/docs commit `0419575d...` 上再次执行 active gate，临时 invocationId `3ecd9048-0ffa-4196-bf50-1932ad72f8a1` PASS；该重跑只更新 ignored `.reports`，没有覆盖冻结 snapshot。

## 已知非 P02 风险

- 根项目既有 axios/Electron/xlsx 等供应链债务不由 P02 伪装解决；破坏性升级留给 P03/专项任务。
- `npm ci` 显示根依赖树既有 22 项 audit finding（12 moderate、10 high）；本任务未越界执行破坏性 `audit fix --force`。
- 当前批准运行基线为 `linux/arm64` exact digest；未登记 amd64 digest 时 runner fail-closed，不降级使用浮动 tag。
