import { Context } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { ErrorHandler, HTTPResponseError, NotFoundHandler } from 'hono/types'
import logger from '@/middlewares/logger'

export const errorhandler: ErrorHandler = (error: Error | HTTPResponseError, c: Context) => {
    const message = process.env.NODE_ENV === 'production' ? `${error.name}: ${error.message}` : error.stack
    let status = 500
    if (error instanceof HTTPException) {
        const response = error.getResponse()
        status = response.status
    }
    const method = c.req.method
    const requestPath = c.req.path
    logger.error(`Error in ${method} ${requestPath}: \n${message}`)
    const body = JSON.stringify({ status, message })
    return new Response(body, {
        status,
        headers: { 'Content-Type': 'application/json' },
    })
}

export const notFoundHandler: NotFoundHandler = (c: Context) => {
    const method = c.req.method
    const requestPath = c.req.path
    const message = `Cannot ${method} ${requestPath}`
    logger.warn(message)
    return c.json({
        status: 404,
        message,
    }, 404)
}
