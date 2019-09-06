exports.up = knex =>
  knex.schema.table('statement', table => {
    table
      .integer('staff_id')
      .nullable()
      .alter()
    table.index(['next_reminder_date', 'statement_status'])
  })

exports.down = knex =>
  knex.schema.table('statement', table => {
    table
      .integer('staff_id')
      .notNullable()
      .alter()
    table.dropIndex(['next_reminder_date', 'statement_status'])
  })
