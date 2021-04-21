exports.up = async knex => {
  // correct typo in prisonerRelocation option of SPECIAL_ACCOMMODATION
  await knex.raw(`
  update report set form_response = jsonb_set(form_response, '{relocationAndInjuries, prisonerRelocation}', '"SPECIAL_ACCOMMODATION"') where form_response -> 'relocationAndInjuries' ->> 'prisonerRelocation' = 'SPECIAL_ACCOMODATION'
  `)
}

exports.down = async knex => {
  await knex.raw(`
  update report set form_response = jsonb_set(form_response, '{relocationAndInjuries, prisonerRelocation}', '"SPECIAL_ACCOMODATION"') where form_response -> 'relocationAndInjuries' ->> 'prisonerRelocation' = 'SPECIAL_ACCOMMODATION'	
  `)
}
