import { Logger } from 'log4js'
import { configure, getLogger } from 'log4js'
import { config as dotEnvConfig } from 'dotenv'

configure({
    appenders: {
        file: { type: 'file', filename: 'app.log' },
        console: { type: 'console' },
    },
    categories: {
        default: { appenders: ['file', 'console'], level: 'debug' },
    },
})

export const logger = getLogger()
logger.level = 'debug' // You can set this to whatever level you want

if (process.env.NODE_ENV === 'test') {
    dotEnvConfig({ path: '.env.test' })
} else {
    dotEnvConfig({ path: '.env.live' })
}
