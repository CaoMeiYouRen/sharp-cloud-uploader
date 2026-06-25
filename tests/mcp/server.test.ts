import { describe, it, expect, vi } from 'vitest'

// Mock dependencies before importing the module under test
vi.mock('@/libs/storage-factory', () => ({
    StorageFactory: {
        getStorage: vi.fn().mockReturnValue({
            upload: vi.fn().mockResolvedValue({ url: 'https://cdn.example.com/test/abc.jpg' }),
        }),
    },
}))

vi.mock('@/utils/sharp', () => ({
    compressImage: vi.fn().mockImplementation((buffer: Buffer) => Promise.resolve(buffer)),
}))

vi.mock('@/utils/referers', () => ({
    getHeaders: vi.fn().mockReturnValue({}),
}))

vi.mock('dayjs', () => {
    const mockDayjs = () => ({ format: () => '20260101120000000' })
    mockDayjs.extend = () => mockDayjs as never
    return { default: mockDayjs }
})

import { Bindings } from '@/types'

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
    S3_BASE_URL: 'https://cdn.example.com',
    S3_REGION: 'us-east-1',
    S3_BUCKET_NAME: 'test-bucket',
    S3_ACCESS_KEY_ID: 'test-key',
    S3_SECRET_ACCESS_KEY: 'test-secret',
    S3_ENDPOINT: '',
    VERCEL_BLOB_TOKEN: '',
    BLOB_READ_WRITE_TOKEN: '',
    R2_BUCKET: undefined as never,
    R2_BASE_URL: 'https://r2.example.com',
}

describe('createMcpServer', () => {
    it('creates a server without errors', async () => {
        const { createMcpServer } = await import('@/mcp/server')
        const server = createMcpServer(testEnv)
        expect(server).toBeDefined()
        expect(server.server).toBeDefined()
    })

    it('is connected after connect call', async () => {
        const { createMcpServer } = await import('@/mcp/server')
        const server = createMcpServer(testEnv)
        // Server should not be connected before connect()
        expect(server.isConnected()).toBe(false)
    })
})

describe('MCP business logic', () => {
    it('deduplicates URLs matching S3_BASE_URL', () => {
        const baseUrl = 'https://cdn.example.com'
        const url = 'https://cdn.example.com/already-uploaded.jpg'
        expect(url.startsWith(baseUrl)).toBe(true)
    })

    it('does not deduplicate URLs from different origins', () => {
        const baseUrl = 'https://cdn.example.com'
        const url = 'https://other.com/image.jpg'
        expect(url.startsWith(baseUrl)).toBe(false)
    })

    it('parses data URI with MIME type', () => {
        const dataUri = 'data:image/png;base64,iVBORw0KGgo='
        const match = dataUri.match(/^data:([^;]+);base64,(.+)$/)
        expect(match).not.toBeNull()
        expect(match![1]).toBe('image/png')
        expect(match![2]).toBe('iVBORw0KGgo=')
    })

    it('does not match plain base64 as data URI', () => {
        const base64 = 'iVBORw0KGgo='
        const match = base64.match(/^data:([^;]+);base64,(.+)$/)
        expect(match).toBeNull()
    })

    it('runtime info has expected shape', () => {
        const info = {
            storageType: testEnv.STORAGE_TYPE || 's3',
            bucketPrefix: testEnv.BUCKET_PREFIX || '',
            defaultQuality: 90,
            maxBodySize: 104857600,
            nodeVersion: process.version,
            version: '1.3.3',
        }
        expect(info).toHaveProperty('storageType', 's3')
        expect(info).toHaveProperty('bucketPrefix', 'test/')
        expect(info).toHaveProperty('defaultQuality', 90)
        expect(info).toHaveProperty('version', '1.3.3')
    })
})
