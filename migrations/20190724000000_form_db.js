exports.up = knex =>
  knex.schema.alterTable('form', table => {
    table.string('offender_no', 32).notNullable()
    table.string('reporter_name', 128).notNullable()
  })

exports.down = knex =>
  knex.schema.table('form', table => {
    table.dropColumn('offender_no')
    table.dropColumn('reporter_name')
  })
