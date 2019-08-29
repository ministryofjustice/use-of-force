exports.up = knex =>
  Promise.all([
    knex.schema.createTable('statement_amendments', table => {
      table.increments('id').primary()
      table
        .integer('statement_id')
        .references('id')
        .inTable('statement')
        .notNull()
        .onDelete('cascade')
      table.text('additional_comment').notNullable()
      table
        .timestamp('date_submitted')
        .notNullable()
        .defaultTo(knex.fn.now(6))
    }),
  ])

exports.down = knex => Promise.all([knex.schema.dropTable('statement_amendments')])
