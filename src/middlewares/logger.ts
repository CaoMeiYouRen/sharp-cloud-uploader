import path from 'path'
import type winston from 'winston'
import { logger as honoLogger } from 'hono/logger'
import { IS_CLOUDFLARE_WORKERS, LOG_LEVEL, LOGFILES } from '@/env'

async function createLogger() {
    if (IS_CLOUDFLARE_WORKERS) {
        return console
    }
    const logDir = path.resolve('logs')
    const winston = await import('winston')
    const DailyRotateFile = (await import('winston-daily-rotate-file')).default

    const format = winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSSZ' }),
        winston.format.splat(),
        winston.format.printf((info: any) => `[${info.timestamp}] ${info.level}: ${info.message}`),
    )

    const dailyRotateFileOption = {
        dirname: logDir,
        datePattern: 'YYYY-MM-DD',
        zippedArchive: false,
        maxSize: '20m',
        maxFiles: '31d',
        format,
        auditFile: path.join(logDir, '.audit.json'),
    }
    const transports: winston.transport[] = [
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
                winston.format.ms(),
                winston.format.splat(),
                winston.format.printf((info) => {
                    const infoLevel = winston.format.colorize().colorize(info.level, `[${info.timestamp}] ${info.level}`)
                    return `${infoLevel}: ${info.message}`
                }),
            ),
        }),
    ]
    if (LOGFILES) {
        transports.push(new DailyRotateFile({
            ...dailyRotateFileOption,
            filename: '%DATE%.log',
        }))
        transports.push(new DailyRotateFile({
            ...dailyRotateFileOption,
            level: 'error',
            filename: '%DATE%.errors.log',
        }))
    }
    const exceptionHandlers: winston.transport[] = []
    const rejectionHandlers: winston.transport[] = []
    if (LOGFILES) {
        const errorFile = new DailyRotateFile({
            ...dailyRotateFileOption,
            level: 'error',
            filename: '%DATE%.errors.log',
        })
        exceptionHandlers.push(errorFile)
        rejectionHandlers.push(new DailyRotateFile({
            ...dailyRotateFileOption,
            level: 'error',
            filename: '%DATE%.errors.log',
        }))
    }
    const winstonLogger = winston.createLogger({
        level: LOG_LEVEL,
        exitOnError: false,
        transports,
        exceptionHandlers,
        rejectionHandlers,
    })
    return winstonLogger
}

const logger = await createLogger()
const loggerMiddleware = honoLogger(logger.info)
export { loggerMiddleware }
export default logger
