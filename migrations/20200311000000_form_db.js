exports.up = async knex => {
  await knex.raw('ALTER TABLE statement DROP CONSTRAINT involved_staff_incident_id_user_id_unique;')

  await knex.raw(
    `CREATE UNIQUE INDEX involved_staff_incident_id_user_id_unique ON statement (report_id, user_id) WHERE deleted is NULL;`
  )
}

exports.down = async knex => {
  await knex.raw('ALTER TABLE statement DROP CONSTRAINT involved_staff_incident_id_user_id_unique;')
  await knex.schema.table('statement', table => {
    table.unique(['report_id', 'user_id'])
  })
}
