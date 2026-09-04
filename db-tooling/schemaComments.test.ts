import { pool, query } from '../server/data/dataAccess/db'

/**
 * Guards the data dictionary published to GitHub Pages - see the schema_comments migration.
 *
 * Descriptions live in the database as COMMENT ON statements so SchemaSpy, the CSV export and any Glue
 * crawl share one source of truth. Nothing else would notice a new column arriving undocumented, and in
 * this schema an undocumented column is quite likely to hold special category data about a prisoner.
 *
 * Needs the docker-compose-schema-spy.yml database, migrated - see `npm run schema:report`.
 */

const SENSITIVITY = /\[Sensitivity: (NONE|PERSONAL|STAFF|SPECIAL-CATEGORY|OFFICIAL-SENSITIVE)]$/

// knex's own bookkeeping, plus the flyway_schema_history view over it. They are commented by the
// migration so the published report explains them, but they are not this schema's data and knex owns
// their shape, so a future knex version changing them must not fail the build.
const EXCLUDED = ['knex_migrations', 'knex_migrations_lock', 'flyway_schema_history']

afterAll(() => pool.end())

const columnComments = async (): Promise<{ name: string; comment: string | null }[]> => {
  const { rows } = await query<{ name: string; comment: string | null }>(
    `SELECT c.relname || '.' || a.attname    AS name,
            col_description(c.oid, a.attnum) AS comment
     FROM pg_class c
     JOIN pg_namespace n ON n.oid = c.relnamespace
     JOIN pg_attribute a ON a.attrelid = c.oid AND a.attnum > 0 AND NOT a.attisdropped
     WHERE n.nspname = 'public'
       AND c.relkind IN ('r', 'v')
       AND c.relname <> ALL ($1)
     ORDER BY c.relname, a.attnum`,
    [EXCLUDED],
  )
  return rows
}

describe('schema comments', () => {
  it('every table and view has a description', async () => {
    const { rows } = await query<{ name: string }>(
      `SELECT c.relname AS name
       FROM pg_class c
       JOIN pg_namespace n ON n.oid = c.relnamespace
       WHERE n.nspname = 'public'
         AND c.relkind IN ('r', 'v')
         AND c.relname <> ALL ($1)
         AND obj_description(c.oid, 'pg_class') IS NULL
       ORDER BY c.relname`,
      [EXCLUDED],
    )

    // add a COMMENT ON in a new migration
    expect(rows.map(r => r.name)).toEqual([])
  })

  it('every column has a description', async () => {
    const undocumented = (await columnComments()).filter(c => c.comment === null)

    // add a COMMENT ON in a new migration
    expect(undocumented.map(c => c.name)).toEqual([])
  })

  it('every column description carries a sensitivity classification', async () => {
    const untagged = (await columnComments()).filter(c => c.comment && !SENSITIVITY.test(c.comment))

    // column comments must end with [Sensitivity: NONE|PERSONAL|STAFF|SPECIAL-CATEGORY|OFFICIAL-SENSITIVE]
    expect(untagged.map(c => c.name)).toEqual([])
  })
})
