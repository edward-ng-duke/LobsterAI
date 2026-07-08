# Artifacts 与预览改造

> 本文档用途：说明 LobsterAI 从 Electron 桌面端迁移到多租户 SaaS Web 应用后，Artifacts（产物）解析、渲染与预览子系统的改造方案。适合读者：负责前端 Artifacts 面板、后端预览 / 分享服务、以及安全沙箱设计的工程师。阅读本文前建议先读 `00-总览与执行摘要.md`（整体目标）、`02-目标架构与技术选型.md`（技术栈），预览安全部分与 `14-安全合规与多租户隔离.md` 强绑定，对象存储细节见 `08-文件工作区与对象存储.md`，接口映射清单见 `附录A-IPC通道与接口映射.md`。

---

## 1. 本章范围与结论速览

Artifacts 是 Cowork 会话中 AI 生成或工具产出的"可展示成果"（网页、图表、图片、视频、文档等）。桌面端的实现深度依赖本地文件系统与本地 HTTP 服务器，是 Web 化改造的重灾区之一。

本章要解决的核心问题：

1. **解析层**（`artifactParser.ts`）大多是纯前端逻辑，可直接复用，但去重身份键 `file:*` 依赖本地路径，需改为对象存储 key。
2. **渲染层**（各 `*Renderer.tsx`）分两类：
   - 纯前端渲染（`svg` / `mermaid` / `code` / `markdown` / `text` / 部分 `document`）→ 基本原样保留。
   - 依赖本地资源的渲染（`html` 文件、`image` / `video` 本地文件、`document` PDF/PPTX 本地文件）→ 必须改为签名 URL + 服务端沙箱域名。
3. **本地 HTTP 预览服务器**（`htmlPreviewServer.ts`）→ 由服务端"预览网关"（独立沙箱域名 + 签名 URL + 严格 CSP + iframe 隔离）替代。
4. **local-service**（本地起服务扫描）→ GA 主线降级隐藏；可选走租户 Pod 端口反向代理（GA 后续增强，本章给出取舍）。
5. **HTML share**（现走 youdao 云）→ 自建分享服务替代（本章 §7）。

### 类型改造总览表

| Artifact 类型 | 桌面端渲染方式 | Web 目标方案 | 改造量 |
|---|---|---|---|
| `html`（文件） | 本地 HTTP server + iframe（`allow-scripts`+全权限） | 预览网关沙箱域名签名 URL + iframe（严格 CSP + 严格 sandbox） | 高 |
| `html`（inline，AI 生成） | `srcDoc` + `sandbox="allow-scripts"` | 保留 `srcDoc`，收紧 sandbox；大内容改走 blob/对象存储 | 中 |
| `svg` | 前端渲染（需净化） | 前端保留；文件型 SVG 经净化后展示或经预览网关 | 低 |
| `image` | 本地文件 → dataURL / 本地 URL | 对象存储签名 URL（`<img src>`） | 中 |
| `video` | 本地文件 URL | 对象存储签名 URL（`<video src>` / Range 支持） | 中 |
| `mermaid` | 前端 mermaid.js 渲染 | 纯前端保留，零改造 | 无 |
| `code` | 前端高亮渲染 | 纯前端保留 | 无 |
| `markdown` | 前端 markdown 渲染 | 纯前端保留；图片引用改签名 URL | 低 |
| `text` | 前端文本渲染 | 纯前端保留 | 无 |
| `document`（PDF/DOCX/XLSX/PPTX） | pdf.js（前端）/ 本地 HTTP + pptx-preview UMD | PDF 前端 pdf.js 拉签名 URL；PPTX 前端库或服务端转 PDF | 高 |
| `local-service` | 展示本地服务 URL / 端口扫描 | GA 主线降级；可选 Pod 端口代理 | 降级 |

---

## 2. 现状：桌面端 Artifacts 架构

### 2.1 端到端数据流

```mermaid
flowchart LR
  A[OpenClaw 工具输出 / AI 文本] --> B[artifactParser.ts<br/>解析 + 去重]
  B --> C[artifactSlice / coworkSlice<br/>Redux 状态]
  C --> D[ArtifactPanel.tsx]
  D --> E[ArtifactRenderer.tsx<br/>按 type 分发]
  E -->|html 文件| F[HtmlRenderer<br/>FileBasedHtmlRenderer]
  E -->|html inline| G[HtmlRenderer<br/>InlineHtmlRenderer srcDoc]
  E -->|document| H[DocumentRenderer<br/>pdf.js / pptx-preview]
  E -->|svg/mermaid/code/md/text| I[纯前端 Renderer]
  E -->|image/video| J[Image/VideoRenderer]
  F -->|createPreviewSession| K[htmlPreviewServer.ts<br/>本地 127.0.0.1 HTTP]
  H -->|createOfficePreviewSession| K
  D -->|分享按钮| L[htmlShare/* → youdao 云]
```

### 2.2 关键代码位点

| 关注点 | 文件 | 说明 |
|---|---|---|
| 类型枚举 | `src/renderer/types/artifact.ts:1` | `ArtifactTypeValue`（10 种）+ `PREVIEWABLE_ARTIFACT_TYPES`（`src/renderer/types/artifact.ts:17`）；注意 `code` 不在 previewable 集合内 |
| 解析 / 路径归一 | `src/renderer/services/artifactParser.ts:7` | `normalizeArtifactFilePath` 处理 `file://` / `localfile://` / `MEDIA:` 前缀 |
| 去重身份键 | `src/renderer/services/artifactParser.ts:50` | `getArtifactIdentityKeys`：`file:{type}:{path}` / `url:{type}:{url}` / `name:{type}:{name}` |
| 去重优先级 | `src/renderer/services/artifactParser.ts:69` | `shouldPreferArtifact`：file 协议 < 远程 URL < content，`createdAt` 兜底 |
| 分发 | `src/renderer/components/artifacts/ArtifactRenderer.tsx:23` | `switch (artifact.type)` |
| HTML 文件渲染 | `src/renderer/components/artifacts/renderers/HtmlRenderer.tsx:24` | `FileBasedHtmlRenderer` 调 `createPreviewSession` → iframe |
| HTML inline 渲染 | `src/renderer/components/artifacts/renderers/HtmlRenderer.tsx:112` | `InlineHtmlRenderer`：`srcDoc` + `sandbox="allow-scripts"`（`:127`） |
| Document 渲染 | `src/renderer/components/artifacts/renderers/DocumentRenderer.tsx` | PDF 用 pdf.js（`:373` worker），PPTX 用本地 preview server iframe（`:529`, `:561`） |
| local-service 渲染 | `src/renderer/components/artifacts/ArtifactRenderer.tsx:42` | 仅显示 `artifact.url || artifact.content`（占位） |
| 本地预览服务器 | `src/main/libs/htmlPreviewServer.ts` | `127.0.0.1:随机端口`，sessionId + token 鉴权 |
| HTML share 客户端 | `src/main/libs/htmlShare/htmlShareClient.ts` | 打包上传 youdao 云，返回 `shareId` + 公开 URL |
| HTML share 打包 | `src/main/libs/htmlShare/htmlSharePackager.ts` | zip 打包目录，大小/文件数/扩展名白名单限制 |
| 公开分享 URL | `src/main/libs/endpoints.ts:35` | `getHtmlSharePublicBaseUrl` → `{serverApiBase}/s` |
| 本地服务扫描 | IPC `localWebServices:list`（`main.ts`） | 探测 `preferredPorts` 端口，返回在线服务列表 |

### 2.3 本地预览服务器的隔离机制（现状）

`htmlPreviewServer.ts` 已经用了不少隔离手段，是 Web 化设计的参考基线：

- **每次预览生成独立 session**：`sessionId = randomBytes(16)`、`token = randomBytes(24)`（`htmlPreviewServer.ts:353`）。
- **token 校验**：URL query 或 Referer 携带 token，不匹配返回 403（`htmlPreviewServer.ts:269`）。
- **路径穿越防护**：`resolvedPath.startsWith(session.rootDir)`（`htmlPreviewServer.ts:285`）。
- **rootDir 隔离**：每个 session 绑定单个文件所在目录（`htmlPreviewServer.ts:355`）。
- **CSP（仅 pptx 页启用）**：`includePreviewCsp` 里 `default-src 'self'` 等（`htmlPreviewServer.ts:79`）。

**桌面端的宽松点（Web 端必须收紧）**：

1. HTML 文件预览未启用 CSP（只有 pptx 页启用了），且 `Access-Control-Allow-Origin: *`（`htmlPreviewServer.ts:74`）。
2. inline HTML iframe 只有 `sandbox="allow-scripts"`，没有 CSP，也没有 `allow-same-origin` 缺失带来的 origin 隔离说明。
3. 预览服务器与主进程同机，rootDir 是用户真实工作目录——多租户下这等于把租户文件系统暴露给同一进程。

---

## 3. 目标架构：预览网关（Preview Gateway）

### 3.1 总体思路

将"本地 HTTP 预览服务器 + Electron iframe"替换为一套服务端 **预览网关**，核心三要素：

1. **独立沙箱域名**：预览内容全部从与主应用不同源的域名提供，例如 `usercontent-lobsterai.com`（下称"沙箱域名"）；主应用在 `app.lobsterai.com`。跨源天然隔离 cookie / localStorage / 主应用 DOM。
2. **签名 URL + 预览会话级签名前缀**：**顶层入口资源**（HTML 入口、图片、视频、PPTX 源文件等）通过短时效 HMAC 签名 URL 提供，按 `14` §5.4 绑定 `method + tenantId + previewSessionId + artifactId + path + exp + kid`，杜绝越权访问其他租户产物。`previewSessionId` 是预览网关短期授权 ID，不是 Cowork `sessionId`，也不得进入对象存储前缀。但**文件型 HTML 内的相对子资源**（`./style.css`、`img/a.png`）**不做 per-file 签名**——浏览器对相对子请求不会逐个带 `sig`/`exp`，无法逐个验签——改用**预览会话级签名 Cookie / 令牌前缀**（作用域限该沙箱预览路径）鉴权，详见 §4.1 与 附录 C D16。
3. **iframe 隔离 + 严格 CSP**：主应用用严格 `sandbox` 属性的 iframe 嵌入沙箱域名 URL，网关响应带强 CSP 头。

```mermaid
flowchart TB
  subgraph 主应用[app.lobsterai.com]
    R[React ArtifactRenderer]
    R -->|POST /api/v1/artifacts/{artifactId}/preview| API[后端 REST]
    API -->|返回签名 URL| R
    R -->|iframe src = 沙箱域名签名URL| IF[iframe sandbox+CSP]
  end
  subgraph 网关[usercontent-lobsterai.com 沙箱域名]
    PG[Preview Gateway 服务]
    PG -->|校验 HMAC 签名 + 租户| S3[(S3/MinIO 对象存储)]
    PG -->|CSP / X-Frame-Options| IF
  end
  API -.签发短时 HMAC 签名.-> PG
```

### 3.2 为什么必须用独立沙箱域名

| 风险（同源提供时） | 后果 | 独立域名如何规避 |
|---|---|---|
| AI 生成 HTML 含恶意 `<script>` | 读取主应用 cookie / localStorage / 调用 `window.electron`/API | 跨源隔离，脚本拿不到主应用 origin 的存储与 API 凭证 |
| 产物内 `fetch('/api/...')` 携带 cookie | CSRF、越权调用后端 | 沙箱域名不设主应用 cookie；后端不接受该 origin 无 token 请求 |
| 产物间互相引用绕过 | 租户 A 页面读租户 B 资源，或复用其它预览会话/Artifact 授权 | 签名 URL 绑定 `tenantId + previewSessionId + artifactId + path`，网关校验路径前缀 `tenants/{tenantId}/...` |

沙箱域名与主域名不能是子域关系下会共享 cookie 的写法（避免 `.lobsterai.com` 通配 cookie 泄漏）；推荐**完全不同的注册域名**，与 `14-安全合规与多租户隔离.md` 的隔离原则一致。

---

## 4. 分类型改造方案

### 4.1 HTML 文件预览（最高改造量）

**现状**：`FileBasedHtmlRenderer` 调 `window.electron.artifact.createPreviewSession(filePath)`（`HtmlRenderer.tsx:37`），拿到 `http://127.0.0.1:port/{sessionId}/...?token=...`，塞进 iframe。

**目标**：

1. 浏览器桥（见 `03-前端与传输层改造.md`）实现 `artifact.createPreviewSession(artifactRef)`，改为调后端 REST：

```
POST /api/v1/artifacts/{artifactId}/preview
  body: { entryFile?: string }
  → 200 { previewSessionId, url, expiresAt }
     url = https://usercontent-lobsterai.com/p/{previewSessionId}/{entryRelPath}?sig=...&exp=...
```

2. 后端预览网关校验**入口签名**后，从对象存储 `tenants/{tenantId}/ws-{workspaceId}/artifacts/{artifactId}/` 前缀流式返回文件（HTML 及其相对引用的 css/js/图片）；`previewSessionId` 只作为预览会话/签名维度，不作为对象存储顶层隔离前缀，也不等同于 Cowork `sessionId`。
3. **相对子资源鉴权 = 预览会话级签名 Cookie / 令牌前缀，不做 per-file 签名**（附录 C D16）：iframe 加载入口 HTML 时，网关在入口响应上下发一个**作用域限于 `/p/{previewSessionId}/` 路径的短时签名 Cookie**（或把签名令牌编入 URL 前缀段），浏览器随后对 `./style.css`、`img/a.png` 等相对子请求自动携带该 Cookie / 前缀即可通过校验。逐文件 HMAC 签名在此不可行——浏览器发起的相对子请求不会带 `sig`/`exp`；同时须确保「沙箱域不设主应用 Cookie」的策略与该预览 Cookie 不冲突（Cookie 仅限沙箱域自身、`SameSite`/`Path` 收窄）。网关仍在预览会话前缀内做与桌面端相同的路径穿越防护。
4. iframe 收紧 sandbox：

```tsx
<iframe
  src={previewUrl}
  className="w-full h-full border-0"
  sandbox="allow-scripts allow-popups allow-forms"
  referrerPolicy="no-referrer"
  title={artifact.title}
/>
```

> 注意：不加 `allow-same-origin`。加了它 + `allow-scripts` 会让沙箱脚本恢复对沙箱域名 origin 的完整访问；由于是独立域名，即使加了也读不到主应用，但为纵深防御默认不加，除非产物明确需要 same-origin 能力（如访问自身 IndexedDB）。

**网关响应头（HTML 入口）**：

```
Content-Security-Policy:
  default-src 'none';
  script-src 'self' 'unsafe-inline' 'unsafe-eval' blob:;   # 必须含 self（沙箱 host 自身）：放行文件型 HTML 的外部 <script src>，否则验收 #1 必失败（附录 C D16）
  style-src  'self' 'unsafe-inline';                        # 必须含 self：放行外部 css，同上
  worker-src blob:;                                         # 放行产物内 Web Worker（否则 pdf.js/pptx-preview 等 worker 被拦）
  img-src data: blob: https://usercontent-lobsterai.com;
  media-src data: blob: https://usercontent-lobsterai.com;
  font-src data: https://usercontent-lobsterai.com;
  connect-src 'none';                               # 禁止产物向外发请求（默认）
  base-uri 'none';                                  # 禁止 <base> 改写基址逃逸出 session 前缀
  form-action 'none';                               # 禁止表单外发数据
  frame-ancestors https://app.lobsterai.com;        # 只允许主应用嵌入
Cross-Origin-Resource-Policy: same-origin
X-Content-Type-Options: nosniff
Cache-Control: no-store
```

关键订正（附录 C D16）：`script-src` / `style-src` **必须加沙箱 host 自身 `'self'`**——原文只有 `'unsafe-inline'` 会拦掉文件型 HTML 外链的 `<script src>` / `<link rel=stylesheet>`，直接使验收 #1（含相对 css/js）失败；并补 `worker-src blob:`、`base-uri`、`form-action` 收口 worker 与逃逸面。`connect-src 'none'` 默认阻断产物 `fetch`/`XHR`/`WebSocket`，避免数据外泄与 SSRF；确有联网需求（如产物调公共 CDN）时再按需放开，并在 §8 验收里单列。CSP 具体基线与 `14-安全合规与多租户隔离.md` 保持一致。

**文件变更触发刷新**：桌面端用 `artifact:file:changed` 事件让 iframe reload（`HtmlRenderer.tsx:65`）。Web 端产物写入对象存储 / PVC 工作区后，由文件服务通过 canonical WS `files:changed {workspaceId, relPath, kind}` 通知；浏览器桥可为旧渲染器重放 `artifact:file:changed` 兼容别名，前端换 `?_t=` 兜底刷新（见 `03` 桥事件映射与 `08` §4.5）。

### 4.2 HTML inline（AI 生成、无文件）

**现状**：`srcDoc` + `sandbox="allow-scripts"`（`HtmlRenderer.tsx:124`）。

**目标**：

- 小体量 inline HTML（阈值建议 256KB）：保留 `srcDoc` 方案，但**升级隔离**——因为 `srcDoc` 属于父页面 origin，`sandbox="allow-scripts"`（不含 `allow-same-origin`）会让 iframe 成为 opaque origin，脚本拿不到父页面存储，这是安全的。**必须确保永不添加 `allow-same-origin`**，否则 srcDoc 会回落到父 origin，AI 脚本即可读主应用 token。
- 保留 `injectHashNavInterceptor`（`HtmlRenderer.tsx:9`）注入的锚点导航脚本。
- 大体量 inline HTML：先落对象存储再走 §4.1 的沙箱域名方案，避免超大 `srcDoc` 卡渲染。

为纵深防御，即使 `srcDoc` 也建议加 CSP `<meta>` 或改走沙箱域名，二选一：小内容图省事保留 srcDoc + opaque origin；追求统一可全部走沙箱域名 blob。推荐 **GA 主线保留 srcDoc（小）+ 沙箱域名（大/文件）双路**。

### 4.3 SVG

**现状**：`SvgRenderer` 前端渲染。SVG 可含 `<script>`/`<foreignObject>`，是 XSS 载体。

**目标**：

- inline SVG：前端用 DOMPurify（`USE_PROFILES: {svg: true, svgFilters: true}`）净化后再 `dangerouslySetInnerHTML`，或塞进 opaque-origin iframe。分享场景（§7）后端也必须净化——`htmlShare` 已定义 `UnsafeSvg` 错误码（`src/shared/htmlShare/constants.ts` `HtmlShareErrorCode.UnsafeSvg = 41312`），沿用。
- 文件型 SVG：经预览网关以 `Content-Type: image/svg+xml` + CSP `script-src 'none'` 提供，或转 `<img src>`（`<img>` 引用的 SVG 不执行脚本，最安全）。

### 4.4 图片 / 视频

**现状**：本地文件路径 → dataURL 或本地 URL；去重键含 `url:{type}:{content}`（`artifactParser.ts:59`）。

**目标**：

- 产物图片/视频写入对象存储，渲染时用签名 URL：`<img src={signedUrl}>` / `<video src={signedUrl}>`。
- 视频需支持 HTTP Range（对象存储原生支持）以便拖动进度。
- 缩略图：桌面端有 `dialog:generateThumbnail` IPC，Web 端由后端在上传时生成缩略图并单独签名。
- dataURL（AI 直接内联小图）继续内联即可，无需对象存储。

细节见 `08-文件工作区与对象存储.md`。

### 4.5 mermaid / code / markdown / text（纯前端保留）

- `mermaid`：`MermaidRenderer` 用 mermaid.js 前端渲染，零改造。
- `code`：`CodeRenderer` 高亮，零改造（注意 `code` 不在 `PREVIEWABLE_ARTIFACT_TYPES`，行为不变）。
- `text`：`TextRenderer`，零改造。
- `markdown`：`MarkdownRenderer` 前端渲染。唯一改造点：markdown 中引用的本地图片路径 → 改为签名 URL；同时确保 markdown → HTML 渲染链路净化（禁 raw HTML 或 DOMPurify），防止 markdown 内嵌 `<script>`。

### 4.6 document（PDF / DOCX / XLSX / PPTX）

**现状**：

- PDF：前端 pdf.js（`DocumentRenderer.tsx:373` worker，`:316` 资源），需要文件字节。
- PPTX：走本地预览服务器 `createOfficePreviewSession` + `pptx-preview` UMD（`htmlPreviewServer.ts:222`, `DocumentRenderer.tsx:529`），或前端 iframe 内 pptx-preview 渲染（`DocumentRenderer.tsx:1011` 起）。
- DOCX/XLSX：前端渲染器（`docxPagination.ts`、`renderers/sheet`）。

**目标（两条可选路线，GA 主线建议路线 A 为主）**：

| 路线 | 做法 | 优点 | 缺点 |
|---|---|---|---|
| **A. 前端库拉签名 URL** | pdf.js / docx 渲染器 / sheet 渲染器 / pptx-preview 直接 `fetch(signedUrl)` 拿字节在浏览器渲染 | 复用现有前端渲染器，服务端零转换负担 | 大文件下载耗时；PPTX/DOCX 保真度受库限制（与桌面端一致） |
| **B. 服务端转 PDF** | 后端用 LibreOffice headless 把 DOCX/PPTX/XLSX 转 PDF，前端统一 pdf.js 渲染 | 保真度高、渲染统一 | 需部署转换服务（BullMQ 任务 + 隔离容器）、有转换延迟 |

**GA 主线决策**：

- PDF：路线 A（前端 pdf.js 拉签名 URL），改动最小。
- DOCX / XLSX / PPTX：GA 主线先路线 A（沿用现有前端库，把本地 preview server 换成签名 URL 供给）；对保真度敏感的 PPTX/DOCX 转换（路线 B）列为 GA 后续增强，走 BullMQ 转换队列 + gVisor/Kata 隔离容器（转换本身是不可信文档处理，必须隔离，见 `14`）。

**PPTX 具体迁移**：把 `createOfficePreviewSession` 从本地 HTTP 服务器改为：后端返回 `source.pptx` 的签名 URL + `pptx-preview` 静态资源由主应用打包托管（不再从预览服务器动态取 UMD）；渲染页在沙箱域名 iframe 内加载，CSP 允许 `script-src`（pptx-preview 需要执行）。保留桌面端已有的 pptx CSP 基线（`htmlPreviewServer.ts:79`）。

---

## 5. local-service：本地起服务的取舍

**现状**：`local-service` 类型 + `localWebServices:list` IPC 扫描 `preferredPorts` 端口，探测本地运行的 web 服务（如 AI `npm run dev` 起的 Vite/Next 开发服）。桌面端 `ArtifactRenderer` 对该类型只显示 URL 占位（`ArtifactRenderer.tsx:42`）。它的价值在于：AI 在本地工作区起了一个服务，用户能一键预览。

Web/多租户下，"本地服务"跑在**租户沙箱 Pod 内部**（`127.0.0.1:port` 是 Pod 内地址，浏览器无法直连），必须做选择：

### 方案对比

| 方案 | 描述 | GA 主线建议 |
|---|---|---|
| **降级隐藏** | 不检测、不展示 local-service 产物；若 AI 产出该类型则显示"当前不支持本地服务预览"提示 | ✅ GA 主线采用 |
| **Pod 端口反向代理** | 后端为每个会话 Pod 暴露 `/preview-svc/{sessionId}/{port}/...` 反代到 Pod 内 `127.0.0.1:port`，经沙箱域名 iframe 展示 | GA 后续可选增强 |

### 若做 Pod 端口代理（GA 后续）

```mermaid
sequenceDiagram
  participant UI as 主应用 iframe
  participant GW as 预览网关(沙箱域名)
  participant K as K8s Service/Ingress
  participant POD as 会话 Pod(OpenClaw + 用户服务)
  UI->>GW: GET /svc/{sid}/{port}/ (签名)
  GW->>GW: 校验签名+租户+会话归属
  GW->>K: 转发到 pod svc:port
  K->>POD: 127.0.0.1:{port}
  POD-->>UI: 页面(经 GW 加 CSP/frame-ancestors)
```

取舍要点：

- **安全**：反代等于把租户容器内任意端口暴露到公网，必须签名 + 租户校验 + 仅允许白名单/AI 声明的端口；禁止访问 Pod 内元数据/内网（SSRF，与 `14` SSRF 策略一致，桌面端 `browserWebAccess.networkMode` 概念延续）。
- **成本**：Pod 需常驻（服务不能休眠），与 `07-OpenClaw运行时编排与沙箱隔离.md` 的 Pod 生命周期/休眠策略冲突——local-service 预览期间 Pod 必须保持运行，增加成本。
- **协议**：WebSocket/HMR 需网关支持 upgrade 转发（Vite/Next 开发服依赖 HMR）。

**结论**：GA 主线明确降级（列入 `13-功能取舍与降级清单.md`）；Pod 端口代理作为付费/高级功能在 GA 后续评估。基于 local-service 更进一步的**本地项目一键部署（`shareDeployment`）**与本降级同源，单列于 §7.4（同样不得静默丢弃）。

---

## 6. artifactParser 与去重键改造

**现状去重键**（`artifactParser.ts:50`）：

```
file:{type}:{normalizeFilePathForDedup(filePath)}
url:{type}:{remoteUrl}
url:{type}:{content}   // image/video
name:{type}:{fileName} // video
```

**Web 端改造**：

- 保留 `url:*` / `name:*` 逻辑（远程 URL/内容不变）。
- `file:*` 的路径不再是本地绝对路径，而是**租户工作区相对 key**（例如 `ws-{workspaceId}/artifacts/{artifactId}/a.html`，对象存储正式前缀由服务端拼成 `tenants/{tenantId}/ws-{workspaceId}/...`）。`normalizeFilePathForDedup`（`artifactParser.ts:44`）仍适用（统一分隔符 + 小写），但输入变为工作区相对路径，需在解析阶段把 `file://`/绝对路径归一为租户工作区相对 key；不得再使用 `sessions/{sessionId}` 作为 artifact 存储前缀或挂载单位。
- `shouldPreferArtifact`（`artifactParser.ts:69`）中"file 协议 < 远程 URL"的优先级语义不变，只是"本地文件"含义变为"工作区文件"。

这部分是**纯逻辑**，可继续用 Vitest 覆盖（现有 `.test.ts` 模式），几乎不涉及 IPC。

---

## 7. HTML Share 自建（替代 youdao htmlShare）

### 7.1 现状能力盘点

现有 `htmlShare` 客户端（`src/main/libs/htmlShare/`）把本地目录打包 zip 上传 youdao 云，返回 `shareId` 与公开 URL `{serverApiBase}/s/{shareId}/`（`endpoints.ts:35`, `htmlShareClient.ts:78`）。已有完整语义供复刻：

| 能力 | 常量/位点 |
|---|---|
| 源类型 | `HtmlShareSourceType`：html/image/svg/document/markdown/mermaid（`shared/htmlShare/constants.ts`） |
| 访问模式 | `HtmlShareAccessMode`：`code`（访问码）/ `public`（公开） |
| 状态 | `HtmlShareStatus`：live / disabled / failed |
| 停用来源 | `HtmlShareDisabledSource`：user/admin/moderation/active_limit/system |
| 错误码 | `HtmlShareErrorCode`：如 `UnsafeSvg=41312`、`ActiveShareLimitReached=41311`、`SubscriptionRequired=41307`、`AccessCodeInvalid=41308` |
| 打包限制 | `htmlSharePackager.ts`：单 zip 20MB、总 100MB、单文件 10MB、≤500 文件、扩展名白名单、排除 `.git`/`node_modules`/`.openclaw`/`memory` 敏感目录 |
| 现状旧云 API 端点（非目标 SaaS 路由） | `htmlShareClient.ts`：`POST /api/html-shares`、`.../{id}`、`.../{id}/status`、`.../{id}/access-mode` |

### 7.2 自建服务设计

复用上述**常量与语义**（`HtmlShareSourceType` / `AccessMode` / `Status` / 错误码 / 打包限额），但**打包器与依赖扫描器（`htmlSharePackager.ts` / `artifactFileSharePackager.ts` / `htmlDependencyScanner.ts`）深度耦合本地 fs（`fs.promises`、`os.tmpdir`、`createWriteStream`、目录遍历），是「必须重写」而非「原样迁移」**——在后端重写为「从对象存储 / 工作区 PVC 读源 → 服务端隔离容器内打包扫描」（复用分级口径见 附录 C D15）。只替换"上传目标"和"公开访问"两端：

```mermaid
flowchart LR
  U[用户点击分享] --> API[POST /api/v1/html-shares]
  API --> PK[后端隔离容器打包/扫描<br/>复用限额与错误码语义]
  PK --> S3[(对象存储<br/>tenants/{tenantId}/shares/{shareId}/)]
  API --> DB[(Postgres html_shares<br/>tenant_id,shareId,accessMode,status)]
  API --> R[返回 shareId + 公开URL]
  V[访客] --> PUB[GET /s/{shareId}/ 公开子站/CDN]
  PUB --> AC{accessMode?}
  AC -->|code| CK[校验访问码]
  AC -->|public| S3b[(对象存储)]
  CK --> S3b
```

**数据模型（Postgres，多租户）**：

```sql
CREATE TABLE html_shares (
  id                TEXT PRIMARY KEY,          -- shareId
  tenant_id         TEXT NOT NULL,             -- 多租户隔离（RLS 强制，见 附录 C D2 / §5）
  owner_user_id     TEXT NOT NULL,
  session_id        TEXT,                      -- 来源会话（现状 htmlShare 采集 sessionId）
  artifact_id       TEXT,                      -- 来源产物（现状采集 artifactId）
  title             TEXT NOT NULL,             -- 分享标题（现状 create 必填）
  source_type       TEXT NOT NULL,             -- HtmlShareSourceType
  client_source_key TEXT,                      -- 客户端来源键：现状用 (source_type, client_source_key) 幂等去重，避免同产物重复建分享
  access_mode       TEXT NOT NULL DEFAULT 'code',
  access_code       TEXT,                      -- code 模式访问码哈希
  share_code        TEXT,                      -- 展示用访问码（现状 shareCode，可能 shareCodeUnavailable）
  status            TEXT NOT NULL DEFAULT 'live',
  disabled_source   TEXT,
  moderation_status TEXT NOT NULL DEFAULT 'pending',  -- 审核态（现状 moderationStatus）：pending/approved/rejected
  entry_file        TEXT NOT NULL,
  source_sha256     TEXT,
  storage_prefix    TEXT NOT NULL,             -- tenants/{tenantId}/shares/{shareId}/
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ON html_shares (tenant_id, status);
-- 幂等去重：同租户、同来源类型、同 client_source_key 只保留一条活跃分享（对齐现状 findMatchingShare 语义）
CREATE UNIQUE INDEX html_shares_source_uk
  ON html_shares (tenant_id, source_type, client_source_key)
  WHERE client_source_key IS NOT NULL AND status = 'live';
```

字段对齐现状 `htmlShareClient.ts` 的 create 载荷（`clientSourceKey` / `sessionId` / `artifactId` / `title` / `shareCode` / `moderationStatus` 均为现有字段，此前 schema 遗漏）。租户隔离字段 `tenant_id` 与 RLS 强制策略见 附录 C D2 / §5，及 `05-认证与多租户账户.md`、`06-数据模型迁移.md`。

**公开访问站点**：分享内容属于**公网可访问的不可信内容**，必须：

- 独立域名（与沙箱域名同源策略，绝不与主应用同域）。
- 静态资源经对象存储 + CDN 直供；`code` 模式在网关校验访问码后签发短时 URL。
- 每个分享严格限制在 `tenants/{tenantId}/shares/{shareId}/` 前缀，路径穿越防护同 §4.1。
- CSP / `frame-ancestors` 同预览网关基线；SVG/HTML 上传时净化（复用 `UnsafeSvg` 拦截）。
- 保留配额门控：`SubscriptionRequired`/`ActiveShareLimitReached` 等错误码语义在新计费系统（`09-模型代理与计费.md`）里落地。

### 7.3 公开分享 abuse 治理

HTML share 一旦公开，就不再只是“预览技术能力”，而是平台对公网托管用户生成内容。GA 主线必须补齐以下治理：

| 能力 | 要求 | 验收 |
|---|---|---|
| 默认索引策略 | 新建分享默认 `noindex,nofollow`；租户/管理员显式允许后才可被搜索引擎索引 | 响应头或 meta 可检查 |
| 举报与下架 | 公共页提供 report 入口；后台支持 `disabled_source=moderation/admin/system`；下架后 CDN 缓存失效 | 举报工单可追踪，下架 p95 < 5 分钟 |
| 恶意内容扫描 | 打包后做 HTML/SVG/JS 静态扫描、可疑 phishing 关键词/外链扫描、文件类型白名单 | 命中 critical 默认 blocked |
| 速率限制 | 创建、更新、访问、访问码校验按 tenant/IP 限流；share 数量和总大小按套餐限制 | `ActiveShareLimitReached` 生效 |
| 外链策略 | 默认 CSP `connect-src 'none'`，外部脚本/CDN/接口全部阻断；需要联网的 artifact 必须走租户级显式 allowlist 和安全评审 | 未授权外链请求被 CSP 阻断并上报 |
| 审计 | 记录创建、更新、访问模式变更、下架、管理员操作、异常访问峰值 | 租户和平台支持面板可查 |
| 敏感目录 | 打包器继续排除 `.git`、`node_modules`、`.openclaw`、`memory`、token/config/log 等目录 | 测试包无法包含敏感路径 |

公开分享治理在 **第五版 V5** 完成，V3 Beta 期间默认不开放公网 HTML share，只允许内部预览域。

**IPC → REST 映射**（详见 `附录A-IPC通道与接口映射.md`）：

| 旧 IPC | 新 REST |
|---|---|
| `htmlShare:createFromHtmlFile` / `createFromArtifactFile` | `POST /api/v1/html-shares` |
| `htmlShare:updateFromHtmlFile` / `updateFromArtifactFile` | `PUT /api/v1/html-shares/{id}` |
| `htmlShare:getByHtmlFile` / `getByArtifactFile` / `get` | `GET /api/v1/html-shares?...` / `GET /api/v1/html-shares/{id}` |
| `htmlShare:updateStatus` | `PATCH /api/v1/html-shares/{id}/status` |
| `htmlShare:updateAccessMode` | `PATCH /api/v1/html-shares/{id}/access-mode` |
| `htmlShare:disable` | `PATCH /api/v1/html-shares/{id}/status` (disabled) |

### 7.4 shareDeployment（本地项目一键部署）—— 不得静默丢弃（P1-11）

除静态 HTML share 外，现状还有一整套 **`shareDeployment` 能力**（`src/main/libs/shareDeployment/`、`src/shared/shareDeployment/constants.ts`）：把 AI 在本地工作区起的 **Node 服务 / 构建产物**打包并部署到一个公网 URL——比 §5 的 local-service「只预览」更进一步，是「真部署」，并把部署记录挂到对应 html_share。这块能力有独立 IPC 面、独立状态机与两类部署源，Web 化时**不能被静默丢弃**：要么给出 REST/WS 映射 + Pod 编排，要么明确登记入 `13-功能取舍与降级清单.md`。

**能力盘点（现状）**：

| 维度 | 现状 |
|---|---|
| IPC 通道（5 个，`ShareDeploymentIpc`） | `detectProjectCandidates` / `analyzeProjectDirectory` / `createNodeDeployment` / `get` / `getByLocalService` |
| 部署状态机（`ShareDeploymentStatus`） | `queued → deploying → live`，失败 / 过期 / 停止分支 `deploy_failed` / `expired` / `stopped` |
| 两类部署源（`ShareDeploymentKind`） | `node_service`（Node 服务，含 Next/Nuxt standalone、Vite/Angular 产物识别）与 `static_site`（构建产物静态站） |
| 与 htmlShare 关联 | 部署记录挂到 html_share；现状客户端打旧云路由 `POST /api/share-deployments/{node,static}`、`GET /api/share-deployments/{id}`、`GET /api/html-shares/{shareId}/deployment`（非目标 SaaS 路由） |
| 打包 / 分析器 | `nodeServiceDeploymentPackager.ts` / `nodeServiceProjectAnalyzer.ts`，同样深度耦合本地 fs（`os.tmpdir` / `createWriteStream` / 目录遍历），**须重写**（同 §7.2、附录 C D15） |

**Web 化映射（静态站 GA / Node 服务 GA 后续）**：

| 旧 IPC | 新 REST |
|---|---|
| `shareDeployment:detectProjectCandidates` | `POST /api/v1/share-deployments/candidates` |
| `shareDeployment:analyzeProjectDirectory` | `POST /api/v1/share-deployments/analyze` |
| `shareDeployment:createNodeDeployment` | 历史 IPC 名保留；`kind=static_site` 走 `POST /api/v1/share-deployments/static`（GA），`kind=node_service` 走 `POST /api/v1/share-deployments/node` 但 V1-V6 GA 主线隐藏入口；REST 调用返回 `501` + 统一错误信封 `UNSUPPORTED_FEATURE`，bridge 适配为 `UnsupportedFeatureResult` |
| `shareDeployment:get` | `GET /api/v1/share-deployments/{deploymentId}` |
| `shareDeployment:getByLocalService` | `GET /api/v1/html-shares/{shareId}/deployment`（按会话 + `localServiceUrl` 反查） |

部署进度（`queued/deploying/...` 状态流转）经 WS 事件推送（复用 `03` 的产物事件通道，payload 含 `deploymentId` / `status` / `errorMessage`）；字段级契约以 `libs/shared/contracts` 为准（附录 C D1）。PR-1 contracts 需把上述静态站 GA 路径和 Node 服务 unsupported 响应都纳入 OpenAPI/契约测试，避免 `shareDeployment:*` 因不在附录 A 旧表而被桥层静默丢弃。

**Pod 编排要点**：`shareDeployment` 的输入是**租户 Pod 内的项目目录 + 正在运行的 local-service**（`projectDirectory` / `localServiceUrl` 均为 Pod 内地址），与 §5 local-service 完全同源，因此：

- **源码采集**：从会话 Pod 的工作区 PVC 读项目目录（非宿主 fs），在服务端隔离容器内打包扫描（不可信代码处理，隔离与出网策略同 `14`）。
- **运行目标**：`node_service` 需要一个**常驻可运行时**（独立 Pod / 无服务器运行时），与 `07-OpenClaw运行时编排与沙箱隔离.md` 的 Pod 生命周期 / 休眠策略冲突点同 §5；`static_site` 落对象存储 + CDN，可与 §7.2 分享站点复用。
- **越权 / SSRF / 供应链**：部署即运行不可信代码，隔离、egress、供应链门控随 `14`。

**GA 主线决策**：与 §5 local-service 一致——`node_service` 真部署在 **V1-V6 GA 主线均列为 GA 后续 / unsupported**，明确登记 `13-功能取舍与降级清单.md`（P1-11 项，不静默丢弃）；`static_site` 可随 §7.2 分享站点一并提供。完整部署契约（provider 编排、运行时选型、部署计费）作为 GA 后续增强，届时字段级契约以 `libs/shared/contracts` 为准。

---

## 8. 安全沙箱要点（与 `14` 一致）

Artifacts 是"AI 生成的、天然不可信"的内容，是 Web 化后最大的 XSS/数据泄漏面。防御分层：

```mermaid
flowchart TB
  A[不可信产物] --> L1[层1 独立沙箱域名<br/>跨源隔离主应用]
  L1 --> L2[层2 签名URL<br/>绑定租户+会话+过期]
  L2 --> L3[层3 严格CSP<br/>connect-src none / frame-ancestors]
  L3 --> L4[层4 iframe sandbox<br/>无 allow-same-origin]
  L4 --> L5[层5 内容净化<br/>SVG/HTML DOMPurify]
  L5 --> L6[层6 存储前缀隔离<br/>tenants/{id} 路径穿越防护]
```

| 威胁 | 防御 |
|---|---|
| AI HTML/SVG XSS | 独立域名 + srcDoc opaque origin / iframe sandbox 无 same-origin + CSP + DOMPurify |
| 越权访问他租户产物 | 签名 URL 绑定 `tenantId`+`previewSessionId`+`artifactId`+过期；网关校验存储前缀 |
| 产物外泄数据（fetch 主应用/内网） | CSP `connect-src 'none'`；预览网关 SSRF 防护；产物不携带主应用 cookie |
| 点击劫持 | `frame-ancestors https://app.lobsterai.com`；分享站禁止被任意页面嵌入 |
| 路径穿越 | 前缀校验（沿用 `htmlPreviewServer.ts:285` 思路） |
| 分享内容审核 | `disabled_source: moderation` + `UnsafeSvg` 拦截；打包排除敏感目录（`.openclaw`/`memory`） |
| MIME 嗅探 | `X-Content-Type-Options: nosniff` + 显式 Content-Type |

签名 URL 建议：**顶层入口**按 `14` §5.4 的固定顺序规范串 HMAC-SHA256(`v1\n{method}\n{tenantId}\n{previewSessionId}\n{artifactId}\n{path}\n{exp}\n{kid}`)，`exp` ≤ 10 分钟，密钥仅后端持有并按 `kid` 轮换。**文件型 HTML 的相对子资源不逐个签 path**——改由入口响应下发的**预览会话级签名 Cookie / 令牌前缀**承载鉴权（附录 C D16），作用域限 `/p/{previewSessionId}/`、随浏览器相对子请求自动携带。

---

## 9. 迁移步骤（建议顺序）

1. **抽离纯逻辑**：确认 `artifactParser.ts` 去重逻辑无 Electron 依赖，补 Vitest；调整 `file:*` 键为工作区相对 key。
2. **浏览器桥打桩**：`window.electron.artifact.*`（`createPreviewSession` / `destroyPreviewSession` / `createOfficePreviewSession` / `watchFile` / `unwatchFile`）改为调后端 REST；后端契约字段统一为 `previewSessionId`，若 `IElectronAPI` 现状必须保留 `{ success, url, sessionId }` 形状，只允许桥层把 `previewSessionId` 映射成兼容别名 `sessionId`，不得把该别名写入对象存储 key、HMAC payload、REST DTO 或 AsyncAPI。**产物内联读写桥须保持现状 shim 形状**：`saveInlineFile({ dataBase64, fileName, mimeType, cwd }) -> { success, path }`（25MB 上限）、`readFileAsDataUrl(...) -> { success, dataUrl }`——桥把新 REST 响应适配回旧契约形状，避免打断 `ArtifactPanel` / `CodeRenderer`（见 附录 C §3.4 / P1-7）。见 `03`。
3. **预览网关服务**：新建沙箱域名服务，实现签名校验 + 对象存储流式返回 + CSP 头 + 路径穿越防护。
4. **图片/视频/文档** 接对象存储签名 URL（依赖 `08`）。
5. **PPTX/document** 从本地 preview server 迁到签名 URL 供给；pptx-preview 静态资源改主应用打包托管。
6. **HTML share 自建**：迁移打包器到后端 + `html_shares` 表 + 公开访问站点。
7. **local-service 降级**：`ArtifactRenderer` local-service 分支改为友好降级提示；下线 `localWebServices:list` 探测（GA 主线）。
8. **收紧 sandbox/CSP**：全面替换宽松的 `Access-Control-Allow-Origin: *` 与无 CSP 的 HTML 预览。

---

## 10. 验收标准

| # | 验收项 | 判定 |
|---|---|---|
| 1 | HTML 文件产物在预览网关沙箱域名下正确渲染，含相对 css/js/图片引用 | 通过 |
| 2 | 预览 iframe 内脚本无法读取主应用 cookie/localStorage/API token | 渗透测试无法读取 |
| 3 | 签名 URL 过期后（>10min）返回 403；篡改 `tenantId`、`previewSessionId`、`artifactId`、`path`、`method` 或 `kid` 返回 403 | 通过 |
| 4 | 租户 A 无法通过任何 URL 访问租户 B 的产物或分享 | 越权测试全部拒绝 |
| 5 | inline HTML srcDoc 为 opaque origin，`allow-same-origin` 永不出现 | 代码审查 + DOM 断言 |
| 6 | SVG/HTML 产物经 DOMPurify/净化，`<script>` 注入被拦截或不执行 | XSS 用例不触发 |
| 7 | CSP `connect-src 'none'` 生效，产物 `fetch` 被浏览器阻断（除白名单） | 控制台报 CSP 违规 |
| 8 | 图片/视频经对象存储签名 URL 展示，视频支持进度拖动（Range） | 通过 |
| 9 | PDF（pdf.js）与 PPTX（pptx-preview）产物在 Web 端正常渲染 | 通过 |
| 10 | mermaid/code/markdown/text 渲染与桌面端一致，无回归 | 视觉/单测通过 |
| 11 | HTML share 自建：创建/更新/停用/访问码/公开模式全流程可用 | 通过 |
| 12 | 分享站点独立域名、`frame-ancestors` 限制、敏感目录（`.openclaw`/`memory`）不被打包 | 审查 + 用例 |
| 13 | local-service 产物显示明确降级提示，不泄漏 Pod 内网信息 | 通过 |
| 14 | `artifactParser` 去重 Vitest 全绿（含新工作区 key 用例） | `npm test -- artifact` |
| 15 | 打包大小/文件数限制（20MB/100MB/500 文件）在后端生效 | 边界用例 |

---

## 11. 风险与缓解

| 风险 | 影响 | 缓解 | 关联 |
|---|---|---|---|
| AI 产物 XSS 突破隔离 | 租户数据泄漏 | 独立域名 + 多层 CSP/sandbox + 净化；安全评审为发布门禁 | `14` |
| 签名 URL 泄漏/重放 | 短时越权访问 | 短过期 + 绑定 `method + tenantId + previewSessionId + artifactId + path + exp + kid`（不是 Cowork `sessionId`）+ IP/UA 可选绑定 + 密钥轮换 | `14` |
| PPTX/DOCX 前端库保真度不足 | 用户体验回退 | GA 主线接受与桌面端同等保真；GA 后续上服务端 LibreOffice 转 PDF | `13` |
| 大文件签名 URL 下载慢 | 预览卡顿 | CDN 加速 + Range + 缩略图先行 | `08`,`15` |
| local-service 降级引发用户预期落差 | 功能缺失投诉 | 文档明确 + 降级提示 + GA 后续 Pod 端口代理路线图 | `13` |
| 文档转换服务处理恶意文件 | RCE/逃逸 | 转换在 gVisor/Kata 隔离容器 + BullMQ 限流 + 无网络 | `07`,`14` |
| 分享内容合规/审核缺失 | 违规内容托管 | moderation 停用机制 + 内容扫描 + 举报下架 | `14` |

---

## 12. 与其他章节的接口

- 浏览器桥与 WS 事件（canonical `files:changed` / 兼容别名 `artifact:file:changed`、`createPreviewSession` 桩）→ `03-前端与传输层改造.md`。
- 预览网关/分享站点部署与 CDN/域名 → `15-部署运维与可观测性.md`。
- 对象存储路径规划、签名、缩略图 → `08-文件工作区与对象存储.md`。
- 沙箱域名、CSP 基线、SSRF、签名密钥管理 → `14-安全合规与多租户隔离.md`。
- 会话 Pod 生命周期（影响 local-service 代理可行性）→ `07-OpenClaw运行时编排与沙箱隔离.md`。
- HTML share 计费门控（`SubscriptionRequired`/配额）→ `09-模型代理与计费.md`。
- IPC → REST/WS 完整映射、字段级契约事实源 → `附录A-IPC通道与接口映射.md`、`libs/shared/contracts`（附录 C D1）。
- local-service 与 `shareDeployment` 一键部署降级登记（P1-11）→ `13-功能取舍与降级清单.md`。
- 决策基线（预览子资源鉴权 D16、复用分级 D15、桥 shim 契约 §3.4、RLS 强制 D2）→ `附录C-决策基线与接口契约总纲.md`。
