const moment = require('moment')
const logger = require('../log')

logger.info(`send reminders job fired at: ${moment()}`)

new Promise(done => setTimeout(done, 60 * 1000)).then(() => logger.info(`send reminders job ended at: ${moment()}`))
