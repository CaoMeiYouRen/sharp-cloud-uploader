import { S3Storage } from './s3'
import { VercelBlobStorage } from './vercel-blob'

export abstract class Storage {
    abstract upload(buffer: Buffer, filename: string, contentType?: string): Promise<{ url: string }>
}

export class StorageFactory {
    static getStorage(type: string): Storage {
        switch (type) {
            case 's3':
                return new S3Storage()
            case 'vercel-blob':
                return new VercelBlobStorage()
            default:
                throw new Error('Unsupported storage type')
        }
    }
}
