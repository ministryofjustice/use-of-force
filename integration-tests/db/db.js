const format = require('pg-format')
const db = require('../../server/data/dataAccess/db')
const incidentClient = require('../../server/data/incidentClient')

const getCurrentDraftIncident = bookingId =>
  incidentClient.getCurrentDraftIncident('Test User', bookingId, db.queryWithoutTransaction)

const getStatement = incidentId => incidentClient.getStatement('Test User', incidentId, db.queryWithoutTransaction)

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
        incidentClient
          .getInvolvedStaff(id, db.queryWithoutTransaction)
          .then(staff => staff.map(s => ({ userId: s.username, name: s.name, email: s.email })))
          .then(staff => ({ data, staff }))
      )
  },

  getStatement,
}
