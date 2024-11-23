import { Buffer } from 'buffer'
import sharp from 'sharp'

export type Format = 'jpeg' | 'jpg' | 'png' | 'webp' | 'jp2' | 'tiff' | 'avif' | 'heif' | 'jxl'

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

    // 读取输入图片
    const image = sharp(input)

    // 根据输出格式进行压缩
    let compressedImage: sharp.Sharp
    switch (format) {
        case 'jpg':
        case 'jpeg':
            compressedImage = image.jpeg({
                quality, // 压缩质量
                progressive: true, // 使用渐进式扫描
                chromaSubsampling: '4:4:4', // 防止色度子采样
                mozjpeg: true, // 使用 MozJPEG 优化
            })
            break
        case 'png':
            compressedImage = image.png({
                quality, // 压缩质量
                palette: true, // 使用调色板
                compressionLevel: 9, // 最大压缩级别
                dither: 1.0, // 减少误差扩散
            })
            break
        case 'webp':
            compressedImage = image.webp({
                quality, // 压缩质量
            })
            break
        case 'jp2':
            compressedImage = image.jp2({
                quality, // 压缩质量
            })
            break
        case 'tiff':
            compressedImage = image.tiff({
                quality, // 压缩质量
                compression: 'lzw', // 使用 LZW 压缩
                predictor: 'horizontal', // 使用水平预测
            })
            break
        case 'avif':
            compressedImage = image.avif({
                quality, // 压缩质量
            })
            break
        case 'heif':
            compressedImage = image.heif({
                quality, // 压缩质量
            })
            break
        case 'jxl':
            compressedImage = image.jxl({
                quality, // 压缩质量
            })
            break
        default:
            // 如果不支持压缩就保持原样
            compressedImage = image
    }
    return compressedImage.toBuffer()
}
