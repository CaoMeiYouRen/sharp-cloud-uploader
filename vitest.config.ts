import path from 'path'
import { defineConfig } from 'vitest/config'

export default defineConfig({
    test: {
        globals: true,
        environment: 'node',
        include: ['tests/**/*.test.ts'],
        coverage: {
            provider: 'v8',
            include: ['src/**/*.ts'],
            exclude: [
                'src/index.ts',
                'src/vercel.ts',
                'src/mcp/local.ts',
                'src/types.d.ts',
            ],
        },
    },
    resolve: {
        alias: {
            '@': path.resolve(__dirname, 'src'),
        },
    },
})
