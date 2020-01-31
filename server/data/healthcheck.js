/* eslint-disable prefer-promise-reject-errors */
const superagent = require('superagent')
/** @type {any} */
const Agent = require('agentkeepalive')
const { HttpsAgent } = require('agentkeepalive')
const db = require('./dataAccess/db')
const logger = require('../../log.js')
const config = require('../config')

function dbCheck() {
  return db.query('SELECT 1 AS ok')
}

const agentOptions = {
  maxSockets: config.apis.elite2.agent.maxSockets,
  maxFreeSockets: config.apis.elite2.agent.maxFreeSockets,
  freeSocketTimeout: config.apis.elite2.agent.freeSocketTimeout,
}

function serviceCheckFactory(name, url) {
  const keepaliveAgent = url.startsWith('https') ? new HttpsAgent(agentOptions) : new Agent(agentOptions)

  return () =>
    new Promise((resolve, reject) => {
      superagent
        .get(url)
        .agent(keepaliveAgent)
        .retry(2, (err, res) => {
          if (err) logger.info(`Retry handler found API error with ${err.code} ${err.message}`)
          return undefined // retry handler only for logging retries, not to influence retry logic
        })
        .timeout({
          response: 1000,
          deadline: 1500,
        })
        .end((error, result) => {
          if (error) {
            logger.error(error.stack, `Error calling ${name}`)
            reject(error)
          } else if (result.status === 200) {
            resolve('OK')
          } else {
            reject(result.status)
          }
        })
    })
}

module.exports = {
  dbCheck,
  serviceCheckFactory,
}
