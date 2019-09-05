exports.up = knex =>
  knex.schema.table('statement', table => {
    table.timestamp('next_reminder_date')
  })

exports.down = knex =>
  knex.schema.table('statement', table => {
    table.dropColumn('next_reminder_date')
  })
