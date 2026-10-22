import { afterEach, describe, expect, it, vi } from 'vitest'
import { fetchWithoutBrotli, isBrotliEncoding, UnsafeContentEncodingError } from '@/utils/fetch'

describe('isBrotliEncoding', () => {
    it('matches single brotli encodings', () => {
        expect(isBrotliEncoding('br')).toBe(true)
        expect(isBrotliEncoding('BR')).toBe(true)
        expect(isBrotliEncoding(' brotli ')).toBe(true)
    })

    it('matches brotli in multi-value encodings', () => {
        expect(isBrotliEncoding('gzip, br')).toBe(true)
        expect(isBrotliEncoding('br, gzip')).toBe(true)
    })

    it('ignores non-brotli encodings', () => {
        expect(isBrotliEncoding(null)).toBe(false)
        expect(isBrotliEncoding(undefined)).toBe(false)
        expect(isBrotliEncoding('')).toBe(false)
        expect(isBrotliEncoding('gzip')).toBe(false)
        expect(isBrotliEncoding('deflate, gzip')).toBe(false)
        // 不应误伤以 br 开头的其他编码名
        expect(isBrotliEncoding('brand-new-encoding')).toBe(false)
    })
})

describe('fetchWithoutBrotli', () => {
    afterEach(() => {
        vi.unstubAllGlobals()
    })

    it('returns responses without content-encoding', async () => {
        const response = new Response('ok')
        const fetchMock = vi.fn().mockResolvedValue(response)
        vi.stubGlobal('fetch', fetchMock)

        await expect(fetchWithoutBrotli('https://example.com/image.png')).resolves.toBe(response)
        expect(fetchMock).toHaveBeenCalledWith('https://example.com/image.png', undefined)
    })

    it('returns gzip encoded responses untouched', async () => {
        const response = new Response('ok', { headers: { 'content-encoding': 'gzip' } })
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response))

        await expect(fetchWithoutBrotli('https://example.com/image.png')).resolves.toBe(response)
    })

    it('rejects brotli encoded responses and cancels the body without reading it', async () => {
        const cancel = vi.fn().mockResolvedValue(undefined)
        const body = new ReadableStream({
            start(controller) {
                controller.enqueue(new Uint8Array([0x1b, 0x2e, 0x00]))
            },
            cancel,
        })
        const response = new Response(body, { headers: { 'content-encoding': 'br' } })
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response))

        await expect(fetchWithoutBrotli('https://example.com/image.png')).rejects.toBeInstanceOf(UnsafeContentEncodingError)
        expect(cancel).toHaveBeenCalled()
    })

    it('rejects brotli encoded responses without a body', async () => {
        const response = new Response(null, { status: 204, headers: { 'content-encoding': 'br' } })
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response))

        await expect(fetchWithoutBrotli('https://example.com/image.png')).rejects.toBeInstanceOf(UnsafeContentEncodingError)
    })

    it('rejects brotli in multi-value content-encoding', async () => {
        const response = new Response('ok', { headers: { 'content-encoding': 'gzip, br' } })
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response))

        await expect(fetchWithoutBrotli('https://example.com/image.png')).rejects.toThrow('Brotli')
    })
})
