const knex = require('knex')
const knexfile = require('./knexfile')
const app = require('./server/index')
const log = require('./log')

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
knex1.migrate.latest().then(() => {
  log.debug('Migration finished')
  app.listen(app.get('port'), () => {
    log.info(`Server listening on port ${app.get('port')}`)
  })
})
