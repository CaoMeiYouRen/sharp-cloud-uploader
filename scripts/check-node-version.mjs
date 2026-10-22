import { pathToFileURL } from 'node:url'

// 已修复 CVE-2026-111497（Brotli 解码越界写入）等 2026-10-21 安全问题的版本下界
const PATCHED_VERSIONS = {
    '22': [23, 4],
    '24': [22, 1],
    '26': [12, 1],
}

export function parseNodeVersion(version) {
    return version.replace(/^v/, '').split('.').map((item) => Number.parseInt(item, 10))
}

/**
 * 判断 Node.js 版本是否已包含 2026-10-21 的安全修复
 * @param {string} version 例如 24.22.1
 */
export function isPatchedNodeVersion(version) {
    const [major, minor, patch] = parseNodeVersion(version)
    const minimum = PATCHED_VERSIONS[major]
    if (!minimum) {
        return major > 26
    }
    const [minimumMinor, minimumPatch] = minimum
    if (minor !== minimumMinor) {
        return minor > minimumMinor
    }
    return patch >= minimumPatch
}

export function assertPatchedNodeVersion(version = process.versions.node) {
    if (isPatchedNodeVersion(version)) {
        return
    }
    throw new Error(`Node.js ${version} 未修复 CVE-2026-111497，请使用 22.23.4 / 24.22.1 / 26.12.1 或更高版本`)
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
    try {
        assertPatchedNodeVersion()
        console.log(`Node.js ${process.versions.node} 已包含所需安全修复`)
    } catch (error) {
        console.error(error instanceof Error ? error.message : String(error))
        process.exit(1)
    }
}
