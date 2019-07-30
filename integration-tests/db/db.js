const format = require('pg-format')
const db = require('../../server/data/dataAccess/db')
const formClient = require('../../server/data/formClient')

const getCurrentDraftIncident = bookingId =>
  formClient.getCurrentDraftIncident('Test User', bookingId, db.queryWithoutTransaction)

module.exports = {
  clearDb() {
    const drops = ['incidents', 'involved_staff'].map(table =>
      db.queryWithoutTransaction({
        text: format('delete from %I', table),
      })
    )
    return Promise.all(drops)
  },

  getCurrentDraftIncident({ bookingId, formName }) {
    return getCurrentDraftIncident(bookingId)
      .then(form => ({
        id: form.id,
        data: { incidentDate: form.incident_date, ...form.form_response.incident[formName] },
      }))
      .then(({ id, data }) =>
        formClient
          .getInvolvedStaff(id, db.queryWithoutTransaction)
          .then(staff => staff.map(s => ({ userId: s.user_id, name: s.name })))
          .then(staff => ({ data, staff }))
      )
  },
}
