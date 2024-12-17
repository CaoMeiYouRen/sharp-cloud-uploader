
import { Storage } from './storage'
import { Bindings } from '@/types'

export class R2Storage extends Storage {

    private env: Bindings

    constructor(env: Bindings) {
        super()
        this.env = env
    }
    async upload(buffer: Buffer, filename: string, contentType?: string): Promise<{ url: string }> {
        const R2_BUCKET = this.env.R2_BUCKET
        const R2_BASE_URL = this.env.R2_BASE_URL
        await R2_BUCKET.put(filename, buffer, {
            httpMetadata: { contentType },
            customMetadata: {
                uploader: 'sharp-cloud-uploader',
            },
        })
        const url = new URL(filename, R2_BASE_URL)
        return { url: url.toString() }
    }
}
