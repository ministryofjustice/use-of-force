exports.up = knex =>
  knex.schema.table('report_log', table => {
    table.index('report_id')
  })

exports.down = knex =>
  knex.schema.table('report_log', table => {
    table.dropIndex('report_id')
  })
