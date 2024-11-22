export type Bindings = {
    NODE_ENV: string
    PORT: string
    LOGFILES: string
    LOG_LEVEL: string
    TIMEOUT: string
    MAX_BODY_SIZE: string
    // 文件名前缀
    BUCKET_PREFIX: string
    // 存储类型，s3 或 vercel-blob
    STORAGE_TYPE: string
}
