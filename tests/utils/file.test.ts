import { describe, it, expect } from 'vitest'
import { getFileExtension } from '@/utils/file'

describe('getFileExtension', () => {
    it('returns jpg for image/jpeg', () => {
        expect(getFileExtension('image/jpeg')).toBe('jpg')
    })

    it('returns png for image/png', () => {
        expect(getFileExtension('image/png')).toBe('png')
    })

    it('returns webp for image/webp', () => {
        expect(getFileExtension('image/webp')).toBe('webp')
    })

    it('returns avif for image/avif', () => {
        expect(getFileExtension('image/avif')).toBe('avif')
    })

    it('returns gif for image/gif', () => {
        expect(getFileExtension('image/gif')).toBe('gif')
    })

    it('returns svg for image/svg+xml', () => {
        expect(getFileExtension('image/svg+xml')).toBe('svg')
    })

    it('returns tiff for image/tiff', () => {
        expect(getFileExtension('image/tiff')).toBe('tiff')
    })

    it('throws for null content type', () => {
        expect(() => getFileExtension(null)).toThrow('Content-Type is required')
    })

    it('returns undefined for unknown content type', () => {
        expect(getFileExtension('image/unknown')).toBeUndefined()
    })
})
