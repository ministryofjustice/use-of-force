#!/usr/bin/env node
/*
 * Applies every knex migration to the docker-compose-schema-spy.yml database, so the SchemaSpy report
 * and data-dictionary.csv are generated from the migrations and cannot drift from them.
 *
 * Deliberately does not import knexfile.ts or server/config: those are TypeScript, and the knex CLI
 * cannot load a .ts knexfile without ts-node, which this repo does not have - which is also why
 * `npm run migrate` does not currently work. In production, migrations run at application boot from
 * the compiled server.ts, not from this script.
 *
 * Defaults match docker-compose-schema-spy.yml and the db block in server/config.ts.
 */
const knex = require('knex')
const path = require('path')

const db = knex({
  client: 'pg',
  connection: {
    host: process.env.DB_SERVER || 'localhost',
    port: Number(process.env.DB_PORT || 5432),
    database: process.env.DB_NAME || 'use-of-force',
    user: process.env.DB_USER || 'use-of-force',
    password: process.env.DB_PASS || 'use-of-force',
    ssl: false,
  },
  migrations: { directory: path.join(__dirname, '..', 'migrations') },
  acquireConnectionTimeout: 5000,
})

db.migrate
  .latest()
  .then(([batch, applied]) => {
    console.log(`Applied ${applied.length} migration(s) in batch ${batch}`)
    return db.destroy()
  })
  .catch(async error => {
    console.error(error)
    await db.destroy()
    process.exit(1)
  })
