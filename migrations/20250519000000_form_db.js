exports.up = knex =>
  knex.schema.alterTable('report_edit', table => {
    table.boolean('report_owner_changed').defaultTo(false)
    table.renameColumn('user_id', 'editor_user_id')
    table.renameColumn('user_name', 'editor_name')
    table.renameColumn('question', 'change_to')
    table.renameColumn('timestamp', 'edit_date')
    table.index('report_id')
  })

exports.down = knex =>
  knex.schema.alterTable('report_edit', table => {
    table.dropColumn('report_owner_changed')
    table.renameColumn('editor_user_id', 'user_id')
    table.renameColumn('editor_name', 'user_name')
    table.renameColumn('change_to', 'question')
    table.renameColumn('edit_date', 'timestamp')
    table.dropIndex('report_id')
  })
