import { S3Client, PutObjectCommand, PutObjectCommandInput } from '@aws-sdk/client-s3'
import { Storage } from './storage'
import { getFileType } from '@/utils/file'
import { Bindings } from '@/types'

/**
 * S3 存储
 * 需要设置 S3_BUCKET_NAME, S3_REGION, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY，可选 S3_BASE_URL
 */
export class S3Storage extends Storage {
    private s3Client: S3Client
    private env: Bindings

    constructor(env: Bindings) {
        super()
        this.env = env
        this.env.S3_BASE_URL = env.S3_BASE_URL || `https://${env.S3_BUCKET_NAME}.s3.${env.S3_REGION}.amazonaws.com`
        this.env.S3_ENDPOINT = env.S3_ENDPOINT || `https://${env.S3_BUCKET_NAME}.s3.${env.S3_REGION}.amazonaws.com`
        this.s3Client = new S3Client({
            region: env.S3_REGION,
            endpoint: this.env.S3_ENDPOINT,
            credentials: {
                accessKeyId: env.S3_ACCESS_KEY_ID,
                secretAccessKey: env.S3_SECRET_ACCESS_KEY,
            },
        })
    }

    async upload(buffer: Buffer, filename: string, contentType?: string): Promise<{ url: string }> {
        // S3 上传逻辑
        const params: PutObjectCommandInput = {
            Bucket: this.env.S3_BUCKET_NAME,
            Key: filename,
            Body: buffer,
            ContentType: contentType,
        }

        const command = new PutObjectCommand(params)
        await this.s3Client.send(command)
        const url = new URL(filename, this.env.S3_BASE_URL)
        return { url: url.toString() }
    }
}
