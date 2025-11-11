import { Buffer } from 'buffer'
import type { Sharp } from 'sharp'
import { IS_CLOUDFLARE_WORKERS } from '@/env'

export type Format = 'jpeg' | 'jpg' | 'png' | 'webp' | 'jp2' | 'tiff' | 'avif' | 'heif' | 'jxl' | 'svg' | 'gif'

/**
 * 压缩图片
 * @param input 输入图片
 * @param format 输出格式
 * @param quality 压缩质量 默认 80
 * @returns 压缩后的图片
 */
export async function compressImage(
    input: Buffer,
    format: Format,
    quality: number = 80,
): Promise<Buffer> {
    const normalizedQuality = Math.min(Math.max(Math.round(quality), 1), 100)
    if (IS_CLOUDFLARE_WORKERS) {
        // 由于 Cloudflare Workers 不支持使用 sharp 库，所以直接返回原图
        return input
    }
    const sharp = (await import('sharp')).default // 动态导入 sharp 库，以避免在 Cloudflare Workers 中使用
    // 读取输入图片
    const image = sharp(input)

    // 根据输出格式进行压缩
    let compressedImage: Sharp
    switch (format) {
        case 'jpg':
        case 'jpeg':
            compressedImage = image.jpeg({
                quality: normalizedQuality, // 压缩质量
                progressive: true, // 使用渐进式扫描
                chromaSubsampling: '4:4:4', // 防止色度子采样
                mozjpeg: true, // 使用 MozJPEG 优化
            })
            break
        case 'png':
            compressedImage = image.png({
                quality: normalizedQuality, // 压缩质量
                palette: true, // 使用调色板
                compressionLevel: 9, // 最大压缩级别
                dither: 1.0, // 减少误差扩散
                effort: 10, // CPU 压缩级别，高 effort 则压缩更好但更耗时
            })
            break
        case 'webp':
            compressedImage = image.webp({
                quality: normalizedQuality, // 压缩质量
                effort: 6, // CPU 压缩级别
            })
            break
        case 'jp2':
            compressedImage = image.jp2({
                quality: normalizedQuality, // 压缩质量
            })
            break
        case 'tiff':
            compressedImage = image.tiff({
                quality: normalizedQuality, // 压缩质量
                compression: 'lzw', // 使用 LZW 压缩
                predictor: 'horizontal', // 使用水平预测
            })
            break
        case 'avif':
            compressedImage = image.avif({
                quality: normalizedQuality, // 压缩质量
                effort: 9, // CPU 压缩级别
            })
            break
        case 'heif':
            compressedImage = image.heif({
                quality: normalizedQuality, // 压缩质量
                effort: 9, // CPU 压缩级别
            })
            break
        case 'jxl':
            compressedImage = image.jxl({
                quality: normalizedQuality, // 压缩质量
                effort: 9, // CPU 压缩级别
            })
            break
        case 'gif':
            compressedImage = image.gif({
                effort: Math.max(1, Math.floor(normalizedQuality / 10)), // CPU 压缩级别
            })
            break
        case 'svg':
            return input // SVG 格式不支持压缩，直接返回原图
        default:
            // 如果不支持压缩就保持原样
            compressedImage = image
    }
    return compressedImage.toBuffer()
}
