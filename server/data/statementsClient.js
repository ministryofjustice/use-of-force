const format = require('pg-format')
const db = require('./dataAccess/db')
const { StatementStatus } = require('../config/types')

const getStatements = (userId, status, query = db.query) => {
  return query({
    text: `select r.id
            , r.reporter_name "reporterName"
            , r.offender_no   "offenderNo"
            , r.incident_date "incidentDate"
            , s."name"
            , s.in_progress   "inProgress"
            from statement s 
            inner join report r on s.report_id = r.id   
          where s.user_id = $1
          and s.statement_status = $2
          order by r.incident_date`,
    values: [userId, status.value],
  })
}

const getStatementForUser = async (userId, reportId, status, query = db.query) => {
  const results = await query({
    text: `select s.id
    ,      r.booking_id             "bookingId"
    ,      r.incident_date          "incidentDate"
    ,      s.last_training_month    "lastTrainingMonth"
    ,      s.last_training_year     "lastTrainingYear"
    ,      s.job_start_year         "jobStartYear"
    ,      s.statement
    ,      s.submitted_date         "submittedDate"
    from report r 
    left join statement s on r.id = s.report_id
    where r.id = $1 and s.user_id = $2 and s.statement_status = $3`,
    values: [reportId, userId, status.value],
  })
  return results.rows[0]
}

const getStatementForReviewer = async (statementId, query = db.query) => {
  const results = await query({
    text: `select s.id
    ,      r.id                     "reportId"
    ,      s.name
    ,      r.booking_id             "bookingId"
    ,      r.incident_date          "incidentDate"
    ,      s.last_training_month    "lastTrainingMonth"
    ,      s.last_training_year     "lastTrainingYear"
    ,      s.job_start_year         "jobStartYear"
    ,      s.statement
    ,      s.submitted_date         "submittedDate"
    from report r
    left join statement s on r.id = s.report_id
    where s.id = $1`,
    values: [statementId],
  })
  return results.rows[0]
}

const getStatementsForReviewer = async reportId => {
  const results = await db.query({
    text: `select id
            ,      name
            ,      overdue_date <= now()    "isOverdue"
            ,      statement_status = $1    "isSubmitted"
            from statement where report_id = $2
            order by name`,
    values: [StatementStatus.SUBMITTED.value, reportId],
  })
  return results.rows
}

const getAdditionalComments = async statementId => {
  const results = await db.query({
    text: `select  
    s.additional_comment "additionalComment",
    s.date_submitted     "dateSubmitted" 
    from statement_amendments s
    where s.statement_id = $1`,
    values: [statementId],
  })
  return results.rows
}

const saveAdditionalComment = (statementId, additionalComment) => {
  return db.query({
    text: `insert into statement_amendments (statement_id, additional_comment)
            values ($1, $2)`,
    values: [statementId, additionalComment],
  })
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
    ,   updated_date = CURRENT_TIMESTAMP
    ,   in_progress = true
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
    ,   updated_date = CURRENT_TIMESTAMP
    where user_id = $2
    and report_id = $3
    and statement_status = $4`,
    values: [StatementStatus.SUBMITTED.value, userId, reportId, StatementStatus.PENDING.value],
  })
}

const getNumberOfPendingStatements = async reportId => {
  const { rows } = await db.query({
    text: `select count(*) from statement where report_id = $1 AND statement_status = $2`,
    values: [reportId, StatementStatus.PENDING.value],
  })
  return parseInt(rows[0].count, 10)
}

const createStatements = async (reportId, firstReminder, overdueDate, staff, query = db.query) => {
  const rows = staff.map(s => [
    reportId,
    s.staffId,
    s.userId,
    s.name,
    s.email,
    firstReminder,
    overdueDate,
    StatementStatus.PENDING.value,
  ])
  const results = await query({
    text: format(
      'insert into statement (report_id, staff_id, user_id, name, email, next_reminder_date, overdue_date, statement_status) VALUES %L returning id, user_id "userId"',
      rows
    ),
  })
  return results.rows.reduce((result, staffMember) => ({ ...result, [staffMember.userId]: staffMember.id }), {})
}

module.exports = {
  getStatements,
  getStatementForUser,
  getStatementForReviewer,
  getStatementsForReviewer,
  createStatements,
  saveStatement,
  submitStatement,
  getAdditionalComments,
  saveAdditionalComment,
  getNumberOfPendingStatements,
}
