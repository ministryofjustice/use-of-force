exports.up = knex =>
  Promise.all([
    knex.schema.createTable('flyway_schema_history', table => {
      table.increments('id').primary('pk_form')
      table.string('version').nullable()
      table.string('description').nullable()
    }),
  ])
