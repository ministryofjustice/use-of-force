exports.up = knex =>
  knex.schema.table('report', table => {
    table.index(['agency_id', 'status'])
  })

exports.down = knex =>
  knex.schema.table('report', table => {
    table.dropIndex(['agency_id', 'status'])
  })
