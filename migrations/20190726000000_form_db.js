exports.up = knex =>
  Promise.all([
    knex.schema.renameTable('form', 'incidents'),

    knex.schema.alterTable('incidents', table => {
      table.timestamp('incident_date')
      table.renameColumn('start_date', 'created_date')
    }),

    knex.schema.createTable('involved_staff', table => {
      table.increments('id').primary('pk_form')
      table.integer('incident_id').references('id').inTable('incidents').notNull().onDelete('cascade')
      table.string('user_id').nullable()
      table.string('name').nullable()
      table.string('email').nullable()
      table.timestamp('submitted_date')
      table.string('statement_status').notNullable()
    }),
  ])
exports.down = knex =>
  Promise.all([
    knex.schema.renameTable('incidents', 'form'),

    knex.schema.table('form', table => {
      table.dropColumn('incident_date')
      table.renameColumn('created_date', 'start_date')
    }),

    knex.schema.dropTable('involved_staff'),
  ])
