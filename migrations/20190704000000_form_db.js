exports.up = knex =>
  knex.schema.alterTable('form', table => {
    table.timestamp('submitted_date')
  })

exports.down = knex =>
  knex.schema.table('form', table => {
    table.dropColumn('submitted_date')
  })
