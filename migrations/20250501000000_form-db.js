exports.up = knex =>
  knex.schema.createTable('report_edit', table => {
    table.increments('id').primary('pk_edit')
    table.timestamp('timestamp').notNullable().defaultTo(knex.fn.now())
    table.string('user_id', 32).notNullable()
    table.string('user_name', 128).notNullable()
    table.bigInteger('report_id').notNullable()
    table.string('question', 128).notNullable()
    table.string('old_value_primary', 1000).notNullable()
    table.string('old_value_secondary', 1000).nullable()
    table.string('new_value_primary', 1000).notNullable()
    table.string('new_value_secondary', 1000).nullable()
    table.string('reason', 128).notNullable()
    table.string('additional_comments', 1000).nullable()
  })

exports.down = knex => knex.schema.dropTable('report_edit')
