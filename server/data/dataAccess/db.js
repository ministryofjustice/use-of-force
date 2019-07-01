const { Pool } = require('pg')
const fs = require('fs')
const { getNamespace } = require('cls-hooked')

const logger = require('../../../log')
const config = require('../../config')

const pool = new Pool({
  user: config.db.username,
  host: config.db.server,
  database: config.db.database,
  password: config.db.password,
  port: 5432,
  ssl:
    config.db.sslEnabled === 'true'
      ? {
          ca: fs.readFileSync('root.cert'),
          rejectUnauthorized: true,
        }
      : false,
})

pool.on('error', error => {
  logger.error('Unexpected error on idle client', error)
})

module.exports = {
  pool, // for testing only
  queryWithoutTransaction: (text, params) => pool.query(text, params),
  query: (text, params) => {
    const ns = getNamespace('request.scope')
    return ns.get('transactionalClient').query(text, params)
  },
  inTransaction: async callback => {
    const client = await pool.connect()
    const ns = getNamespace('request.scope')
    ns.set('transactionalClient', client)
    try {
      await client.query('BEGIN')
      await callback()
      await client.query('COMMIT')
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    } finally {
      client.release()
    }
  },
}
