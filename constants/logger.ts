import { configure, getLogger } from 'log4js'

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
logger.level = 'all' // You can set this to whatever level you want
