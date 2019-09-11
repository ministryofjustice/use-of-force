const format = require('pg-format')

const moment = require('moment')

const { expectedPayload } = require('../integration/seedData')
const db = require('../../server/data/dataAccess/db')
const incidentClient = require('../../server/data/incidentClient')
const statementsClient = require('../../server/data/statementsClient')
const { ReportStatus } = require('../../server/config/types')
const { equals } = require('../../server/utils/utils')

const getCurrentDraft = bookingId =>
  incidentClient.getCurrentDraftReport('Test User', bookingId, db.queryWithoutTransaction)

const getStatementForUser = ({ reportId, status }) =>
  statementsClient.getStatementForUser('Test User', reportId, status, db.queryWithoutTransaction)

const getAllStatementsForReport = reportId => {
  return db
    .queryWithoutTransaction({
      text: `select s."name", s.email, s.user_id userId, statement_status status from statement s where s.report_id = $1 order by id`,
      values: [reportId],
    })
    .then(result => result.rows || [])
}

const getPayload = reportId => {
  return db
    .queryWithoutTransaction({
      text: `select form_response "form" from report r where r.id = $1`,
      values: [reportId],
    })
    .then(result => result.rows[0].form)
}

const seedReport = ({
  status,
  userId = 'Test User',
  bookingId = 1001,
  payload = expectedPayload,
  involvedStaff = [],
}) => {
  const submittedDate = equals(status, ReportStatus.SUBMITTED) ? moment('2019-09-10 10:30:43.122').toDate() : null
  return db
    .queryWithoutTransaction({
      text: `INSERT INTO report
      (form_response, user_id, booking_id, created_date, status, submitted_date, offender_no, reporter_name, incident_date)
      VALUES($1, $2, $3, $4, $5, $6, 'A1234AC', 'James Stuart', '2019-09-10 09:57:40.000')
      returning id;
      `,
      values: [payload, userId, bookingId, '2019-09-10 09:57:43.122', status.value, submittedDate],
    })
    .then(
      result =>
        involvedStaff.length &&
        statementsClient.createStatements(result.rows[0].id, new Date(), involvedStaff, db.queryWithoutTransaction)
    )
}

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
    return getCurrentDraft(bookingId).then(report => ({
      id: report.id,
      incidentDate: report.incidentDate,
      payload: { ...report.form[formName] },
    }))
  },

  getStatementForUser,
  getAllStatementsForReport,
  getPayload,
  seedReport,
}
