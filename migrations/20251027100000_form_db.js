exports.up = knex =>
  knex.schema.alterTable('report', table => {
    table.timestamp('completed_date').nullable()
    table.index('status')
  })

exports.down = knex =>
  knex.schema.alterTable('report', table => {
    table.dropColumn('completed_date')
    table.dropIndex('status')
  })
