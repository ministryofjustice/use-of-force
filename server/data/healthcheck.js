/* eslint-disable prefer-promise-reject-errors */
const superagent = require('superagent')
const db = require('./dataAccess/db')
const logger = require('../../log.js')

function dbCheck() {
  return db.queryWithoutTransaction('SELECT 1 AS ok')
}

function serviceCheck(name, url) {
  return new Promise((resolve, reject) => {
    superagent
      .get(url)
      .timeout({
        response: 4000,
        deadline: 4500,
      })
      .end((error, result) => {
        try {
          if (error) {
            logger.error(error.stack, `Error calling ${name}`)
            return reject(`${error.status} | ${error.code} | ${error.errno}`)
          }

          if (result.status === 200) {
            return resolve('OK')
          }

          return reject(result.status)
        } catch (apiError) {
          logger.error(apiError.stack, `Exception calling ${name} service`)
          return reject(apiError)
        }
      })
  })
}

module.exports = {
  dbCheck,
  serviceCheck,
}
