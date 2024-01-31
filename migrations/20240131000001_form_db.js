exports.up = knex =>
  knex.schema.table('statement_amendments', table => {
    table.index('statement_id')
  })

exports.down = knex =>
  knex.schema.table('statement_amendments', table => {
    table.dropIndex('statement_id')
  })
