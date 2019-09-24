exports.up = knex =>
  Promise.all([
    knex.schema.table('statement', table => {
      table
        .boolean('in_progress')
        .notNullable()
        .defaultTo(false)
    }),
  ])

exports.down = knex =>
  Promise.all([
    knex.schema.table('statement', table => {
      table.dropColumn('in_progress')
    }),
  ])
