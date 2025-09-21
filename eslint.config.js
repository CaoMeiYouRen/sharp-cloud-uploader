import { defineConfig, globalIgnores } from 'eslint/config'
import cmyr from 'eslint-config-cmyr'

export default defineConfig([
    cmyr,
    {
        rules: {
            'no-console': 'off',
        },
    },
    globalIgnores([
        '.vercel',
        '.vercel/',
        '.vercel/*',
        '.wrangler',
        '.wrangler/',
        '.wrangler/*',
    ]),
])
