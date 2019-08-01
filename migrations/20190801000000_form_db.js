exports.up = knex =>
  knex.schema.alterTable('involved_staff', table => {
    table.specificType('last_training_month', 'smallint')
    table.specificType('last_training_year', 'smallint')
    table.specificType('job_start_year', 'smallint')
    table.specificType('statement', 'text')
  })

exports.down = knex =>
  knex.schema.alterTable('involved_staff', table => {
    table.dropColumn('last_training_month')
    table.dropColumn('last_training_year')
    table.dropColumn('job_start_year')
    table.dropColumn('statement')
  })
