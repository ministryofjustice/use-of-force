exports.up = knex =>
  knex.schema.alterTable('form', table => {
    table
      .integer('sequence_no')
      .notNullable()
      .defaultTo(1)
    table
      .bigInteger('booking_id')
      .notNullable()
      .defaultTo(-1)
    table
      .timestamp('start_date')
      .notNullable()
      .defaultTo(knex.fn.now(6))

    table.string('user_id', 32).alter()
    table.string('status', 20)
    table.unique(['user_id', 'booking_id', 'sequence_no'], 'user_booking_sequence_index')
  })

exports.down = knex =>
  knex.schema.table('form', table => {
    table.dropUnique(['user_id', 'booking_id', 'sequence_no'], 'user_booking_sequence_index')
    table.dropColumn('sequence_no')
    table.dropColumn('booking_id')
    table.dropColumn('status')
    table.dropColumn('start_date')
  })
