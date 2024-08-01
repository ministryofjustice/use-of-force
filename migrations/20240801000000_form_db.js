exports.up = knex =>
  knex.schema.table('report', table => {
    table.index('user_id')
  })

exports.down = knex =>
  knex.schema.table('report', table => {
    table.dropIndex('user_id')
  })
