exports.up = knex =>
  Promise.all([
    knex.schema.createTable('form', table => {
      table.increments('id').primary('pk_form')
      table.jsonb('form_response').nullable()
      table.string('user_id').notNullable()
    }),
  ])

exports.down = knex => knex.schema.dropTable('form')
