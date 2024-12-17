import { put } from '@vercel/blob'
import { Storage } from './storage'
import { getFileType } from '@/utils/file'
import { Bindings } from '@/types'

/**
 * Vercel Blob 存储
 * 需要设置 VERCEL_BLOB_TOKEN 或 BLOB_READ_WRITE_TOKEN
 */
export class VercelBlobStorage extends Storage {
    private env: Bindings

    constructor(env: Bindings) {
        super()
        this.env = env
    }

    async upload(buffer: Buffer, filename: string, contentType?: string): Promise<{ url: string }> {
        // Vercel Blob 上传逻辑
        const { url } = await put(filename, buffer, {
            token: this.env.VERCEL_BLOB_TOKEN || this.env.BLOB_READ_WRITE_TOKEN,
            access: 'public',
            contentType,
            addRandomSuffix: false,
        })
        return { url }
    }
}
