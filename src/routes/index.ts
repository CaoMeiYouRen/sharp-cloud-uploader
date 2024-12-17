import { Buffer } from 'buffer'
import { Context, Hono } from 'hono'
import { env } from 'hono/adapter'
import dayjs from 'dayjs'
import { BlankInput } from 'hono/types'
import { bearerAuth } from 'hono/bearer-auth'
import { Bindings } from '../types'
import { getFileType, getFileExtension } from '@/utils/file'
import { getHeaders } from '@/utils/referers'
import { StorageFactory } from '@/libs/storage-factory'
import { compressImage, Format } from '@/utils/sharp'

const app = new Hono<{ Bindings: Bindings }>()

app.on('POST', ['/upload-from-url', '/upload-from-body'], (c, next) => {
    const authToken = env(c).AUTH_TOKEN
    if (authToken) { // 如果设置了授权密钥，则进行 Bearer 认证，否则跳过
        return bearerAuth({ token: authToken })(c, next)
    }
    return next()
})

const handleUpload = async (c: Context<{ Bindings: Bindings }, string, BlankInput>, body: ArrayBuffer, contentType: string) => {
    const envValue = env(c)
    const MAX_BODY_SIZE = parseInt(envValue.MAX_BODY_SIZE) || 100 * 1024 * 1024
    const BUCKET_PREFIX = envValue.BUCKET_PREFIX || ''
    const STORAGE_TYPE = envValue.STORAGE_TYPE || 's3'

    if (!contentType || !contentType.startsWith('image/')) {
        return c.json({ error: 'Invalid image format' }, 400)
    }

    const contentLength = parseInt(c.req.header('Content-Length')) || body.byteLength
    if (contentLength && contentLength > MAX_BODY_SIZE) {
        return c.json({ error: 'Image size exceeds the limit' }, 400)
    }

    const extension = getFileExtension(contentType)
    const timestamp = dayjs().format('YYYYMMDDHHmmssSSS') // 时间戳
    const random = Math.random().toString(36).slice(2, 9) // 随机字符串，避免文件名冲突
    const key = `${BUCKET_PREFIX}${timestamp}-${random}.${extension}` // 文件名
    const storage = StorageFactory.getStorage(STORAGE_TYPE, envValue)
    const compressedBody = await compressImage(Buffer.from(body), extension as Format, 90) // 压缩图片
    const result = await storage.upload(compressedBody, key, contentType)
    return c.json({ ...result, success: true, status: 200 }, 200)
}

// 从URL转存图片
app.post('/upload-from-url', async (c) => {
    const { url } = await c.req.json()
    if (!url) {
        return c.json({ error: 'URL is required' }, 400)
    }
    const S3_BASE_URL = env(c).S3_BASE_URL
    if (S3_BASE_URL && url.startsWith(S3_BASE_URL)) { // 如果已经保存到 S3，直接返回
        return c.json({ url, status: 200 }, 200)
    }
    const headers = getHeaders(url)
    const response = await fetch(url, { headers })
    const body = await response.arrayBuffer()
    const contentType = response.headers.get('Content-Type') || await getFileType(Buffer.from(body)) // 如果没有Content-Type头，尝试从body中检测
    return handleUpload(c, body, contentType)
})

// 从请求body中转存图片
app.post('/upload-from-body', async (c) => {
    const body = await c.req.arrayBuffer()
    const contentType = c.req.header('Content-Type') || await getFileType(Buffer.from(body)) // 如果没有Content-Type头，尝试从body中检测
    return handleUpload(c, body, contentType)
})

export default app
