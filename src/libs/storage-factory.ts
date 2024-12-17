import { S3Storage } from './s3'
import { VercelBlobStorage } from './vercel-blob'
import { Storage } from './storage'
import { Bindings } from '@/types'

export class StorageFactory {
    static getStorage(type: string, env: Bindings): Storage {
        switch (type) {
            case 's3':
                return new S3Storage(env)
            case 'vercel-blob':
                return new VercelBlobStorage(env)
            default:
                throw new Error('Unsupported storage type')
        }
    }
}
