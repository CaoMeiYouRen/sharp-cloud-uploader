import { R2Bucket } from '@cloudflare/workers-types'

export type Bindings = {
    // 运行环境，可选值：development, production
    NODE_ENV: string
    // 运行端口
    PORT: string
    // 是否写入日志到文件
    LOGFILES: string
    // 日志级别，可选值：silly, debug, verbose, info, http, warn, error, fatal
    LOG_LEVEL: string
    // 超时时间(ms)
    TIMEOUT: string
    // 最大请求体大小(字节)，默认 100MB
    MAX_BODY_SIZE: string
    // 图片压缩质量(1-100)
    IMAGE_QUALITY: string
    // 授权密钥（Bearer 认证）
    AUTH_TOKEN: string
    // 文件名前缀
    BUCKET_PREFIX: string
    // 存储类型，s3 或 vercel-blob
    STORAGE_TYPE: 's3' | 'vercel-blob' | 'r2'

    // S3 基础 URL
    S3_BASE_URL: string
    // S3 区域
    S3_REGION: string
    // S3 存储桶名称
    S3_BUCKET_NAME: string
    // S3 访问密钥 ID
    S3_ACCESS_KEY_ID: string
    // S3 秘密访问密钥
    S3_SECRET_ACCESS_KEY: string
    // S3 端点
    S3_ENDPOINT: string

    // Vercel Blob 令牌
    VERCEL_BLOB_TOKEN: string
    // Vercel Blob 读写令牌
    BLOB_READ_WRITE_TOKEN: string

    // R2 存储桶，仅 Cloudflare Workers 绑定 Cloudflare R2 Storage 可用
    R2_BUCKET: R2Bucket
    // R2 基础 URL
    R2_BASE_URL: string
}
