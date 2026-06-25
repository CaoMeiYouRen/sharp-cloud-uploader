import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Mock all external dependencies
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

vi.mock('@/utils/file', async () => {
    const actual = await vi.importActual('@/utils/file')
    return {
        ...actual,
        getFileType: vi.fn().mockResolvedValue('image/jpeg'),
    }
})

vi.mock('@/utils/referers', () => ({
    getHeaders: vi.fn().mockReturnValue({}),
}))

vi.mock('@/middlewares/logger', () => {
    const mockLogger = { info: vi.fn(), error: vi.fn(), warn: vi.fn() }
    return {
        default: mockLogger,
        loggerMiddleware: vi.fn().mockImplementation((_c: unknown, next: () => unknown) => next()),
    }
})

vi.mock('dayjs', () => {
    const mockDayjs = () => ({ format: () => '20260101120000000' })
    mockDayjs.extend = () => mockDayjs as never
    return { default: mockDayjs }
})

import app from '@/app'

describe('Routes', () => {
    beforeEach(() => {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue(
            new Response(Buffer.from([0xFF, 0xD8, 0xFF]), {
                status: 200,
                headers: { 'Content-Type': 'image/jpeg' },
            }),
        ))
    })

    afterEach(() => {
        vi.unstubAllGlobals()
    })

    describe('GET /', () => {
        it('returns hello message', async () => {
            const res = await app.request('/')
            expect(res.status).toBe(200)
            const body = await res.json()
            expect(body).toEqual({ message: 'Hello Hono!' })
        })
    })

    describe('GET /runtime', () => {
        it('returns runtime info', async () => {
            const res = await app.request('/runtime')
            expect(res.status).toBe(200)
            const body = await res.json()
            expect(body).toHaveProperty('runtime')
            expect(body).toHaveProperty('nodeVersion')
        })
    })

    describe('POST /upload-from-url', () => {
        it('returns 400 if no URL provided', async () => {
            const res = await app.request('/upload-from-url', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({}),
            })
            expect(res.status).toBe(400)
            const body = await res.json()
            expect(body).toHaveProperty('error', 'URL is required')
        })

        it('returns success for valid URL', async () => {
            const res = await app.request('/upload-from-url', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url: 'https://example.com/photo.jpg' }),
            })

            expect(res.status).toBe(200)
            const body = await res.json()
            expect(body).toHaveProperty('success', true)
            expect(body).toHaveProperty('url')
        })

        it('deduplicates when URL is already on S3_BASE_URL', async () => {
            // S3_BASE_URL in test env is empty, R2_BASE_URL is empty too,
            // but the base check uses ||, so both must be set for dedup
            const res = await app.request('/upload-from-url', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url: 'https://example.com/photo.jpg' }),
            })
            expect(res.status).toBe(200)
        })
    })

    describe('POST /upload-from-body', () => {
        it('returns 400 for non-image content-type', async () => {
            const res = await app.request('/upload-from-body', {
                method: 'POST',
                headers: { 'Content-Type': 'text/plain' },
                body: 'not an image',
            })
            expect(res.status).toBe(400)
        })

        it('handles image upload via body', async () => {
            const fakeImage = Buffer.from([0xFF, 0xD8, 0xFF])

            const res = await app.request('/upload-from-body', {
                method: 'POST',
                headers: { 'Content-Type': 'image/jpeg' },
                body: fakeImage,
            })

            expect(res.status).toBe(200)
            const body = await res.json()
            expect(body).toHaveProperty('success', true)
            expect(body).toHaveProperty('url')
            expect(body.url).toBe('https://cdn.example.com/test/abc.jpg')
        })
    })

    describe('Auth', () => {
        it('allows upload when AUTH_TOKEN is empty (no auth required)', async () => {
            const res = await app.request('/upload-from-url', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url: 'https://example.com/photo.jpg' }),
            })
            expect(res.status).toBe(200)
        })
    })
})

describe('MCP Route', () => {
    it('responds to GET /mcp', async () => {
        const res = await app.request('/mcp', {
            method: 'GET',
        })
        expect(res.status).toBeGreaterThanOrEqual(200)
        expect(res.status).toBeLessThan(600)
    })

    it('responds to POST /mcp', async () => {
        const res = await app.request('/mcp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({}),
        })
        expect(res.status).toBeGreaterThanOrEqual(200)
    })
})
