import { describe, it, expect, vi } from 'vitest'
import { StorageFactory } from '@/libs/storage-factory'
import { S3Storage } from '@/libs/s3'
import { VercelBlobStorage } from '@/libs/vercel-blob'
import { R2Storage } from '@/libs/r2'
import { Bindings } from '@/types'

const baseEnv: Bindings = {
    NODE_ENV: 'test',
    PORT: '3000',
    LOGFILES: 'false',
    LOG_LEVEL: 'error',
    TIMEOUT: '60000',
    MAX_BODY_SIZE: '104857600',
    IMAGE_QUALITY: '90',
    AUTH_TOKEN: '',
    BUCKET_PREFIX: 'test/',
    STORAGE_TYPE: 's3',
    S3_BASE_URL: 'https://test-bucket.s3.us-east-1.amazonaws.com',
    S3_REGION: 'us-east-1',
    S3_BUCKET_NAME: 'test-bucket',
    S3_ACCESS_KEY_ID: 'test-key',
    S3_SECRET_ACCESS_KEY: 'test-secret',
    S3_ENDPOINT: 'https://test-bucket.s3.us-east-1.amazonaws.com',
    VERCEL_BLOB_TOKEN: 'test-blob-token',
    BLOB_READ_WRITE_TOKEN: '',
    R2_BUCKET: undefined as never,
    R2_BASE_URL: 'https://r2.example.com',
}

describe('StorageFactory', () => {
    it('returns S3Storage for type s3', () => {
        const storage = StorageFactory.getStorage('s3', baseEnv)
        expect(storage).toBeInstanceOf(S3Storage)
    })

    it('returns VercelBlobStorage for type vercel-blob', () => {
        const storage = StorageFactory.getStorage('vercel-blob', baseEnv)
        expect(storage).toBeInstanceOf(VercelBlobStorage)
    })

    it('returns R2Storage for type r2 with R2_BUCKET', () => {
        const env = { ...baseEnv, R2_BUCKET: { put: vi.fn() } as unknown as Bindings['R2_BUCKET'] }
        const storage = StorageFactory.getStorage('r2', env)
        expect(storage).toBeInstanceOf(R2Storage)
    })

    it('throws for unsupported type', () => {
        expect(() => StorageFactory.getStorage('unsupported' as never, baseEnv)).toThrow('Unsupported storage type')
    })
})
