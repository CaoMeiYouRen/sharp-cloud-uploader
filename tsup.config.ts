import path from 'path'
import { defineConfig, Options } from 'tsup'

const tsupOptions: Options = {
    platform: 'node', // 目标平台
    entry: ['src/index.ts', 'src/vercel.ts'],
    format: ['esm'],
    outExtension({ format }) {
        switch (format) {
            case 'cjs':
                return {
                    js: '.cjs',
                    dts: '.d.ts',
                }
            case 'esm':
                return {
                    js: '.mjs',
                    dts: '.d.ts',
                }
            case 'iife':
                return {
                    js: '.global.js',
                    dts: '.d.ts',
                }
            default:
                break
        }
        return {
            js: '.js',
            dts: '.d.ts',
        }
    },
    splitting: false, // 代码拆分
    sourcemap: true,
    clean: false,
    dts: false,
    minify: false, // 缩小输出
    shims: true, // 注入 cjs 和 esm 填充代码，解决 import.meta.url 和 __dirname 的兼容问题
    noExternal: ['@modelcontextprotocol/sdk'],
    esbuildPlugins: [
        {
            name: 'resolve-mcp-sdk',
            setup(build) {
                build.onResolve(
                    { filter: /^@modelcontextprotocol\/sdk\/(.+)/ },
                    (args) => {
                        const subpath = args.path.match(/@modelcontextprotocol\/sdk\/(.+)/)?.[1] || ''
                        return {
                            path: path.resolve('node_modules/@modelcontextprotocol/sdk/dist/esm', `${subpath}.js`),
                        }
                    },
                )
            },
        },
    ],
    esbuildOptions(options) { // 设置编码格式
        options.charset = 'utf8'
    },
    // external: [], // 排除的依赖项
    // bundle: true,
}

const cloudflareOptions: Options = {
    ...tsupOptions,
    entry: ['src/app.ts'],
    format: ['esm'],
    replaceNodeEnv: false,
    minify: false,
    treeshake: true,
    // noExternal: undefined,
    // esbuildPlugins: undefined,
    env: {
        RUNTIME_KEY: 'cloudflare-workers',
        NODE_ENV: 'production',
    },
}

const mcpLocalOptions: Options = {
    ...tsupOptions,
    entry: {
        'mcp-local': 'src/mcp/local.ts',
    },
    format: ['esm'],
}

export default defineConfig([tsupOptions, cloudflareOptions, mcpLocalOptions])
