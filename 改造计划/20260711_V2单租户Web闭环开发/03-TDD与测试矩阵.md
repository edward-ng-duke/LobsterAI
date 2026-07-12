# TDD 与测试矩阵

## 1. 每个任务的 TDD 顺序

1. 从 `开发任务.md` 选一个 AC/用例 ID，先写最小失败测试并保留 Red 输出。
2. 只实现使该测试通过的最小行为；再补异常、边界、并发、安全分支。
3. Reviewer 逐项核对 Red 是否有效、Green 是否覆盖需求，而非只看最终绿灯。
4. Tester 在 Reviewer 通过后，从任务未覆盖角度新增测试；发现缺陷后回到 Developer→Reviewer→Tester 全循环。

## 2. 分层矩阵

| 层 | PR-0～4 | V1 | V2 | 硬断言 |
|---|---|---|---|---|
| 静态/单元 | workspace/依赖边界、registry、schema 检查器 | config 纯函数、manifest/策略解析 | auth claims、PG repository、bridge reducer、artifact sanitizer | 触碰纯逻辑分支 ≥80%，安全路径近 100% |
| 契约 | OpenAPI/AsyncAPI/codegen、10 stream 事件 | ticket/sinceSeq/gateway RPC golden | REST 错误信封、permission、bridge 双跑 | 附录 A ✅/部分✅ 100% 映射；无旧路径 |
| 集成 | PG/Redis/MinIO 最小 Testcontainers | 真实 Pod/PVC/S3/NetworkPolicy | OIDC stub/internal IdP、PG、OpenClaw WS、Redis Stream | 不允许仅 mock 证明 RLS/网络/流式 |
| E2E | 明示 blocked，Playwright 入库后启用 | PoC client，不冒充产品 E2E | Chromium/WebKit/Firefox 主链路 | 登录→turn→complete→artifact |
| 非功能 | Docker/Helm/SBOM | gVisor、egress、存储、资源 | 弱网、重连、重复帧、并发、CSP | 任一安全硬门失败即阻断 |

## 3. Corner-case 总集

- Auth：state/nonce/PKCE 错误、code 重放、refresh family 重放、轮换竞态、过期、撤销、错误 redirect URI、时钟偏差、禁用用户、内网 IdP 不可用。
- DB：空库/重复 migrate、citext/UUID 扩展缺失、事务回滚、并发 sequence、同时间游标、`main` logical_id、超长/Unicode、capsule 大对象、连接池上下文残留。
- WS：ticket 重放/过期/scope 越权、断在首帧/中段/complete 前后、sinceSeq 过旧、重复/乱序/未知事件、多 tab 订阅、取消竞态、背压、心跳超时。
- Runtime：镜像缺插件/native module、SIGTERM、OOM/crash、gateway ready 假阳性、gVisor 不兼容、只读 root、Secret 不落盘/日志、禁止公网和 metadata。
- Storage：小文件风暴、并发写、原子 rename、symlink/path traversal、NUL/盘符/编码穿越、PVC 断连重挂、S3 延迟/重复 complete、配额边界。
- Artifacts：空/损坏/超大图片、恶意 SVG/HTML、CSP 外链、iframe token 隔离、未知 MIME、旧资源缓存、失败不得静默展示旧内容。
- Bridge/UI：Electron-only 每一通道返回明确 unsupported；无 `window.electron` 初始化竞态；REST 401/403/404/409/413/429/500；刷新/后退、多标签页、locale zh/en。

## 4. 验收命令层级

每个任务只运行其相关快速测试还不够；交付前按阶段累计：

```bash
npm ci
npm run lint
npm run typecheck
npm test
npm run build
npm run compile:electron
npm run contracts:check
npm run prisma:validate
npm run supply-chain:check
npm run docker:build:check
npm run helm:lint
npm run poc:v1:check
npm run test:e2e
git diff --exit-code
```

不存在的命令由 P00 建立真实检查入口；当前阶段尚未引入的能力必须报告 `blocked/not-applicable` 并保持对应阶段 Todo 未完成，不得 exit 0 静默伪绿。集群测试额外记录实际执行命令、namespace、镜像 digest 和报告路径。

## 5. V1/V2 最终必过映射

| 门 | 测试证据 |
|---|---|
| V1.0 | Linux 可复现构建、镜像内容/密钥扫描、gateway health |
| V1.1 | gVisor 真实 turn + 工作负载兼容/性能矩阵 |
| V1.2 | 内网 allow + 公网/metadata/K8s API/DB/Redis/横向 deny |
| V1.3 | PVC/S3 一致性、并发、断连恢复、备选架构结论 |
| V1.4 | 10 事件、ticket、sinceSeq、全 route/channel registry |
| V1.5 | config golden 等价、workspace 文件归属 |
| V1.6 | go/no-go 记录与未清风险为零或明确 no-go |
| V2.1 | Playwright 主链路与可读 artifact |
| V2.2 | Electron-only 降级矩阵、Web 无 native 依赖崩溃 |
| V2.3 | 断线补发矩阵、complete 不丢不重 |
| V2.4 | 核心表 `tenant_id` 非空、单租户约束测试 |
| V2.5 | `logical_id=main` 与 UUID 双键往返测试 |

