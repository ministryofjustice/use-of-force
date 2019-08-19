exports.up = knex =>
  knex.schema
    .table('involved_staff', table => {
      table.renameColumn('incident_id', 'report_id')
    })
    .then(() => knex.schema.renameTable('involved_staff', 'statement'))
    .then(() => knex.schema.renameTable('incidents', 'report'))

exports.down = knex =>
  knex.schema
    .renameTable('report', 'incidents')
    .then(() => knex.schema.renameTable('statement', 'involved_staff'))
    .then(() =>
      knex.schema.table('involved_staff', table => {
        table.renameColumn('incident_id', 'report_id')
      })
    )
