exports.up = async knex => {
  // move involved staff array out of incidentDetails field to top level
  await knex.raw(`
  update report set form_response = jsonb_insert(form_response #- '{incidentDetails,involvedStaff}', '{involvedStaff}', form_response -> 'incidentDetails' -> 'involvedStaff')
  `)
}

exports.down = async knex => {
  await knex.raw(
    `update report set form_response = jsonb_insert(form_response #- '{involvedStaff}', '{incidentDetails,involvedStaff}', form_response -> 'involvedStaff')`
  )
}
