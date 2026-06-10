# sharp-cloud-uploader

## [1.3.2](https://github.com/CaoMeiYouRen/sharp-cloud-uploader/compare/v1.3.1...v1.3.2) (2026-06-10)


### 🐛 Bug 修复

* **vercel:** 更新 Hono 导入路径 ([5107584](https://github.com/CaoMeiYouRen/sharp-cloud-uploader/commit/5107584))

## [1.3.1](https://github.com/CaoMeiYouRen/sharp-cloud-uploader/compare/v1.3.0...v1.3.1) (2025-11-19)


### 🐛 Bug 修复

* update pnpm overrides to fix all Dependabot alerts ([b7eeaaf](https://github.com/CaoMeiYouRen/sharp-cloud-uploader/commit/b7eeaaf))

# [1.3.0](https://github.com/CaoMeiYouRen/sharp-cloud-uploader/compare/v1.2.0...v1.3.0) (2025-11-11)


### ✨ 新功能

* **compressImage:** 为图像压缩添加 CPU 压缩级别参数 ([736d8d1](https://github.com/CaoMeiYouRen/sharp-cloud-uploader/commit/736d8d1))
* **image:** 添加图片压缩质量配置，默认值为 90 ([6847ffd](https://github.com/CaoMeiYouRen/sharp-cloud-uploader/commit/6847ffd))

# [1.2.0](https://github.com/CaoMeiYouRen/sharp-cloud-uploader/compare/v1.1.3...v1.2.0) (2025-09-21)


### ✨ 新功能

* **sharp:** 添加对GIF格式的支持，更新文件类型映射 ([49881d7](https://github.com/CaoMeiYouRen/sharp-cloud-uploader/commit/49881d7))

## [1.1.3](https://github.com/CaoMeiYouRen/sharp-cloud-uploader/compare/v1.1.2...v1.1.3) (2025-07-15)


### 🐛 Bug 修复

* **s3:** 修正s3客户端端点配置问题 ([9181ed0](https://github.com/CaoMeiYouRen/sharp-cloud-uploader/commit/9181ed0))

## [1.1.2](https://github.com/CaoMeiYouRen/sharp-cloud-uploader/compare/v1.1.1...v1.1.2) (2025-01-10)


### 🐛 Bug 修复

* **sharp:** 修复SVG格式的支持，直接返回原图 ([1db3474](https://github.com/CaoMeiYouRen/sharp-cloud-uploader/commit/1db3474))

## [1.1.1](https://github.com/CaoMeiYouRen/sharp-cloud-uploader/compare/v1.1.0...v1.1.1) (2024-12-17)


### 🐛 Bug 修复

* **routes:** 支持从多个存储服务返回文件链接 ([dcfd9c0](https://github.com/CaoMeiYouRen/sharp-cloud-uploader/commit/dcfd9c0))

# [1.1.0](https://github.com/CaoMeiYouRen/sharp-cloud-uploader/compare/v1.0.2...v1.1.0) (2024-12-17)


### ✨ 新功能

* **storage:** 添加对 R2 存储的支持 ([3e7c9ed](https://github.com/CaoMeiYouRen/sharp-cloud-uploader/commit/3e7c9ed))
* 将 S3 /Vercel Blob 配置从环境变量迁移到 Bindings 对象 ([1e4d069](https://github.com/CaoMeiYouRen/sharp-cloud-uploader/commit/1e4d069))


### 🐛 Bug 修复

* **routes:** add S3 URL check before upload ([a3a078f](https://github.com/CaoMeiYouRen/sharp-cloud-uploader/commit/a3a078f))

## [1.0.2](https://github.com/CaoMeiYouRen/sharp-cloud-uploader/compare/v1.0.1...v1.0.2) (2024-11-23)


### 🐛 Bug 修复

* **libs:** 简化上传方法返回值；修复文档中的错误响应示例 ([fb90e74](https://github.com/CaoMeiYouRen/sharp-cloud-uploader/commit/fb90e74))

## [1.0.1](https://github.com/CaoMeiYouRen/sharp-cloud-uploader/compare/v1.0.0...v1.0.1) (2024-11-23)


### 🐛 Bug 修复

* 更新上传方法返回类型；在上传方法返回类型中添加 `success` 字段，表示上传是否成功 ([ac9d96a](https://github.com/CaoMeiYouRen/sharp-cloud-uploader/commit/ac9d96a))

# 1.0.0 (2024-11-23)


### ♻ 代码重构

* **s3:** move s3 client initialization to class constructor ([84603a5](https://github.com/CaoMeiYouRen/sharp-cloud-uploader/commit/84603a5))


### ✨ 新功能

* **s3:** add S3 storage support ([84ff997](https://github.com/CaoMeiYouRen/sharp-cloud-uploader/commit/84ff997))
* 添加 Cloudflare Workers 支持；更新部署说明；添加 Cloudflare Workers 配置 ([842e74b](https://github.com/CaoMeiYouRen/sharp-cloud-uploader/commit/842e74b))
* 添加授权密钥和存储配置；优化 S3 存储配置；添加 Bearer 认证和文件名生成逻辑；优化图片压缩函数 ([e198eef](https://github.com/CaoMeiYouRen/sharp-cloud-uploader/commit/e198eef))
