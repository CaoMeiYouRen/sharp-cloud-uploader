import { put } from '@vercel/blob'
import { Storage } from './storage'
import { getFileType } from '@/utils/file'

/**
 * Vercel Blob 存储
 * 需要设置 VERCEL_BLOB_TOKEN
 */
export class VercelBlobStorage extends Storage {
    async upload(buffer: Buffer, filename: string, contentType?: string): Promise<{ url: string }> {
        // Vercel Blob 上传逻辑
        const { url } = await put(filename, buffer, {
            access: 'public',
            contentType: contentType || await getFileType(buffer) || 'application/octet-stream',
            addRandomSuffix: false,
        })
        return { url }
    }
}
