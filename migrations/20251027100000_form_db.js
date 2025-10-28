exports.up = async knex => {
  await knex.schema.alterTable('report', table => {
    table.timestamp('completed_date').nullable()
    table.index('status')
  })

  await knex.raw(`
    CREATE OR REPLACE VIEW v_report AS
    SELECT * FROM report WHERE deleted IS NULL;
  `)
}

exports.down = async knex => {
  await knex.schema.alterTable('report', table => {
    table.dropColumn('completed_date')
    table.dropIndex('status')
  })
}
