const format = require('pg-format')

const moment = require('moment')

const { expectedPayload } = require('../integration/seedData')
const db = require('../../dist/server/data/dataAccess/db')
const { IncidentClient } = require('../../dist/server/data/incidentClient')
const statementsClient = require('../../dist/server/data/statementsClient')
const createStatementService = require('../../dist/server/services/statementService')
const { ReportStatus } = require('../../dist/server/config/types')
const { equals } = require('../../dist/server/utils/utils')

const incidentClient = new IncidentClient()
const statementService = createStatementService({ statementsClient, incidentClient, db })

const getCurrentDraft = bookingId => incidentClient.getCurrentDraftReport('TEST_USER', bookingId)

const getStatementForUser = ({ reportId, status }) =>
  statementsClient.getStatementForUser('TEST_USER', reportId, status)

const getAllStatementsForReport = reportId => {
  return db
    .query({
      text: `select s."name", s.email, s.user_id userId, statement_status status from statement s where s.report_id = $1 order by id`,
      values: [reportId],
    })
    .then(result => result.rows || [])
}

const getPayload = reportId => {
  return db
    .query({
      text: `select form_response "form" from report r where r.id = $1`,
      values: [reportId],
    })
    .then(result => result.rows[0].form)
}

const seedReport = ({
  status,
  userId = 'TEST_USER',
  reporterName = 'James Stuart',
  bookingId = 1001,
  offenderNumber = 'A1234AC',
  payload = expectedPayload,
  involvedStaff = [],
  agencyId = 'MDI',
  incidentDate = moment('2019-09-10 09:57:40.000').toDate(),
  submittedDate = moment('2019-09-10 10:30:43.122').toDate(),
  overdueDate = moment(submittedDate)
    .add(3, 'd')
    .toDate(),
  sequenceNumber = 0,
}) => {
  const submitDate = equals(status, ReportStatus.SUBMITTED) ? submittedDate : null
  return db
    .query({
      text: `INSERT INTO report
      (form_response, user_id, booking_id, created_date, status, submitted_date, offender_no, reporter_name, incident_date, agency_id, sequence_no)
      VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      returning id;
      `,
      values: [
        payload,
        userId,
        bookingId,
        '2019-09-10 09:57:43.122',
        status.value,
        submitDate,
        offenderNumber,
        reporterName,
        incidentDate,
        agencyId,
        sequenceNumber,
      ],
    })
    .then(
      result =>
        involvedStaff.length &&
        statementsClient.createStatements({
          reportId: result.rows[0].id,
          firstReminder: new Date(),
          overdueDate,
          staff: involvedStaff,
        })
    )
}

const submitStatement = ({ userId, reportId }) =>
  statementsClient
    .saveStatement(userId, reportId, {
      lastTrainingMonth: 2,
      lastTrainingYear: 2018,
      jobStartYear: 2017,
      statement: 'Things happened',
    })
    .then(async () => {
      await statementService.submitStatement(userId, reportId)
      return null
    })

const deleteRows = table => db.query({ text: format('delete from %I', table) })

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
  submitStatement,
}
