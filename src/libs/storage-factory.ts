import { S3Storage } from './s3'
import { VercelBlobStorage } from './vercel-blob'
import { Storage } from './storage'
import { R2Storage } from './r2'
import { Bindings } from '@/types'

export class StorageFactory {
    static getStorage(type: string, env: Bindings): Storage {
        switch (type) {
            case 's3':
                return new S3Storage(env)
            case 'vercel-blob':
                return new VercelBlobStorage(env)
            case 'r2':
                return new R2Storage(env)
            default:
                throw new Error('Unsupported storage type')
        }
    }
}
