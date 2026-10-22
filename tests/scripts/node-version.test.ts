import { describe, expect, it } from 'vitest'
import { assertPatchedNodeVersion, isPatchedNodeVersion, parseNodeVersion } from '../../scripts/check-node-version.mjs'

describe('parseNodeVersion', () => {
    it('parses versions with and without the v prefix', () => {
        expect(parseNodeVersion('v24.22.1')).toEqual([24, 22, 1])
        expect(parseNodeVersion('22.23.4')).toEqual([22, 23, 4])
    })
})

describe('isPatchedNodeVersion', () => {
    it('accepts the minimum patched versions', () => {
        expect(isPatchedNodeVersion('22.23.4')).toBe(true)
        expect(isPatchedNodeVersion('24.22.1')).toBe(true)
        expect(isPatchedNodeVersion('26.12.1')).toBe(true)
    })

    it('accepts versions above the minimum', () => {
        expect(isPatchedNodeVersion('22.24.0')).toBe(true)
        expect(isPatchedNodeVersion('24.23.0')).toBe(true)
        expect(isPatchedNodeVersion('26.13.0')).toBe(true)
        expect(isPatchedNodeVersion('27.0.0')).toBe(true)
    })

    it('rejects versions below the minimum', () => {
        expect(isPatchedNodeVersion('22.23.3')).toBe(false)
        expect(isPatchedNodeVersion('24.19.0')).toBe(false)
        expect(isPatchedNodeVersion('24.22.0')).toBe(false)
        expect(isPatchedNodeVersion('26.12.0')).toBe(false)
        expect(isPatchedNodeVersion('20.19.0')).toBe(false)
    })

    it('rejects unmaintained major versions', () => {
        expect(isPatchedNodeVersion('25.9.0')).toBe(false)
        expect(isPatchedNodeVersion('23.11.0')).toBe(false)
    })
})

describe('assertPatchedNodeVersion', () => {
    it('throws for unpatched versions', () => {
        expect(() => assertPatchedNodeVersion('24.19.0')).toThrow('CVE-2026-111497')
    })

    it('does not throw for patched versions', () => {
        expect(() => assertPatchedNodeVersion('24.22.1')).not.toThrow()
    })
})
