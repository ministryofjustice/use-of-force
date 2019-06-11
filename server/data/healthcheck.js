/* eslint-disable prefer-promise-reject-errors */
const superagent = require('superagent')
const config = require('../config.js')
const db = require('./dataAccess/db')
const logger = require('../../log.js')

module.exports = {
  dbCheck,
  authCheck,
}

function dbCheck() {
  return db.query('SELECT 1 AS ok')
}

function authCheck() {
  return new Promise((resolve, reject) => {
    superagent
      .get(`${config.nomis.authUrl}/health`)
      .timeout({
        response: 4000,
        deadline: 4500,
      })
      .end((error, result) => {
        try {
          if (error) {
            logger.error(error.stack, 'Error calling Auth service')
            return reject(`${error.status} | ${error.code} | ${error.errno}`)
          }

          if (result.status === 200) {
            return resolve('OK')
          }

          return reject(result.status)
        } catch (apiError) {
          logger.error(apiError.stack, 'Exception calling Auth service')
          return reject(apiError)
        }
      })
  })
}
