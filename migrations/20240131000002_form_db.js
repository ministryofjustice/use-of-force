exports.up = knex =>
  knex.schema.table('report', table => {
    table.index('offender_no')
    table.index('created_date')
    table.index('incident_date')
  })

exports.down = knex =>
  knex.schema.table('report', table => {
    table.dropIndex('offender_no')
    table.dropIndex('created_date')
    table.dropIndex('incident_date')
  })
