exports.up = knex =>
  knex.schema.table('statement', table => {
    table
      .integer('staff_id')
      .notNullable()
      .defaultTo(-1)
    table
      .timestamp('created_date')
      .notNullable()
      .defaultTo(knex.fn.now(6))
    table.timestamp('updated_date')
  })

exports.down = knex =>
  knex.schema.table('statement', table => {
    table.dropColumn('staff_id')
    table.dropColumn('created_date')
    table.dropColumn('updated_date')
  })
