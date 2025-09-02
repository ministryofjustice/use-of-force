exports.up = knex =>
  knex.schema.alterTable('report_edit', table => {
    table.dropColumn('change_to')
    table.dropColumn('old_value_primary')
    table.dropColumn('old_value_secondary')
    table.dropColumn('new_value_primary')
    table.dropColumn('new_value_secondary')
    table.jsonb('changes').defaultTo('{}').notNullable()
    table.text('reason_text')
  })

exports.down = knex =>
  knex.schema.alterTable('report_edit', table => {
    table.dropColumn('changes')
    table.dropColumn('reason_text')
    table.string('change_to')
    table.string('old_value_primary')
    table.string('old_value_secondary')
    table.string('new_value_primary')
    table.string('new_value_secondary')
  })
