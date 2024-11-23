import { put } from '@vercel/blob'
import { Storage } from './storage'
import { getFileType } from '@/utils/file'

/**
 * Vercel Blob 存储
 * 需要设置 VERCEL_BLOB_TOKEN 或 BLOB_READ_WRITE_TOKEN
 */
export class VercelBlobStorage extends Storage {
    async upload(buffer: Buffer, filename: string, contentType?: string): Promise<{ url: string }> {
        // Vercel Blob 上传逻辑
        const { url } = await put(filename, buffer, {
            token: process.env.VERCEL_BLOB_TOKEN || process.env.BLOB_READ_WRITE_TOKEN,
            access: 'public',
            contentType: contentType || await getFileType(buffer) || 'application/octet-stream',
            addRandomSuffix: false,
        })
        return { url }
    }
}
