# sharp-cloud-uploader

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
