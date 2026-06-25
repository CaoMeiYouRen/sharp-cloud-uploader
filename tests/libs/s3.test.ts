import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Bindings } from '@/types'

const mockSend = vi.fn().mockResolvedValue({})

vi.mock('@aws-sdk/client-s3', () => ({
    S3Client: class {
        send = mockSend
    },
    PutObjectCommand: class {},
}))

const testEnv: Bindings = {
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
    S3_ENDPOINT: '',
    VERCEL_BLOB_TOKEN: '',
    BLOB_READ_WRITE_TOKEN: '',
    R2_BUCKET: undefined as never,
    R2_BASE_URL: '',
}

describe('S3Storage', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('constructs without error', async () => {
        const { S3Storage } = await import('@/libs/s3')
        const storage = new S3Storage(testEnv)
        expect(storage).toBeInstanceOf(S3Storage)
    })

    it('uses custom S3_ENDPOINT if provided', async () => {
        const { S3Storage } = await import('@/libs/s3')
        const envWithEndpoint = { ...testEnv, S3_ENDPOINT: 'https://custom.endpoint.com' }
        const storage = new S3Storage(envWithEndpoint)
        expect(storage).toBeInstanceOf(S3Storage)
    })

    it('upload returns a URL', async () => {
        const { S3Storage } = await import('@/libs/s3')
        const storage = new S3Storage(testEnv)
        const result = await storage.upload(Buffer.from('test-image'), 'test/abc.jpg', 'image/jpeg')
        expect(result).toHaveProperty('url')
        expect(result.url).toContain('test/abc.jpg')
    })

    it('upload with S3_BASE_URL returns correct URL', async () => {
        const { S3Storage } = await import('@/libs/s3')
        const envWithBase = { ...testEnv, S3_BASE_URL: 'https://cdn.example.com' }
        const storage = new S3Storage(envWithBase)
        const result = await storage.upload(Buffer.from('test'), 'images/photo.png', 'image/png')
        expect(result.url).toBe('https://cdn.example.com/images/photo.png')
    })
})
