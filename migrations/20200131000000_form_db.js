exports.up = async knex => {
  await knex.schema.table('report', table => {
    table.timestamp('deleted')
  })
  await knex.schema.table('statement', table => {
    table.timestamp('deleted')
  })
  await knex.schema.table('statement_amendments', table => {
    table.timestamp('deleted')
  })

  await knex.raw('ALTER TABLE report DROP CONSTRAINT user_booking_sequence_index;')

  await knex.raw(
    `CREATE UNIQUE INDEX user_booking_sequence_index ON report (user_id, booking_id, sequence_no) WHERE deleted is NULL;`
  )

  await knex.raw(
    `CREATE VIEW v_report AS SELECT * FROM report where deleted is null;
     CREATE VIEW v_statement AS SELECT * FROM statement where deleted is null;
     CREATE VIEW v_statement_amendments  AS SELECT * FROM statement_amendments where deleted is null;`
  )
}

exports.down = async knex => {
  await knex.raw('ALTER TABLE report DROP CONSTRAINT user_booking_sequence_index;')
  await knex.schema.table('report', table => {
    table.dropColumn('deleted')
    table.unique(['user_id', 'booking_id', 'sequence_no'])
  })
  await knex.schema.table('statement', table => {
    table.dropColumn('deleted')
  })
  await knex.schema.table('statement_amendments', table => {
    table.dropColumn('deleted')
  })
  await knex.raw(
    `drop VIEW v_report;
     drop VIEW v_statement;
     drop VIEW v_statement_amendments;`
  )
}
