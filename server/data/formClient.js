const db = require('./dataAccess/db')

module.exports = {
  getFormDataForUser(userId) {
    const query = {
      text: 'select id, form_response from form where user_id = $1',
      values: [userId],
    }

    return db.query(query)
  },

  update(formId, formResponse, userId) {
    const query = {
      text: getUpsertQuery(formId),

      values: [formResponse, userId],
    }

    return db.query(query)
  },
}

function getUpsertQuery(formId) {
  if (formId) {
    return 'update form set form_response = $1 where user_id=$2'
  }

  return 'insert into form (form_response, user_id) values ($1, $2)'
}
