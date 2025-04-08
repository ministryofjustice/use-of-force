import { Pool, QueryConfig, QueryResult, QueryResultRow } from 'pg'
import fs from 'fs'
import logger from '../../../log'
import config from '../../config'

export const pool = new Pool({
  user: config.db.username,
  host: config.db.server,
  database: config.db.database,
  password: config.db.password,
  port: config.db.port,
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type QueryPerformer = <R extends QueryResultRow = any, I extends any[] = any[]>(
  queryTextOrConfig: string | QueryConfig<I>,
  values?: I,
) => Promise<QueryResult<R>>

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
export const query: QueryPerformer = (queryTextOrConfig, values?) => pool.query(queryTextOrConfig, values)

export type InTransaction = <R>(callback: (query: QueryPerformer) => Promise<R>) => Promise<R>

export const inTransaction: InTransaction = async callback => {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const result = await callback((queryTextOrConfig: string | QueryConfig) => client.query(queryTextOrConfig))
    await client.query('COMMIT')
    return result
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}
