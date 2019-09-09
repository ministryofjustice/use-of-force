const db = require('./dataAccess/db')
const { ReportStatus, StatementStatus } = require('../config/types')

const createDraftReport = async ({ userId, bookingId, reporterName, offenderNo, incidentDate, formResponse }) => {
  const nextSequence = `(select COALESCE(MAX(sequence_no), 0) + 1 from report where booking_id = $5 and user_id = $2)`
  const result = await db.query({
    text: `insert into report (form_response, user_id, reporter_name, offender_no, booking_id, status, incident_date, sequence_no, created_date)
            values ($1, CAST($2 AS VARCHAR), $3, $4, $5, $6, $7, ${nextSequence}, CURRENT_TIMESTAMP)
            returning id`,
    values: [formResponse, userId, reporterName, offenderNo, bookingId, ReportStatus.IN_PROGRESS.value, incidentDate],
  })
  return result.rows[0].id
}

const updateDraftReport = (reportId, incidentDate, formResponse) => {
  return db.query({
    text: `update report r set form_response = $1, incident_date = COALESCE($2, r.incident_date) where r.id = $3`,
    values: [formResponse, incidentDate, reportId],
  })
}

const maxSequenceForBooking =
  '(select max(r2.sequence_no) from report r2 where r2.booking_id = r.booking_id and user_id = r.user_id)'

const submitReport = (userId, bookingId, submittedDate) => {
  return db.query({
    text: `update report r set status = $1, submitted_date = $2
    where user_id = $3
    and booking_id = $4
    and status = $5
    and r.sequence_no = ${maxSequenceForBooking}`,
    values: [ReportStatus.SUBMITTED.value, submittedDate, userId, bookingId, ReportStatus.IN_PROGRESS.value],
  })
}

const getCurrentDraftReport = async (userId, bookingId, query = db.query) => {
  const results = await query({
    text: `select id, incident_date "incidentDate", form_response "form" from report r
          where user_id = $1
          and booking_id = $2
          and status = $3
          and r.sequence_no = ${maxSequenceForBooking}`,
    values: [userId, bookingId, ReportStatus.IN_PROGRESS.value],
  })
  return results.rows[0] || {}
}

const getReports = (userId, status, query = db.query) => {
  return query({
    text: `select r.id
            , r.booking_id    "bookingId"
            , r.reporter_name "reporterName"
            , r.offender_no   "offenderNo"
            , r.incident_date "incidentDate"
            from report r
          where r.status = $1
          and r.user_id = $2
          order by r.incident_date`,
    values: [status.value, userId],
  })
}

const getInvolvedStaff = async (reportId, query = db.query) => {
  const results = await query({
    text: 'select form_response "form" from report where id = $1',
    values: [reportId],
  })

  if (results.rows.length) {
    const { form: { incidentDetails: { involvedStaff = [] } = {} } = {} } = results.rows[0]
    return involvedStaff
  }
  return []
}

// Note: this locks the statement row until surrounding transaction is committed so is not suitable for general use
const getNextNotificationReminder = async () => {
  const result = await db.query({
    text: `select s.id                     "statementId"
          ,       s.email                  "recipientEmail" 
          ,       s.name                   "recipientName"
          ,       s.next_reminder_date     "nextReminderDate"  
          ,       r.reporter_name          "reporterName"
          ,       r.submitted_date         "submittedDate"
          ,       r.incident_date          "incidentDate"
          ,       r.user_id = s.user_id    "isReporter"
          from statement s
          left join report r on r.id = s.report_id
          where next_reminder_date < now() and s.statement_status = $1
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

const setNextReminderDate = (statementId, nextDate) =>
  db.query({
    text: 'update statement set next_reminder_date = $1, updated_date = now() where id = $2',
    values: [nextDate, statementId],
  })

module.exports = {
  commitAndStartNewTransaction: db.commitAndStartNewTransaction,
  createDraftReport,
  updateDraftReport,
  submitReport,
  getCurrentDraftReport,
  getReports,
  getInvolvedStaff,
  getNextNotificationReminder,
  setNextReminderDate,
}
