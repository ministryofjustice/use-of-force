exports.up = knex =>
  Promise.all([
    knex.schema.table('statement', table => {
      table.text('removal_requested_reason').nullable()
      table.timestamp('removal_requested_date').nullable()
    }),
  ])

exports.down = knex =>
  Promise.all([
    knex.schema.table('statement', table => {
      table.dropColumn('removal_requested_reason')
      table.dropColumn('removal_requested_date')
    }),
  ])
