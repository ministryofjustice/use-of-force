const format = require('pg-format')
const db = require('../../server/data/dataAccess/db')
const incidentClient = require('../../server/data/incidentClient')

const getCurrentDraft = bookingId =>
  incidentClient.getCurrentDraftReport('Test User', bookingId, db.queryWithoutTransaction)

const getStatement = ({ reportId, status }) =>
  incidentClient.getStatement('Test User', reportId, status, db.queryWithoutTransaction)

module.exports = {
  clearDb() {
    const drops = ['report', 'statement'].map(table =>
      db.queryWithoutTransaction({
        text: format('delete from %I', table),
      })
    )
    return Promise.all(drops)
  },

  getCurrentDraft({ bookingId, formName }) {
    return getCurrentDraft(bookingId)
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
