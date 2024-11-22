import { S3Client, PutObjectCommand, PutObjectCommandInput } from '@aws-sdk/client-s3'
import { Storage } from './storage'
import { getFileType } from '@/utils/file'

const S3_BASE_URL = process.env.S3_BASE_URL || `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.S3_REGION}.amazonaws.com`

/**
 * S3 存储
 * 需要设置 S3_BUCKET_NAME, S3_REGION, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY，可选 S3_BASE_URL
 */
export class S3Storage extends Storage {
    private s3Client: S3Client

    constructor() {
        super()
        this.s3Client = new S3Client({
            region: process.env.S3_REGION,
            endpoint: process.env.S3_ENDPOINT || `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.S3_REGION}.amazonaws.com`,
            credentials: {
                accessKeyId: process.env.S3_ACCESS_KEY_ID,
                secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
            },
        })
    }

    async upload(buffer: Buffer, filename: string, contentType?: string): Promise<{ url: string }> {
        // S3 上传逻辑
        const params: PutObjectCommandInput = {
            Bucket: process.env.S3_BUCKET_NAME,
            Key: filename,
            Body: buffer,
            ContentType: contentType || await getFileType(buffer) || 'application/octet-stream',
        }

        const command = new PutObjectCommand(params)
        await this.s3Client.send(command)
        const url = new URL(filename, S3_BASE_URL)
        return { url: url.toString() }
    }
}
