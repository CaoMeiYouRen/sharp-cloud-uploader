# MCP Server 功能设计方案

## 1. 背景与目标

为 `sharp-cloud-uploader` 项目添加 **Model Context Protocol (MCP)** 服务端能力，使 AI 应用（如 Claude Desktop、Cursor、VS Code Copilot 等）能够通过标准化的 MCP 协议直接调用图片上传与压缩功能。

### 核心目标

- 暴露图片上传能力为 MCP Tools，供 AI Agent 调用
- 支持 **本地调用**（stdio 传输）与 **远程调用**（HTTP Streamable 传输）两种模式
- 复用现有图片压缩、存储上传逻辑，不重复造轮子
- 保持与现有 Vercel / Cloudflare Workers / Docker 部署方式的兼容性

---

## 2. 架构概览

```
┌──────────────────────────────────────────────────────────┐
│                     MCP Client (AI)                      │
│              (Claude Desktop / Cursor / etc.)            │
└──────────┬──────────────────────┬───────────────────────┘
           │  stdio               │  HTTP (Streamable)
           ▼                      ▼
┌──────────────────┐   ┌──────────────────────────────────┐
│  Local Transport │   │       Remote Transport            │
│  StdioServer-    │   │  WebStandardStreamableHTTP-       │
│  Transport       │   │  ServerTransport                  │
│                  │   │  (挂载到现有 Hono app /mcp 路由)    │
└────────┬─────────┘   └──────────────┬───────────────────┘
         │                            │
         ▼                            ▼
┌──────────────────────────────────────────────────────────┐
│                   McpServer (共享核心)                     │
│                                                          │
│  Tools:                                                  │
│    • upload_image_from_url      — 从 URL 上传图片         │
│    • upload_image_from_base64   — 从 Base64 上传图片      │
│    • get_runtime_info           — 查询运行时信息           │
│                                                          │
│  Resources:                                              │
│    • image-uploader://config    — 当前配置信息（非敏感）    │
└──────────────────────────┬───────────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────────┐
│              现有业务逻辑（复用）                           │
│  src/utils/sharp.ts    — 图片压缩                         │
│  src/libs/s3.ts        — S3 / R2 上传                   │
│  src/libs/vercel-blob.ts — Vercel Blob 上传              │
│  src/libs/storage-factory.ts — 存储后端工厂               │
└──────────────────────────────────────────────────────────┘
```

### 设计原则

- **单一核心、双传输**：MCP Server 定义一次，通过不同 Transport 适配本地/远程
- **最小侵入**：远程模式以路由挂载方式集成到现有 Hono app，不修改现有路由
- **安全优先**：远程模式强制 Bearer Token 认证，敏感配置不暴露给 MCP Resources

---

## 3. 文件结构

新增以下文件：

```
sharp-cloud-uploader/
├── src/
│   ├── mcp/
│   │   ├── server.ts          # 共享 McpServer 定义（Tools + Resources）
│   │   ├── local.ts           # 本地 stdio 入口
│   │   └── remote.ts          # 远程 HTTP 路由（Hono 子应用）
│   ├── app.ts                 # [修改] 挂载 /mcp 路由
│   ├── types.d.ts             # [修改] 新增 MCP 相关类型（如有）
├── docs/
│   └── mcp-server-design.md   # 本文档
├── package.json               # [修改] 新增 @modelcontextprotocol/sdk、zod
├── tsup.config.ts             # [修改] 新增 mcp-local 构建入口
├── .npmrc                     # [修改] 新增 public-hoist-pattern（如需要）
```

---

## 4. MCP Tools 设计

### 4.1 `upload_image_from_url`

从指定 URL 下载图片，压缩后上传到配置的存储后端，返回图片 URL。

| 属性 | 值 |
|------|-----|
| **名称** | `upload_image_from_url` |
| **描述** | 从指定的远程 URL 下载图片，使用 sharp 进行智能压缩，然后上传到云存储（S3/R2/Vercel Blob），返回可访问的图片链接。支持 JPEG/PNG/WebP/AVIF/GIF 等常见格式。 |
| **输入** | `{ url: string, quality?: number }` |
| **输出** | `{ url: string, success: boolean }` |

**输入参数：**

```typescript
z.object({
    url: z.string().url().describe('图片的远程 URL 地址'),
    quality: z.number().int().min(1).max(100).optional().default(90)
        .describe('压缩质量 (1-100)，默认 90'),
})
```

**处理流程：**

1. 参数校验（URL 格式、quality 范围）
2. 如果 URL 已经以 `S3_BASE_URL` / `R2_BASE_URL` 开头，直接返回（去重）
3. 使用 `fetch()` 下载图片，自动添加 Referer 头（复用 `src/utils/referers.ts`）
4. 从响应头或文件内容检测 MIME 类型（复用 `src/utils/file.ts`）
5. 调用 `compressImage()` 压缩（复用 `src/utils/sharp.ts`）
6. 生成文件名（时间戳 + 随机字符串 + 扩展名）
7. 通过 `StorageFactory` 上传到配置的存储后端
8. 返回结果 URL

**错误处理：**

- HTTP 下载失败 → `isError: true`，返回详细错误信息
- 非图片内容 → `isError: true`，提示格式不支持
- 上传失败 → `isError: true`，返回存储错误信息

### 4.2 `upload_image_from_base64`

接收 Base64 编码的图片数据，压缩后上传到云存储。

| 属性 | 值 |
|------|-----|
| **名称** | `upload_image_from_base64` |
| **描述** | 接收 Base64 编码的图片数据（支持 data URI 格式或纯 Base64），使用 sharp 压缩后上传到云存储，返回可访问的图片链接。 |
| **输入** | `{ base64: string, quality?: number, filename?: string }` |
| **输出** | `{ url: string, success: boolean }` |

**输入参数：**

```typescript
z.object({
    base64: z.string()
        .describe('Base64 编码的图片数据，支持 `data:image/xxx;base64,...` 格式'),
    quality: z.number().int().min(1).max(100).optional().default(90)
        .describe('压缩质量 (1-100)，默认 90'),
    filename: z.string().optional()
        .describe('自定义文件名（不含路径前缀），不传则自动生成'),
})
```

**处理流程：**

1. 解析 Base64 数据（去除 `data:image/xxx;base64,` 前缀）
2. 将 Base64 解码为 `Buffer`
3. 检测 MIME 类型（复用 `file-type` 库）
4. 调用 `compressImage()` 压缩
5. 上传到存储后端
6. 返回结果 URL

### 4.3 `get_runtime_info`

查询服务运行状态和配置信息。

| 属性 | 值 |
|------|-----|
| **名称** | `get_runtime_info` |
| **描述** | 获取图片上传服务的运行状态、存储后端配置等基本信息。 |
| **输入** | `{}`（无参数） |
| **输出** | `{ storageType, nodeVersion, runtime, bucketPrefix }` |

**输入参数：**

```typescript
z.object({}).strict()
```

**输出内容（非敏感信息）：**

- `storageType` — 存储类型（`s3` / `r2` / `vercel-blob`）
- `nodeVersion` — Node.js 版本
- `runtime` — 运行时环境标识
- `bucketPrefix` — 文件名前缀

---

## 5. MCP Resources 设计

### 5.1 `image-uploader://config`

静态资源，返回当前服务的非敏感配置信息。

| 属性 | 值 |
|------|-----|
| **URI** | `image-uploader://config` |
| **名称** | Image Uploader Configuration |
| **描述** | 图片上传服务的当前配置信息（不含密钥等敏感数据） |
| **MIME Type** | `application/json` |

**返回内容：**

```json
{
    "storageType": "s3",
    "bucketPrefix": "images/",
    "maxBodySize": 104857600,
    "defaultQuality": 90,
    "timeout": 60000,
    "version": "1.3.3"
}
```

> 注意：不会返回 `S3_ACCESS_KEY_ID`、`S3_SECRET_ACCESS_KEY`、`AUTH_TOKEN` 等敏感信息。

---

## 6. 传输模式

### 6.1 本地模式（stdio）

**入口文件：** `src/mcp/local.ts` → 构建输出 `dist/mcp-local.mjs`

**适用场景：**
- Claude Desktop 本地集成
- VS Code / Cursor 本地 MCP 配置
- 开发调试

**启动方式：**

```bash
# 安装依赖后直接运行
node dist/mcp-local.mjs

# 或通过脚本
pnpm run mcp:local
```

**传输机制：** 使用 MCP SDK 的 `StdioServerTransport`，通过标准输入/输出进行 JSON-RPC 通信。

**配置方式（以 Claude Desktop 为例）：**

```json
{
    "mcpServers": {
        "sharp-cloud-uploader": {
            "command": "node",
            "args": ["/path/to/sharp-cloud-uploader/dist/mcp-local.mjs"],
            "env": {
                "STORAGE_TYPE": "s3",
                "S3_BASE_URL": "https://oss.example.com",
                "S3_REGION": "auto",
                "S3_BUCKET_NAME": "my-bucket",
                "S3_ACCESS_KEY_ID": "xxx",
                "S3_SECRET_ACCESS_KEY": "xxx",
                "S3_ENDPOINT": "https://xxx.r2.cloudflarestorage.com",
                "AUTH_TOKEN": "",
                "BUCKET_PREFIX": "images/"
            }
        }
    }
}
```

### 6.2 远程模式（HTTP Streamable）

**入口文件：** `src/mcp/remote.ts` → 挂载到 Hono app 的 `/mcp` 路由

**适用场景：**
- 已部署到 Vercel / Docker / 自有服务器的服务端
- 多客户端共享同一 MCP 服务
- 远程 AI 平台调用

**传输机制：** 使用 MCP SDK 的 `WebStandardStreamableHTTPServerTransport`，通过 HTTP POST/GET 进行通信。复用现有 Hono app 的中间件栈（日志、CORS、超时等）。

**挂载方式（修改 `src/app.ts`）：**

```typescript
import { mcpRemoteRoute } from './mcp/remote'

// 挂载 MCP 远程端点
app.route('/mcp', mcpRemoteRoute)
```

**认证：** 远程模式通过 `AUTH_TOKEN` 环境变量进行 Bearer Token 认证。如果设置了 `AUTH_TOKEN`，MCP 客户端需要在 HTTP 请求中携带 `Authorization: Bearer <token>` 头。若未设置，则不要求认证（适合内网部署）。

**端点：**

| 方法 | 路径 | 说明 |
|------|------|------|
| `POST` | `/mcp` | MCP Streamable HTTP 主端点 |
| `GET` | `/mcp` | MCP Streamable HTTP（SSE 回退） |
| `DELETE` | `/mcp` | 关闭 MCP 会话 |

---

## 7. 实现计划

### 阶段 1：依赖安装与基础搭建

1. 安装依赖：
   ```bash
   pnpm add @modelcontextprotocol/sdk zod
   ```
   > `zod` 是 MCP SDK 的 peer dependency；同时 MCP SDK 内置了 `@modelcontextprotocol/server`、`@modelcontextprotocol/node`、`@modelcontextprotocol/hono` 等子包。

2. 创建 `src/mcp/` 目录结构

### 阶段 2：共享核心 `src/mcp/server.ts`

```typescript
import { McpServer } from '@modelcontextprotocol/server'
import * as z from 'zod/v4'
import { Bindings } from '../types'

/**
 * 创建 MCP Server 实例（共享核心）
 * 包含所有 Tools 和 Resources 的注册
 */
export function createMcpServer(env: Bindings): McpServer {
    const server = new McpServer({
        name: 'sharp-cloud-uploader',
        version: '1.3.3',
    })

    // 注册 Tools
    registerUploadFromUrlTool(server, env)
    registerUploadFromBase64Tool(server, env)
    registerRuntimeInfoTool(server, env)

    // 注册 Resources
    registerConfigResource(server, env)

    return server
}
```

**核心设计点：**

- `createMcpServer(env)` 接收 `Bindings` 对象，将环境变量注入到每个 Tool handler 的闭包中
- 本地模式从 `process.env` 构建 `Bindings`
- 远程模式从 Hono `c.env` 获取 `Bindings`

### 阶段 3：本地入口 `src/mcp/local.ts`

```typescript
import { StdioServerTransport } from '@modelcontextprotocol/server/stdio'
import { createMcpServer } from './server'
import dotenv from 'dotenv'

// 加载 env（本地模式无 Hono env adapter，直接用 process.env）
dotenv.config({ path: ['.env.local', '.env'] })

async function main() {
    const env = buildBindingsFromProcessEnv() // 从 process.env 构造 Bindings
    const server = createMcpServer(env)
    const transport = new StdioServerTransport()
    await server.connect(transport)
}

main().catch(console.error)
```

### 阶段 4：远程路由 `src/mcp/remote.ts`

```typescript
import { Hono } from 'hono'
import { bearerAuth } from 'hono/bearer-auth'
import { env } from 'hono/adapter'
import { McpServer, WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/server'
import { createMcpServer } from './server'
import { Bindings } from '../types'

const app = new Hono<{ Bindings: Bindings }>()

app.all('/mcp', async (c) => {
    // 可选认证
    const authToken = env(c).AUTH_TOKEN
    if (authToken) {
        // 如果设置了 AUTH_TOKEN，进行 Bearer 认证
        const auth = bearerAuth({ token: authToken })
        await auth(c, async () => {
            await handleMcpRequest(c)
        })
        return
    }
    await handleMcpRequest(c)
})

async function handleMcpRequest(c: Context<{ Bindings: Bindings }>) {
    const envValue = env(c)
    const server = createMcpServer(envValue)
    const transport = new WebStandardStreamableHTTPServerTransport({
        sessionIdGenerator: undefined, // 无状态模式
    })
    await server.connect(transport)
    await transport.handleRequest(c.req.raw)
}

export default app
```

> **注意：** 远程模式建议使用**无状态模式**（`sessionIdGenerator: undefined`），每次请求创建新的 server→transport 连接。这与 Vercel Serverless 的无状态特性一致。

### 阶段 5：修改 `src/app.ts`

```typescript
// 新增导入
import mcpRemote from './mcp/remote'

// 在现有路由挂载后添加：
app.route('/', mcpRemote)
```

### 阶段 6：修改 `tsup.config.ts`

新增 `mcp-local` 构建入口：

```typescript
const mcpLocalOptions: Options = {
    ...tsupOptions,
    entry: ['src/mcp/local.ts'],
    outDir: 'dist',
    // 输出文件名保持为 mcp-local.mjs
    format: ['esm'],
}

export default defineConfig([tsupOptions, cloudflareOptions, mcpLocalOptions])
```

### 阶段 7：添加 `package.json` scripts

```json
{
    "scripts": {
        "mcp:local": "node dist/mcp-local.mjs",
        "mcp:local:dev": "cross-env NODE_ENV=development tsx src/mcp/local.ts"
    }
}
```

---

## 8. 配置与环境变量

MCP 服务复用项目现有的所有环境变量（见 `src/types.d.ts:3-47`），无新增配置项。

### 本地模式

通过 `dotenv` 加载 `.env.local` / `.env` 文件，或由 MCP 客户端（如 Claude Desktop）注入环境变量。

### 远程模式

通过部署平台（Vercel / Docker）的环境变量配置，或由 Hono 的 `env()` adapter 从 Workers bindings 注入。

---

## 9. 安全设计

### 认证

| 模式 | 认证方式 |
|------|---------|
| 本地 stdio | 无需认证（进程级别访问控制） |
| 远程 HTTP | Bearer Token（`AUTH_TOKEN` 环境变量），未设置则免认证 |

### 敏感信息保护

- MCP Resource `image-uploader://config` 不会暴露密钥、Token 等敏感配置
- Tool handler 的报错信息中不包含堆栈跟踪或系统路径
- 远程模式建议配合 HTTPS 和反向代理限流

### 输入校验

- 所有 Tool 输入参数通过 Zod schema 进行严格校验
- URL 参数使用 `z.string().url()` 防止 SSRF（可通过额外白名单增强）
- Base64 数据大小受 `MAX_BODY_SIZE` 限制

---

## 10. 构建与部署

### 新增构建产物

| 文件 | 说明 |
|------|------|
| `dist/mcp-local.mjs` | 本地 stdio 模式入口 |
| `dist/mcp-local.mjs.map` | Source map |

### 远程模式无需额外构建

远程 MCP 端点作为 Hono 子路由挂载，随现有构建产物一起打包：
- Vercel: `dist/vercel.mjs` 中包含 `/mcp` 路由
- Docker: `dist/index.mjs` 中包含 `/mcp` 路由
- Workers: 不适用（Workers 不支持 stdio，HTTP 模式下 `WebStandardStreamableHTTPServerTransport` 需要 Node.js API）

### 部署注意事项

| 平台 | 本地模式 | 远程模式 | 备注 |
|------|---------|---------|------|
| Docker | ✅ | ✅ | 两者均支持 |
| Vercel | ❌ | ✅ | Serverless 不支持 stdio |
| Cloudflare Workers | ❌ | ❌ | 缺少 Node.js API 支持 |
| 裸机 Node.js | ✅ | ✅ | 两者均支持 |

---

## 11. 测试策略

### 单元测试

- 测试 `createMcpServer()` 创建成功，Tools / Resources 已注册
- 测试各 Tool handler 的参数校验逻辑
- 使用 Vitest mock `StorageFactory` 和 `compressImage`

### 集成测试

- 本地模式：启动 `StdioServerTransport`，通过 MCP Client SDK 调用工具，验证端到端流程
- 远程模式：启动 Hono dev server，通过 HTTP 请求模拟 MCP 通信

### 验证清单

- [ ] `upload_image_from_url` — 传入有效 URL，返回可访问的图片链接
- [ ] `upload_image_from_url` — 传入无效 URL，返回错误信息
- [ ] `upload_image_from_url` — 传入已存在的 S3 URL，直接返回（去重）
- [ ] `upload_image_from_base64` — 传入有效 Base64，返回图片链接
- [ ] `upload_image_from_base64` — 传入 data URI 格式，正确解析
- [ ] `get_runtime_info` — 返回非敏感运行时配置
- [ ] `image-uploader://config` resource — 不泄露密钥
- [ ] 远程端点 — 未设置 AUTH_TOKEN 时免认证可访问
- [ ] 远程端点 — 设置 AUTH_TOKEN 后需 Bearer Token

---

## 12. 客户端使用示例

### Claude Desktop 配置 (本地模式)

```json
{
    "mcpServers": {
        "sharp-cloud-uploader": {
            "command": "node",
            "args": ["/app/dist/mcp-local.mjs"],
            "env": {
                "STORAGE_TYPE": "s3",
                "S3_REGION": "auto",
                "S3_BUCKET_NAME": "images",
                "S3_ACCESS_KEY_ID": "${S3_ACCESS_KEY_ID}",
                "S3_SECRET_ACCESS_KEY": "${S3_SECRET_ACCESS_KEY}",
                "S3_ENDPOINT": "https://xxx.r2.cloudflarestorage.com",
                "S3_BASE_URL": "https://oss.example.com",
                "BUCKET_PREFIX": "uploads/"
            }
        }
    }
}
```

### Cursor / VS Code 配置 (本地模式)

在 `.cursor/mcp.json` 或 VS Code 的 MCP 设置中：

```json
{
    "mcpServers": {
        "sharp-cloud-uploader": {
            "command": "node",
            "args": ["dist/mcp-local.mjs"]
        }
    }
}
```

### 远程 HTTP 调用

```bash
# 初始化 MCP 会话
curl -X POST https://your-app.vercel.app/mcp \
  -H "Authorization: Bearer your-token" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "tools/call",
    "params": {
      "name": "upload_image_from_url",
      "arguments": {
        "url": "https://example.com/photo.jpg",
        "quality": 85
      }
    },
    "id": 1
  }'
```

---

## 13. 依赖变更

### 新增 `dependencies`

| 包名 | 版本 | 说明 |
|------|------|------|
| `@modelcontextprotocol/sdk` | `^1.29.0` | MCP 服务端 SDK |
| `zod` | `^4.0` | MCP SDK 的 peer dependency（用于 Tool input/output schema） |

### 依赖关系

- `@modelcontextprotocol/sdk` 内置依赖 `hono@^4.11.4`，与项目现有 hono 版本兼容
- `@modelcontextprotocol/sdk` 支持 `zod@^3.25 || ^4.0`
- `@modelcontextprotocol/sdk` 已包含 `@modelcontextprotocol/server`、`@modelcontextprotocol/node`、`@modelcontextprotocol/hono` 等子包导出

---

## 14. 风险与限制

| 风险 | 级别 | 缓解措施 |
|------|------|---------|
| Cloudflare Workers 不支持 MCP（缺少 Node.js API） | 中 | 明确文档标注，Gate 检查 `IS_CLOUDFLARE_WORKERS` 时跳过 MCP Server 初始化 |
| Vercel Serverless 冷启动对 MCP 会话的影响 | 低 | 使用无状态模式，每次请求创建新连接 |
| `@modelcontextprotocol/sdk` 与项目现有依赖的版本冲突 | 低 | SDK 依赖较宽松，且 hono 版本兼容 |
| MCP Streamable HTTP 协议变更 | 低 | 固定 SDK 版本，等协议稳定后再升级 |

---

## 15. 总结

本方案在最小侵入现有代码的前提下，为 `sharp-cloud-uploader` 添加了 MCP 协议支持。核心思路是：

1. **复用业务逻辑**：MCP Tool handler 直接调用现有的 `compressImage()`、`StorageFactory` 等函数
2. **双传输模式**：同一个 `McpServer` 定义，通过不同 Transport 适配本地（stdio）和远程（HTTP）
3. **安全分层**：本地信任进程、远程强制认证、敏感信息不暴露

实施后，AI Agent 可以通过标准 MCP 协议直接调用图片压缩上传功能，无需额外集成。
