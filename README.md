<h1 align="center">sharp-cloud-uploader </h1>
<p>
  <img alt="Version" src="https://img.shields.io/github/package-json/v/CaoMeiYouRen/sharp-cloud-uploader.svg" />
  <a href="https://hub.docker.com/r/caomeiyouren/sharp-cloud-uploader" target="_blank">
    <img alt="Docker Pulls" src="https://img.shields.io/docker/pulls/caomeiyouren/sharp-cloud-uploader">
  </a>
  <a href="https://app.codecov.io/gh/CaoMeiYouRen/sharp-cloud-uploader" target="_blank">
    <img alt="Codecov" src="https://img.shields.io/codecov/c/github/CaoMeiYouRen/sharp-cloud-uploader">
  </a>
  <a href="https://github.com/CaoMeiYouRen/sharp-cloud-uploader/actions?query=workflow%3ARelease" target="_blank">
    <img alt="GitHub Workflow Status" src="https://img.shields.io/github/actions/workflow/status/CaoMeiYouRen/sharp-cloud-uploader/release.yml?branch=master">
  </a>
  <img src="https://img.shields.io/badge/node-%3E%3D18-blue.svg" />
  <a href="https://github.com/CaoMeiYouRen/sharp-cloud-uploader#readme" target="_blank">
    <img alt="Documentation" src="https://img.shields.io/badge/documentation-yes-brightgreen.svg" />
  </a>
  <a href="https://github.com/CaoMeiYouRen/sharp-cloud-uploader/graphs/commit-activity" target="_blank">
    <img alt="Maintenance" src="https://img.shields.io/badge/Maintained%3F-yes-green.svg" />
  </a>
  <a href="https://github.com/CaoMeiYouRen/sharp-cloud-uploader/blob/master/LICENSE" target="_blank">
    <img alt="License: MIT" src="https://img.shields.io/github/license/CaoMeiYouRen/sharp-cloud-uploader?color=yellow" />
  </a>
</p>

> 一个使用 sharp 进行图片压缩，并上传文件到 R2、S3 或 Vercel Blob 的云函数。支持 Vercel Functions/Cloudflare Workers/Docker 等方式部署。

## 🏠 主页

[https://github.com/CaoMeiYouRen/sharp-cloud-uploader#readme](https://github.com/CaoMeiYouRen/sharp-cloud-uploader#readme)

## 📦 依赖要求

-   node >=18

## 🚀 部署

### Vercel 部署（推荐）

> 如果遇到了接口长时间无响应/超时的问题，请在 Vercel 控制台中将环境变量`NODEJS_HELPERS`设置为 `0` 后，重新部署，再进行测试。

点击以下按钮一键部署到 Vercel。

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FCaoMeiYouRen%2Fsharp-cloud-uploader.git)

> 如果使用 `Vercel Blob` 作为存储，请参考 [Vercel Blob](https://vercel.com/docs/storage/vercel-blob) 有关文档。

### Cloudflare Workers 部署

点击下方按钮一键部署到 Cloudflare Workers。

[![Deploy to Cloudflare Workers](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/CaoMeiYouRen/sharp-cloud-uploader)

**注意：由于 Cloudflare Workers 不支持 sharp，所以在 Cloudflare Workers 部署时，图片不会经过 sharp 压缩，仅转存原图。**

> 如果想存储到 R2，请将 `STORAGE` 设置为 `r2`，并修改 wrangler.toml 中的 r2_buckets 相关配置。

### Docker 镜像

支持两种注册表：

-   Docker Hub: [`caomeiyouren/sharp-cloud-uploader`](https://hub.docker.com/r/caomeiyouren/sharp-cloud-uploader)
-   GitHub: [`ghcr.io/caomeiyouren/sharp-cloud-uploader`](https://github.com/CaoMeiYouRen/sharp-cloud-uploader/pkgs/container/sharp-cloud-uploader)

支持以下架构：

-   `linux/amd64`
-   `linux/arm64`

有以下几种 tags：

| Tag            | 描述     | 举例          |
| :------------- | :------- | :------------ |
| `latest`       | 最新     | `latest`      |
| `{YYYY-MM-DD}` | 特定日期 | `2024-06-07`  |
| `{sha-hash}`   | 特定提交 | `sha-0891338` |
| `{version}`    | 特定版本 | `1.2.3`       |

### Docker Compose 部署

下载 [docker-compose.yml](https://github.com/CaoMeiYouRen/sharp-cloud-uploader/blob/master/docker-compose.yml)

```sh
wget https://raw.githubusercontent.com/CaoMeiYouRen/sharp-cloud-uploader/refs/heads/master/docker-compose.yml
```

检查有无需要修改的配置

```sh
vim docker-compose.yml  # 也可以是你喜欢的编辑器
```

> 在公网部署时建议设置 AUTH_TOKEN 环境变量，以避免被他人滥用。
>
> 请修改 docker-compose.yml 文件中的 environment 字段修改环境变量。

启动

```sh
docker-compose up -d
```

在浏览器中打开 `http://{Server IP}:3000` 即可查看结果

### Node.js 部署

确保本地已安装 Node.js 和 pnpm。

```sh
# 下载源码
git clone https://github.com/CaoMeiYouRen/sharp-cloud-uploader.git  --depth=1
cd sharp-cloud-uploader
# 安装依赖
pnpm i --frozen-lockfile
# 构建项目
pnpm build
# 启动项目
pnpm start
```

在浏览器中打开 `http://{Server IP}:3000` 即可查看结果

> 请修改 .env 文件修改环境变量。

## 👨‍💻 使用

如果在本地部署，基础路径为 `http://localhost:3000`

在服务器或云函数部署则为 `http(s)://{Server IP}`。

例如：

如果基础路径为 `https://example.vercel.app`，则 `//upload-from-url` 的完整路径为 `https://example.vercel.app/upload-from-url`

### 1. 上传图片接口

#### 1.1 从 URL 上传图片

接口路径: `/upload-from-url`

请求方法: `POST`

请求参数:

-   `url`: 图片的 URL 地址 (必填)

请求示例:

```json
{
    "url": "https://example.com/image.jpg"
}
```

响应示例:

```json
{
    "url": "https://example.com/bucket-prefix/20231001123456789-abcdefg.jpg",
    "success": true,
    "status": 200
}
```

错误响应示例:

```json
{
    "status": 400,
    "message": "URL is required"
}
```

#### 1.2 从请求体上传图片

接口路径: `/upload-from-body`

请求方法: `POST`

请求参数:

-   图片数据: 二进制数据 (必填)

请求示例:

```bash
curl -X POST -H "Content-Type: image/jpeg" --data-binary @image.jpg http://localhost:3000/upload-from-body
```

响应示例:

```json
{
    "url": "https://example.com/bucket-prefix/20231001123456789-abcdefg.jpg",
    "success": true,
    "status": 200
}
```

错误响应示例:

```json
{
    "status": 400,
    "message": "Invalid image format"
}
```

### 2. 代码示例

#### 2.1 使用 fetch 从 URL 上传图片

```ts
const uploadFromUrl = async () => {
    const url = "https://example.com/image.jpg";
    const response = await fetch("http://localhost:3000/upload-from-url", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ url }),
    });
    const data = await response.json();
    console.log(data);
};

uploadFromUrl();
```

#### 2.2 使用 `fetch` 从请求体上传图片

```javascript
const uploadFromBody = async () => {
    const imageFile = document.getElementById("image-file").files[0];
    const reader = new FileReader();
    reader.onload = async () => {
        const response = await fetch("http://localhost:3000/upload-from-body", {
            method: "POST",
            headers: {
                "Content-Type": imageFile.type,
            },
            body: reader.result,
        });
        const data = await response.json();
        console.log(data);
    };
    reader.readAsArrayBuffer(imageFile);
};

uploadFromBody();
```

### 环境变量配置

请参考 [.env](./src/.env) 文件中的注释。

```ini
# 运行端口
PORT=3000

# 超时时间(ms)
# 如果在 vercel 中运行，则还要修改 vercel.json 中的 maxDuration 字段(单位：秒)
TIMEOUT=60000

NODEJS_HELPERS=0
# 是否写入日志到文件
LOGFILES=false

# 日志级别
# LOG_LEVEL=http

# 最大请求体大小(字节)，默认 100MB
# 受 Vercel Functions 的限制，通过请求体上传时最大不超过 4.5 MB（通过 url 上传则不受限制），详见 https://vercel.com/docs/storage/vercel-blob/server-upload
# 受 Cloudflare Workers 的限制，通过请求体上传时最大不超过 100 MB（通过 url 上传则不受限制），详见 https://developers.cloudflare.com/workers/platform/limits
# MAX_BODY_SIZE=104857600

# 图片压缩质量(1-100)，默认 90
# IMAGE_QUALITY=90

# 授权密钥（Bearer 认证）。可选，如果设置，则所有请求都需要携带此密钥
AUTH_TOKEN=

# 文件名前缀
# BUCKET_PREFIX=

# 存储类型，可选值：s3, r2, vercel-blob
# 如果服务部署在 Cloudflare Workers，并且想要存储到 R2，则可以设置为 'r2'，此时需要修改 wrangler.toml 中的 r2_buckets 相关配置；
# 如果服务部署在其他平台，想要存储到 R2，请使用 R2 的 S3 兼容接口，参考 https://developers.cloudflare.com/r2/api/s3/api，此时设置为 's3'
# STORAGE_TYPE=s3

# S3 基础 URL
# S3_BASE_URL=

# S3 区域
# S3_REGION=

# S3 存储桶名称
# S3_BUCKET_NAME=

# S3 访问密钥 ID
# S3_ACCESS_KEY_ID=

# S3 秘密访问密钥
# S3_SECRET_ACCESS_KEY=

# S3 端点
# S3_ENDPOINT=

# Vercel Blob 令牌，参考 https://vercel.com/docs/storage/vercel-blob
# VERCEL_BLOB_TOKEN=

# R2 基础 URL，仅 Cloudflare Workers 绑定 Cloudflare R2 Storage 可用
# R2_BASE_URL=
```

## 🛠️ 开发

```sh
npm run dev
```

## 🔧 编译

```sh
npm run build
```

## 🔍 Lint

```sh
npm run lint
```

## 💾 Commit

```sh
npm run commit
```

## 👤 作者

**CaoMeiYouRen**

-   Website: [https://blog.cmyr.ltd/](https://blog.cmyr.ltd/)

-   GitHub: [@CaoMeiYouRen](https://github.com/CaoMeiYouRen)

## 🤝 贡献

欢迎 贡献、提问或提出新功能！<br />如有问题请查看 [issues page](https://github.com/CaoMeiYouRen/sharp-cloud-uploader/issues). <br/>贡献或提出新功能可以查看[contributing guide](https://github.com/CaoMeiYouRen/sharp-cloud-uploader/blob/master/CONTRIBUTING.md).

## 💰 支持

如果觉得这个项目有用的话请给一颗 ⭐️，非常感谢

<a href="https://afdian.com/@CaoMeiYouRen">
  <img src="https://cdn.jsdelivr.net/gh/CaoMeiYouRen/image-hosting-01@master/images/202306192324870.png" width="312px" height="78px" alt="在爱发电支持我">
</a>

<a href="https://patreon.com/CaoMeiYouRen">
    <img src="https://cdn.jsdelivr.net/gh/CaoMeiYouRen/image-hosting-01@master/images/202306142054108.svg" width="312px" height="78px" alt="become a patreon"/>
</a>

## 🌟 Star History

[![Star History Chart](https://api.star-history.com/svg?repos=CaoMeiYouRen/sharp-cloud-uploader&type=Date)](https://star-history.com/#CaoMeiYouRen/sharp-cloud-uploader&Date)

## 📝 License

Copyright © 2024 [CaoMeiYouRen](https://github.com/CaoMeiYouRen).<br />
This project is [MIT](https://github.com/CaoMeiYouRen/sharp-cloud-uploader/blob/master/LICENSE) licensed.

---

_This README was generated with ❤️ by [cmyr-template-cli](https://github.com/CaoMeiYouRen/cmyr-template-cli)_
