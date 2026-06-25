import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio'
import dotenv from 'dotenv'
import { Bindings } from '../types'
import { createMcpServer } from './server'

dotenv.config({
    path: ['.env.local', '.env'],
})

function buildBindingsFromProcessEnv(): Bindings {
    return {
        NODE_ENV: process.env.NODE_ENV || 'production',
        PORT: process.env.PORT || '3000',
        LOGFILES: process.env.LOGFILES || 'false',
        LOG_LEVEL: process.env.LOG_LEVEL || 'http',
        TIMEOUT: process.env.TIMEOUT || '60000',
        MAX_BODY_SIZE: process.env.MAX_BODY_SIZE || '104857600',
        IMAGE_QUALITY: process.env.IMAGE_QUALITY || '90',
        AUTH_TOKEN: process.env.AUTH_TOKEN || '',
        BUCKET_PREFIX: process.env.BUCKET_PREFIX || '',
        STORAGE_TYPE: (process.env.STORAGE_TYPE as 's3' | 'vercel-blob' | 'r2') || 's3',
        S3_BASE_URL: process.env.S3_BASE_URL || '',
        S3_REGION: process.env.S3_REGION || '',
        S3_BUCKET_NAME: process.env.S3_BUCKET_NAME || '',
        S3_ACCESS_KEY_ID: process.env.S3_ACCESS_KEY_ID || '',
        S3_SECRET_ACCESS_KEY: process.env.S3_SECRET_ACCESS_KEY || '',
        S3_ENDPOINT: process.env.S3_ENDPOINT || '',
        VERCEL_BLOB_TOKEN: process.env.VERCEL_BLOB_TOKEN || '',
        BLOB_READ_WRITE_TOKEN: process.env.BLOB_READ_WRITE_TOKEN || '',
        R2_BUCKET: undefined as never,
        R2_BASE_URL: process.env.R2_BASE_URL || '',
    }
}

async function main() {
    const env = buildBindingsFromProcessEnv()
    const server = createMcpServer(env)
    const transport = new StdioServerTransport()
    await server.connect(transport)
}

main().catch(console.error)
