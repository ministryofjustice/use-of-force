const format = require('pg-format')
const nonTransactionalClient = require('./dataAccess/db')
const { ReportStatus, StatementStatus } = require('../config/types')

const db = nonTransactionalClient

const createDraftReport = async ({
  userId,
  bookingId,
  agencyId,
  reporterName,
  offenderNo,
  incidentDate,
  formResponse,
}) => {
  const nextSequence = `(select COALESCE(MAX(sequence_no), 0) + 1 from v_report where booking_id = $5 and user_id = $2)`
  const result = await nonTransactionalClient.query({
    text: `insert into report (form_response, user_id, reporter_name, offender_no, booking_id, agency_id, status, incident_date, sequence_no, created_date)
            values ($1, CAST($2 AS VARCHAR), $3, $4, $5, $6, $7, $8, ${nextSequence}, CURRENT_TIMESTAMP)
            returning id`,
    values: [
      formResponse,
      userId,
      reporterName,
      offenderNo,
      bookingId,
      agencyId,
      ReportStatus.IN_PROGRESS.value,
      incidentDate,
    ],
  })
  return result.rows[0].id
}

const updateDraftReport = (reportId, incidentDate, formResponse) => {
  return nonTransactionalClient.query({
    text: `update v_report r
            set form_response = COALESCE($1,   r.form_response)
            ,   incident_date = COALESCE($2,   r.incident_date)
            ,   updated_date = now()
            where r.id = $3`,
    values: [formResponse, incidentDate, reportId],
  })
}

const maxSequenceForBooking =
  '(select max(r2.sequence_no) from report r2 where r2.booking_id = r.booking_id and user_id = r.user_id)'

const submitReport = (userId, bookingId, submittedDate, client = nonTransactionalClient) => {
  return client.query({
    text: `update v_report r
            set status = $1
            ,   submitted_date = $2
            ,   updated_date = now()
          where r.user_id = $3
          and r.booking_id = $4
          and r.status = $5
          and r.sequence_no = ${maxSequenceForBooking}`,
    values: [ReportStatus.SUBMITTED.value, submittedDate, userId, bookingId, ReportStatus.IN_PROGRESS.value],
  })
}

const changeStatus = (reportId, startState, endState, client = nonTransactionalClient) => {
  return client.query({
    text: `update v_report r
            set status = $1
            ,   updated_date = now()
          where id = $2
          and status = $3`,
    values: [endState.value, reportId, startState.value],
  })
}

const getCurrentDraftReport = async (userId, bookingId) => {
  const results = await nonTransactionalClient.query({
    text: `select id, incident_date "incidentDate", form_response "form" from v_report r
          where r.user_id = $1
          and r.booking_id = $2
          and r.status = $3
          and r.sequence_no = ${maxSequenceForBooking}`,
    values: [userId, bookingId, ReportStatus.IN_PROGRESS.value],
  })
  return results.rows[0] || {}
}

const getReport = async (userId, reportId) => {
  const results = await nonTransactionalClient.query({
    text: `select id
          , incident_date "incidentDate"
          , submitted_date "submittedDate"
          , reporter_name "reporterName"
          , form_response "form"
          , booking_id "bookingId"
          from v_report r
          where r.user_id = $1 and r.id = $2`,
    values: [userId, reportId],
  })
  return results.rows[0]
}

const getReportForReviewer = async reportId => {
  const results = await nonTransactionalClient.query({
    text: `select id
          , incident_date "incidentDate"
          , submitted_date "submittedDate"
          , reporter_name "reporterName"
          , form_response "form"
          , booking_id    "bookingId"
          , status
          from v_report r
          where r.id = $1`,
    values: [reportId],
  })
  return results.rows[0]
}

const getIncompleteReportsForReviewer = async agencyId => {
  const isOverdue = `(select count(*) from "v_statement" s
                      where r.id = s.report_id 
                      and s.statement_status = $3
                      and s.overdue_date <= now()) > 0`

  return nonTransactionalClient.query({
    text: `select r.id
            , r.booking_id     "bookingId"
            , r.reporter_name  "reporterName"
            , r.offender_no    "offenderNo"
            , r.incident_date  "incidentDate"
            , ${isOverdue}     "isOverdue"
            from v_report r
          where r.status = $1
          and   r.agency_id = $2
          order by r.incident_date`,
    values: [ReportStatus.SUBMITTED.value, agencyId, StatementStatus.PENDING.value],
  })
}

const getCompletedReportsForReviewer = async agencyId => {
  return nonTransactionalClient.query({
    text: `select r.id
            , r.booking_id     "bookingId"
            , r.reporter_name  "reporterName"
            , r.offender_no    "offenderNo"
            , r.incident_date  "incidentDate"
            from v_report r
          where r.status = $1
          and   r.agency_id = $2
          order by r.incident_date`,
    values: [ReportStatus.COMPLETE.value, agencyId],
  })
}

const getReports = (userId, statuses) => {
  const statusValues = statuses.map(status => status.value)
  return nonTransactionalClient.query({
    text: format(
      `select r.id
            , r.booking_id    "bookingId"
            , r.reporter_name "reporterName"
            , r.offender_no   "offenderNo"
            , r.incident_date "incidentDate"
            from v_report r
          where r.status in (%L)
          and r.user_id = %L
          order by r.incident_date`,
      statusValues,
      userId
    ),
  })
}

const getDraftInvolvedStaff = async reportId => {
  const results = await nonTransactionalClient.query({
    text: 'select form_response "form" from v_report where id = $1',
    values: [reportId],
  })

  if (results.rows.length) {
    const { form: { incidentDetails: { involvedStaff = [] } = {} } = {} } = results.rows[0]
    return involvedStaff
  }
  return []
}

const getInvolvedStaff = async reportId => {
  const results = await nonTransactionalClient.query({
    text: `select s.id     "statementId"
    ,      s.user_id       "userId"
    ,      s.name          "name"
    ,      s.email         "email"
    from v_statement s 
    where s.report_id = $1`,
    values: [reportId],
  })
  return results.rows
}

const deleteReport = (reportId, now = new Date()) =>
  db.inTransaction(async client => {
    await client.query({ text: `update report set deleted = $1 where id = $2`, values: [now, reportId] })

    const statementQuery = `(select id from statement where report_id = $2)`

    await client.query({
      text: `update statement set deleted = $1 where id in ${statementQuery}`,
      values: [now, reportId],
    })
    await client.query({
      text: `update statement_amendments set deleted = $1 where statement_id in ${statementQuery}`,
      values: [now, reportId],
    })
  })

// Note: this locks the statement row until surrounding transaction is committed so is not suitable for general use
const getNextNotificationReminder = async transactionalClient => {
  const result = await transactionalClient.query({
    text: `select s.id                     "statementId"
          ,       r.id                     "reportId"
          ,       s.email                  "recipientEmail" 
          ,       s.name                   "recipientName"
          ,       s.next_reminder_date     "nextReminderDate"  
          ,       r.submitted_date         "submittedDate"
          ,       r.reporter_name          "reporterName"
          ,       r.incident_date          "incidentDate"
          ,       r.user_id = s.user_id    "isReporter"
          ,       s.overdue_date           "overdueDate"
          ,       s.overdue_date <= now()  "isOverdue"
          from statement s
          left join report r on r.id = s.report_id
          where s.next_reminder_date < now()
          and s.statement_status = $1
          and s.deleted is null
          and s.email is not null
          order by s.id
          for update of s skip locked
          LIMIT 1`,
    values: [StatementStatus.PENDING.value],
  })
  const {
    rows: [reminder],
  } = result
  return reminder
}

const setNextReminderDate = (statementId, nextDate, client = nonTransactionalClient) =>
  client.query({
    text: 'update v_statement set next_reminder_date = $1, updated_date = now() where id = $2',
    values: [nextDate, statementId],
  })

module.exports = {
  createDraftReport,
  updateDraftReport,
  submitReport,
  deleteReport,
  changeStatus,
  getCurrentDraftReport,
  getReport,
  getReports,
  getInvolvedStaff,
  getDraftInvolvedStaff,
  getNextNotificationReminder,
  setNextReminderDate,
  getReportForReviewer,
  getCompletedReportsForReviewer,
  getIncompleteReportsForReviewer,
}
