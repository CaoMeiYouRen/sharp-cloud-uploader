import { describe, it, expect } from 'vitest'
import { getHeaders } from '@/utils/referers'

describe('getHeaders', () => {
    it('returns empty object for unknown domain', () => {
        const headers = getHeaders('https://example.com/image.jpg')
        expect(headers).toEqual({})
    })

    it('returns weibo referer for weibocdn.com', () => {
        const headers = getHeaders('https://wx1.weibocdn.com/photo.jpg')
        expect(headers).toEqual({ referer: 'https://weibo.com/' })
    })

    it('returns weibo referer for sinaimg.cn', () => {
        const headers = getHeaders('https://tvax1.sinaimg.cn/large/abc.jpg')
        expect(headers).toEqual({ referer: 'https://weibo.com/' })
    })

    it('returns sspai referer for sspai.com', () => {
        const headers = getHeaders('https://cdn.sspai.com/2024/01/01/abc.png')
        expect(headers).toEqual({ referer: 'https://sspai.com/' })
    })

    it('returns pixiv referer for pximg.net', () => {
        const headers = getHeaders('https://i.pximg.net/img-original/123.png')
        expect(headers).toEqual({ referer: 'https://pixiv.net/' })
    })

    it('handles subdomains correctly', () => {
        const headers = getHeaders('https://sub.domain.weibocdn.com/img.jpg')
        expect(headers).toEqual({ referer: 'https://weibo.com/' })
    })
})
