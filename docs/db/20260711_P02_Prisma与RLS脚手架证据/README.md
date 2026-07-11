# P02 Prisma 与 RLS 脚手架 Developer 证据

- 状态：`REVIEW_PENDING`
- Developer：`/root/p02_developer`
- 代码证据 SHA：`dc98a77d153fd24f8f8376f10909deaa302126fa`
- 环境：macOS arm64 / Node `v24.15.0` / npm `11.12.1` / Docker Engine `29.4.0`（OrbStack，Linux arm64）
- P01 接受 SHA：`a6066c3138e4d6c0f36462b9ad3fb8e0877d3a28`
- P01 Tester 报告 SHA：`fc9f619fd46afe4622512c5d4168e220816f246a`
- contract：`1.0.0` / source hash `897bd39077d409e52a88e9efe89383380564812f494efb88fe09e2af6a1ed2c8`
- PostgreSQL：`postgres:17.10-bookworm@sha256:17b6c778de50f4bb9a878c36e736110fbcd9b7020377d6fdfdf20f7c0347e40a`，实际 server `17.10 (Debian 17.10-1.pgdg12+1)`

## TDD 与实现提交

| 阶段 | commit | 证据 |
|---|---|---|
| Red | `be95c975` | 12/12 因 scripts/image/schema/migration/RLS/context/facade/真实容器/CI 目标缺失而失败 |
| Tooling | `ef187e60` | Prisma `6.19.3`、Testcontainers `12.0.4`、pg `8.22.0`、PG17.10 exact digest |
| Schema | `df18fae2` | Tenant/Agent、UUID+logical ID 双键、citext、migration、ENABLE+FORCE policy、seed |
| Safe access | `6fc5a211` | 受控 factory/facade、transaction-local tenant/user context、tenant scope extension |
| Integration | `802360a7` | 新容器 migrate/role/seed/RLS/池泄漏套件与 BLOCKED 语义 |
| Gate | `5dd0bba8` | Prisma PASS stage、静态 mutation checker、独立 arm64 container CI job |
| Corners | `4b20066e` | production seed guard、AgentDto `id=logical_id` 真实往返 |
| Fast loop | `3da264db` | 默认 Vitest 明确排除容器集成；显式 job 仍阻断 |
| Test stability | `b7e3a6d3` | 只放宽耗时 generated-consumer mutation 的单测 timeout，不改断言 |
| Evidence cleanup | `dc98a77d` | 所有 DB 报告绑定 HEAD；PG 容器删除失败会使报告失败 |

## 18 AC 证据映射

| AC | 主要证据 |
|---|---|
| 01 | `scripts/db/p02-baseline.json` + contracts preflight；接受 SHA、Tester SHA、version/hash 四重绑定 |
| 02 | `postgres-image.json` exact tag/platform/digest；平台不符、pull/daemon 失败均 `BLOCKED/2` |
| 03 | clean `npm ci` 自动 generate；两次生成 hash `c74a8965...` 相等；native engine 不提交 |
| 04 | `Tenant`/`Agent` 真模型、snake_case map、UUID/timestamptz、schema validate |
| 05 | 两租户 `main` 分别使用 `a000...001`/`b000...002`；同租户重复 23505；facade 返回 `id=main` |
| 06 | migration history 仅一条 completed；空库和重复 deploy 均 0 |
| 07 | `citext` available/installed；真实 `gen_random_uuid()` 返回 UUID |
| 08 | schema/inventory/migration/live catalog 三方核对；mutation 删除任一侧失败 |
| 09 | live `relrowsecurity=true`、`relforcerowsecurity=true`、USING=WITH CHECK；缺上下文 42704 |
| 10 | app role `rolsuper=false`、`rolbypassrls=false`、table owner=`p02_admin`；用 app 直连而非 SET ROLE |
| 11 | 参数化 `$1` + `set_config(..., true)`；tenant/user 均设置；非法 UUID/注入串先拒绝 |
| 12 | package exports 仅 safe root；apps raw client scan；全部 read/write/aggregate/upsert scope unit branches |
| 13 | Testcontainers 每 run 新 PG，`skipped=0`，Docker 缺失/平台/拉取失败非零 BLOCKED，cleanup removed=true |
| 14 | 不启用 Prisma extension 的 pg app client 证明跨租户 SELECT/INSERT/UPDATE/DELETE 被 RLS 拦截 |
| 15 | commit/rollback/throw/same connection、12 轮 A/B interleaved；false mutation 确实复现泄漏 |
| 16 | production guard、无公网址/secret/random；双次 seed 仍只有 A/B 两行 |
| 17 | `prisma:validate` PASS 真命令；CI 独立 `db-integration`，无 skip/`|| true`/continue-on-error |
| 18 | 42 DB unit + 16 integration + 2153 full tests；typecheck/lint/build 全绿；worktree clean |

## 稳定 HEAD 验证

| 命令 | 结果 |
|---|---|
| `npm ci` | exit 0；从 lockfile 安装并生成 Prisma client |
| `npm run contracts:check` | exit 0；stage PASS，source SHA `4b20066e...`（P02 contracts 未再改） |
| `npm run test:contract` | exit 0；15 contract checks PASS |
| `npm run prisma:generate` | exit 0；Prisma 6.19.3 |
| `npm run test:db:preflight` | exit 0；runId `07842da3-e55c-409d-89cb-0675973ccf08` |
| `npm run test:db:unit` | exit 0；42/42 |
| `npm run test:db:integration` | exit 0；16/16，runId `23213c88-868c-4bc4-9db1-a81002d47c1e` |
| `npm run prisma:validate` | exit 0；invocation `71d983fc-0195-4646-8066-3804fb2ea360`，source SHA `dc98a77d...` |
| `npm run typecheck` | exit 0 |
| changed-file ESLint + `npm run lint:saas` | exit 0，0 warning |
| `npm test` | exit 0；201 files，2153 passed，1 skipped（既有 skip） |
| `npm run build:saas` | exit 0；9 workspaces / 18 fresh artifacts |
| `npm run build` | exit 0；仅既有 Vite/chunk warning |
| `npm run compile:electron` | exit 0 |
| `git diff --exit-code` | exit 0 |

机器报告快照见同目录 JSON。运行时权威报告由各命令原子写入 `.reports/db/` 与 `.reports/saas-gates/`；缺 Docker、平台不符、拉取失败或 cleanup 失败不会产生 PASS。

## 已知非 P02 风险

- `npm audit --omit=dev` 仍报告根项目既有 axios/Electron/xlsx 等供应链债务；本次新增 Prisma/pg/Testcontainers 未出现在这些 production finding 中。P02 不以破坏性 `audit fix --force` 越界升级桌面依赖，供应链处置继续归 P03/专项升级。
- 当前可执行基线固定 `linux/arm64`；runner 对 `amd64` 或任何未登记平台 fail-closed。CI 使用 `ubuntu-24.04-arm`，未提供 amd64 digest 时不会降级使用浮动 tag。
