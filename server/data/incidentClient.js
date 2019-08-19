const format = require('pg-format')
const db = require('./dataAccess/db')
const { ReportStatus, StatementStatus } = require('../config/types')

const createDraftIncident = async ({ userId, bookingId, reporterName, offenderNo, incidentDate, formResponse }) => {
  const nextSequence = `(select COALESCE(MAX(sequence_no), 0) + 1 from report where booking_id = $5 and user_id = $2)`
  const result = await db.query({
    text: `insert into report (form_response, user_id, reporter_name, offender_no, booking_id, status, incident_date, sequence_no, created_date)
            values ($1, CAST($2 AS VARCHAR), $3, $4, $5, $6, $7, ${nextSequence}, CURRENT_TIMESTAMP)
            returning id`,
    values: [formResponse, userId, reporterName, offenderNo, bookingId, ReportStatus.IN_PROGRESS.value, incidentDate],
  })
  return result.rows[0].id
}

const updateDraftIncident = (reportId, incidentDate, formResponse) => {
  return db.query({
    text: `update report r set form_response = $1, incident_date = COALESCE($2, r.incident_date) where r.id = $3`,
    values: [formResponse, incidentDate, reportId],
  })
}

const maxSequenceForBooking =
  '(select max(r2.sequence_no) from report r2 where r2.booking_id = r.booking_id and user_id = r.user_id)'

const submit = (userId, bookingId) => {
  return db.query({
    text: `update report r set status = $1, submitted_date = CURRENT_TIMESTAMP 
    where user_id = $2
    and booking_id = $3
    and status = $4
    and r.sequence_no = ${maxSequenceForBooking}`,
    values: [ReportStatus.SUBMITTED.value, userId, bookingId, ReportStatus.IN_PROGRESS.value],
  })
}

const getCurrentDraftIncident = async (userId, bookingId, query = db.query) => {
  const results = await query({
    text: `select id, incident_date, form_response from report r
          where user_id = $1
          and booking_id = $2
          and status = $3
          and r.sequence_no = ${maxSequenceForBooking}`,
    values: [userId, bookingId, ReportStatus.IN_PROGRESS.value],
  })
  return results.rows[0] || {}
}

const getStatementsForUser = (userId, status, query = db.query) => {
  return query({
    text: `select r.id, r.booking_id, r.reporter_name, r.offender_no, r.incident_date, s."name"
            from statement s 
            inner join report r on s.report_id = r.id   
          where r.status = $1 
          and s.user_id = $2 
          and s.statement_status = $3`,
    values: ['SUBMITTED', userId, status.value],
  })
}

const getStatement = async (userId, reportId, status, query = db.query) => {
  const results = await query({
    text: `select r.id
    ,      r.booking_id             "bookingId"
    ,      r.incident_date          "incidentDate"
    ,      s.last_training_month    "lastTrainingMonth"
    ,      s.last_training_year     "lastTrainingYear"
    ,      s.job_start_year         "jobStartYear"
    ,      s.statement
    ,      s.submitted_date         "submittedDate"
    from report r 
    left join statement s on r.id = s.report_id
    where r.id = $1 and r.user_id = $2 and s.statement_status = $3`,
    values: [reportId, userId, status.value],
  })
  return results.rows[0]
}

const saveStatement = (
  userId,
  reportId,
  { lastTrainingMonth, lastTrainingYear, jobStartYear, statement },
  query = db.query
) => {
  return query({
    text: `update statement 
    set last_training_month = $1
    ,   last_training_year = $2
    ,   job_start_year = $3
    ,   statement = $4
    where user_id = $5
    and report_id = $6
    and statement_status = $7`,
    values: [
      lastTrainingMonth,
      lastTrainingYear,
      jobStartYear,
      statement,
      userId,
      reportId,
      StatementStatus.PENDING.value,
    ],
  })
}

const submitStatement = (userId, reportId, query = db.query) => {
  return query({
    text: `update statement 
    set submitted_date = CURRENT_TIMESTAMP
    ,   statement_status = $1
    where user_id = $2
    and report_id = $3
    and statement_status = $4`,
    values: [StatementStatus.SUBMITTED.value, userId, reportId, StatementStatus.PENDING.value],
  })
}

const getInvolvedStaff = async (reportId, query = db.query) => {
  const results = await query({
    text: 'select id, user_id username, name, email from statement where report_id = $1 order by id',
    values: [reportId],
  })
  return results.rows
}

const deleteInvolvedStaff = reportId => {
  return db.query({
    text: `delete from statement where report_id = $1`,
    values: [reportId],
  })
}

const insertInvolvedStaff = async (reportId, staff) => {
  const rows = staff.map(s => [reportId, s.userId, s.name, s.email, StatementStatus.PENDING.value])
  const results = await db.query({
    text: format(
      'insert into statement (report_id, user_id, name, email, statement_status) VALUES %L returning id',
      rows
    ),
  })
  return results.rows.map(row => row.id)
}

module.exports = {
  createDraftIncident,
  updateDraftIncident,
  submit,
  getCurrentDraftIncident,
  getStatementsForUser,
  getStatement,
  getInvolvedStaff,
  deleteInvolvedStaff,
  insertInvolvedStaff,
  saveStatement,
  submitStatement,
}
