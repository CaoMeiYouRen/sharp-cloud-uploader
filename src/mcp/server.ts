import { Buffer } from 'buffer'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp'
import * as z from 'zod/v4'
import dayjs from 'dayjs'
import { Bindings } from '../types'
import { getFileType, getFileExtension } from '@/utils/file'
import { getHeaders } from '@/utils/referers'
import { StorageFactory } from '@/libs/storage-factory'
import { compressImage, Format } from '@/utils/sharp'

function getEnvValue(env: Bindings) {
    const STORAGE_TYPE = env.STORAGE_TYPE || 's3'
    const BUCKET_PREFIX = env.BUCKET_PREFIX || ''
    const IMAGE_QUALITY = (() => {
        const parsed = Number.parseInt(env.IMAGE_QUALITY || '', 10)
        if (Number.isNaN(parsed)) {
            return 90
        }
        return Math.min(Math.max(parsed, 1), 100)
    })()
    const MAX_BODY_SIZE = parseInt(env.MAX_BODY_SIZE) || 100 * 1024 * 1024
    const BASE_URL = env.S3_BASE_URL || env.R2_BASE_URL
    return { STORAGE_TYPE, BUCKET_PREFIX, IMAGE_QUALITY, MAX_BODY_SIZE, BASE_URL }
}

export function createMcpServer(env: Bindings): McpServer {
    const server = new McpServer({
        name: 'sharp-cloud-uploader',
        version: '1.3.3',
    })

    server.registerTool(
        'upload_image_from_url',
        {
            description: '从指定的远程 URL 下载图片，使用 sharp 进行智能压缩，上传到云存储（S3/R2/Vercel Blob），返回可访问的图片链接',
            inputSchema: z.object({
                url: z.string().url().describe('图片的远程 URL 地址'),
                quality: z.number().int().min(1).max(100).optional().describe('压缩质量 (1-100)，默认使用服务端配置'),
            }),
        },
        async ({ url, quality }) => {
            const { STORAGE_TYPE, BUCKET_PREFIX, IMAGE_QUALITY, BASE_URL } = getEnvValue(env)
            const finalQuality = quality ?? IMAGE_QUALITY

            // 去重：如果已经是 S3/R2 上的图片，直接返回
            if (BASE_URL && url.startsWith(BASE_URL)) {
                return {
                    content: [{ type: 'text' as const, text: JSON.stringify({ url, status: 200, success: true, deduplicated: true }) }],
                }
            }

            try {
                const headers = getHeaders(url)
                const response = await fetch(url, { headers })
                if (!response.ok) {
                    return {
                        content: [{ type: 'text' as const, text: `下载失败: HTTP ${response.status} ${response.statusText}` }],
                        isError: true,
                    }
                }

                const body = await response.arrayBuffer()
                const contentType = response.headers.get('Content-Type')
                    || await getFileType(Buffer.from(body))
                    || 'application/octet-stream'

                if (!contentType.startsWith('image/')) {
                    return {
                        content: [{ type: 'text' as const, text: `不支持的文件类型: ${contentType}` }],
                        isError: true,
                    }
                }

                const extension = getFileExtension(contentType)
                const timestamp = dayjs().format('YYYYMMDDHHmmssSSS')
                const random = Math.random().toString(36).slice(2, 9)
                const key = `${BUCKET_PREFIX}${timestamp}-${random}.${extension}`

                const storage = StorageFactory.getStorage(STORAGE_TYPE, env)
                const compressedBody = await compressImage(Buffer.from(body), extension as Format, finalQuality)
                const result = await storage.upload(compressedBody, key, contentType)

                return {
                    content: [{ type: 'text' as const, text: JSON.stringify({ ...result, success: true, status: 200 }) }],
                }
            } catch (error) {
                return {
                    content: [{ type: 'text' as const, text: `上传失败: ${error instanceof Error ? error.message : String(error)}` }],
                    isError: true,
                }
            }
        },
    )

    server.registerTool(
        'upload_image_from_base64',
        {
            description: '接收 Base64 编码的图片数据（支持 data URI 格式），使用 sharp 压缩后上传到云存储，返回可访问的图片链接',
            inputSchema: z.object({
                base64: z.string().describe('Base64 编码的图片数据，支持 `data:image/xxx;base64,...` data URI 格式'),
                quality: z.number().int().min(1).max(100).optional().describe('压缩质量 (1-100)，默认使用服务端配置'),
                filename: z.string().optional().describe('自定义文件名（不含路径前缀），不传则自动生成'),
            }),
        },
        async ({ base64, quality, filename }) => {
            const { STORAGE_TYPE, BUCKET_PREFIX, IMAGE_QUALITY, MAX_BODY_SIZE } = getEnvValue(env)
            const finalQuality = quality ?? IMAGE_QUALITY

            try {
                // 处理 data URI 格式
                let base64Data = base64
                let detectedContentType: string | undefined
                const dataUriMatch = base64Data.match(/^data:([^;]+);base64,(.+)$/)
                if (dataUriMatch) {
                    detectedContentType = dataUriMatch[1]
                    base64Data = dataUriMatch[2]
                }

                const body = Buffer.from(base64Data, 'base64')

                if (body.byteLength > MAX_BODY_SIZE) {
                    return {
                        content: [{ type: 'text' as const, text: `图片大小超过限制 (${MAX_BODY_SIZE} bytes)` }],
                        isError: true,
                    }
                }

                const contentType = detectedContentType
                    || await getFileType(body)
                    || 'application/octet-stream'

                if (!contentType.startsWith('image/')) {
                    return {
                        content: [{ type: 'text' as const, text: `不支持的文件类型: ${contentType}` }],
                        isError: true,
                    }
                }

                const extension = getFileExtension(contentType)
                const timestamp = dayjs().format('YYYYMMDDHHmmssSSS')
                const random = Math.random().toString(36).slice(2, 9)
                const key = filename
                    ? `${BUCKET_PREFIX}${filename}`
                    : `${BUCKET_PREFIX}${timestamp}-${random}.${extension}`

                const storage = StorageFactory.getStorage(STORAGE_TYPE, env)
                const compressedBody = await compressImage(body, extension as Format, finalQuality)
                const result = await storage.upload(compressedBody, key, contentType)

                return {
                    content: [{ type: 'text' as const, text: JSON.stringify({ ...result, success: true, status: 200 }) }],
                }
            } catch (error) {
                return {
                    content: [{ type: 'text' as const, text: `上传失败: ${error instanceof Error ? error.message : String(error)}` }],
                    isError: true,
                }
            }
        },
    )

    server.registerTool(
        'get_runtime_info',
        {
            description: '获取图片上传服务的运行状态和配置信息',
            inputSchema: z.object({}).strict(),
        },
        async () => {
            const { STORAGE_TYPE, BUCKET_PREFIX, IMAGE_QUALITY, MAX_BODY_SIZE } = getEnvValue(env)
            return {
                content: [{
                    type: 'text' as const,
                    text: JSON.stringify({
                        storageType: STORAGE_TYPE,
                        bucketPrefix: BUCKET_PREFIX,
                        defaultQuality: IMAGE_QUALITY,
                        maxBodySize: MAX_BODY_SIZE,
                        nodeVersion: process.version,
                        version: '1.3.3',
                    }),
                }],
            }
        },
    )

    server.registerResource(
        'config',
        'image-uploader://config',
        {
            title: 'Image Uploader Configuration',
            mimeType: 'application/json',
        },
        async () => {
            const { STORAGE_TYPE, BUCKET_PREFIX, IMAGE_QUALITY, MAX_BODY_SIZE } = getEnvValue(env)
            return {
                contents: [{
                    uri: 'image-uploader://config',
                    mimeType: 'application/json',
                    text: JSON.stringify({
                        storageType: STORAGE_TYPE,
                        bucketPrefix: BUCKET_PREFIX,
                        defaultQuality: IMAGE_QUALITY,
                        maxBodySize: MAX_BODY_SIZE,
                        timeout: parseInt(env.TIMEOUT) || 60000,
                        version: '1.3.3',
                    }, null, 2),
                }],
            }
        },
    )

    return server
}
