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
  reporterName = 'James Stuart',
  bookingId = 1001,
  payload = expectedPayload,
  involvedStaff = [],
  agencyId = 'MDI',
  submittedDate = moment('2019-09-10 10:30:43.122').toDate(),
  overdueDate = moment(submittedDate)
    .add(3, 'd')
    .toDate(),
}) => {
  const submitDate = equals(status, ReportStatus.SUBMITTED) ? submittedDate : null
  return db
    .queryWithoutTransaction({
      text: `INSERT INTO report
      (form_response, user_id, booking_id, created_date, status, submitted_date, offender_no, reporter_name, incident_date, agency_id)
      VALUES($1, $2, $3, $4, $5, $6, 'A1234AC', $7, '2019-09-10 09:57:40.000', $8)
      returning id;
      `,
      values: [payload, userId, bookingId, '2019-09-10 09:57:43.122', status.value, submitDate, reporterName, agencyId],
    })
    .then(
      result =>
        involvedStaff.length &&
        statementsClient.createStatements(
          result.rows[0].id,
          new Date(),
          overdueDate,
          involvedStaff,
          db.queryWithoutTransaction
        )
    )
}

const deleteRows = table =>
  db.queryWithoutTransaction({
    text: format('delete from %I', table),
  })

const clearAllTables = async () => {
  await deleteRows('statement_amendments')
  await deleteRows('statement')
  await deleteRows('report')
}

module.exports = {
  clearDb() {
    return clearAllTables()
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
