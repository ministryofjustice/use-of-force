exports.up = knex =>
  Promise.all([
    knex.schema.table('statement', table => {
      table.timestamp('overdue_date')
    }),
    knex.schema.table('report', table => {
      table.string('agency_id', 6)
      table.timestamp('updated_date')
    }),
  ])

exports.down = knex =>
  Promise.all([
    knex.schema.table('statement', table => {
      table.dropColumn('overdue_date')
    }),
    knex.schema.table('report', table => {
      table.dropColumn('agency_id')
      table.dropColumn('updated_date')
    }),
  ])
