/* eslint-disable import/first, import/order */
/*
 * Do telemetry first as OpenTelemetry needs to instrument modules (express, http, bunyan etc.) before they're loaded
 */
import { flushTelemetry, initialiseAppInsights } from './server/utils/azureAppInsights'

initialiseAppInsights()

import knex from 'knex'
import knexfile from './knexfile'

import app from './server/index'
/** @type {any} */

import log from './log'

const selectSql = message => {
  if (message.sql) {
    return message.sql
  }
  if (message.length && message.length >= 1) {
    return message[0].sql
  }
  return { knex: message }
}

const init = {
  ...knexfile,
  log: {
    debug(message) {
      log.debug(selectSql(message))
    },
  },
  debug: true,
}

log.debug('Migration start')
const knex1 = knex(init)

const shutdown = async () => {
  await flushTelemetry()
  process.exit(0)
}

process.on('SIGTERM', () => shutdown())
process.on('SIGINT', () => shutdown())

knex1.migrate.latest().then(() => {
  log.debug('Migration finished')
  app.listen(app.get('port'), () => {
    log.info(`Server listening on port ${app.get('port')}`)
  })
})
