exports.up = knex =>
  Promise.all([
    knex.schema.alterTable('involved_staff', table => {
      table.unique(['incident_id', 'user_id'])
    }),
  ])
exports.down = knex =>
  knex.schema.alterTable('involved_staff', table => {
    table.dropUnique(['incident_id', 'user_id'])
  })
