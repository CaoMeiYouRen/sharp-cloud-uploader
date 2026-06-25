import { Context } from 'hono'
import { env } from 'hono/adapter'
import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp'
import { Bindings } from '../types'
import { createMcpServer } from './server'

async function handleMcp(c: Context<{ Bindings: Bindings }>, envValue: Bindings) {
    const server = createMcpServer(envValue)
    const transport = new WebStandardStreamableHTTPServerTransport({
        sessionIdGenerator: undefined,
    })
    await server.connect(transport)
    return transport.handleRequest(c.req.raw)
}

export async function mcpHandler(c: Context<{ Bindings: Bindings }>) {
    const envValue = env(c)

    if (envValue.AUTH_TOKEN) {
        const authHeader = c.req.header('Authorization')
        const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null
        if (token !== envValue.AUTH_TOKEN) {
            return c.json({ error: 'Unauthorized' }, 401)
        }
    }

    return handleMcp(c, envValue)
}
