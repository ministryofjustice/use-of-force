exports.up = knex =>
  knex.schema.table('statement', table => {
    table.index('report_id')
  })

exports.down = knex =>
  knex.schema.table('statement', table => {
    table.dropIndex('report_id')
  })
