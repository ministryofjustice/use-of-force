exports.up = knex =>
  knex.schema.createTable('report_log', table => {
    table.increments('id').primary('pk_audit')
    table.timestamp('timestamp').notNullable().defaultTo(knex.fn.now())
    table.string('username', 50).notNullable()
    table.bigInteger('report_id').notNullable()
    table.string('action', 50).notNullable()
    table.jsonb('details').nullable()
  })

exports.down = knex => knex.schema.dropTable('report_log')
