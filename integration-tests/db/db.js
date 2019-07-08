const db = require('../../server/data/dataAccess/db')
const formClient = require('../../server/data/formClient')

module.exports = {
  clearDb() {
    db.queryWithoutTransaction({
      text: 'delete from form',
      values: [],
    })
  },

  getFormData({ bookingId, formName }) {
    return formClient.getFormDataForUser('Test User', bookingId, db.queryWithoutTransaction).then(form => {
      return form.rows[0].form_response.incident[formName]
    })
  },
}
