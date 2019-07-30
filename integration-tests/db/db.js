const format = require('pg-format')
const db = require('../../server/data/dataAccess/db')
const formClient = require('../../server/data/formClient')

const getFormDataForUser = bookingId =>
  formClient.getFormDataForUser('Test User', bookingId, db.queryWithoutTransaction)

module.exports = {
  clearDb() {
    const drops = ['incidents', 'involved_staff'].map(table =>
      db.queryWithoutTransaction({
        text: format('delete from %I', table),
      })
    )
    return Promise.all(drops)
  },

  getFormData({ bookingId, formName }) {
    return getFormDataForUser(bookingId)
      .then(form => ({
        id: form.rows[0].id,
        data: { incidentDate: form.rows[0].incident_date, ...form.rows[0].form_response.incident[formName] },
      }))
      .then(({ id, data }) =>
        formClient
          .getInvolvedStaff(id, db.queryWithoutTransaction)
          .then(staff => staff.map(s => ({ userId: s.user_id, name: s.name })))
          .then(staff => ({ data, staff }))
      )
  },
}
