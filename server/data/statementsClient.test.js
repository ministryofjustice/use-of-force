const statementsClient = require('./statementsClient')
const db = require('./dataAccess/db')
const { StatementStatus } = require('../config/types')

jest.mock('../../server/data/dataAccess/db')

afterEach(() => {
  db.query.mockReset()
})

test('getStatements', () => {
  statementsClient.getStatements('user1', StatementStatus.PENDING)

  expect(db.query).toBeCalledWith({
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
    values: ['user1', StatementStatus.PENDING.value],
  })
})

test('getStatementForUser', () => {
  statementsClient.getStatementForUser('user-1', 'incident-1', StatementStatus.PENDING)

  expect(db.query).toBeCalledWith({
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
    values: ['incident-1', 'user-1', StatementStatus.PENDING.value],
  })
})

test('getAdditionalComments', () => {
  statementsClient.getAdditionalComments(48)

  expect(db.query).toBeCalledWith({
    text: `select  
    s.additional_comment "additionalComment",
    s.date_submitted     "dateSubmitted" 
    from statement_amendments s
    where s.statement_id = $1`,
    values: [48],
  })
})

test('saveAdditionalComment', () => {
  statementsClient.saveAdditionalComment(50, 'Another comment made')
  expect(db.query).toBeCalledWith({
    text: `insert into statement_amendments (statement_id, additional_comment)
            values ($1, $2)`,
    values: [50, 'Another comment made'],
  })
})

test('createStatements', async () => {
  db.query.mockReturnValue({ rows: [{ id: 1, userId: 'a' }, { id: 2, userId: 'b' }] })

  const ids = await statementsClient.createStatements('incident-1', 'date1', 'date2', [
    { staffId: 0, userId: 1, name: 'aaaa', email: 'aaaa@gov.uk' },
    { staffId: 1, userId: 2, name: 'bbbb', email: 'bbbb@gov.uk' },
  ])

  expect(ids).toEqual({ a: 1, b: 2 })
  expect(db.query).toBeCalledWith({
    text:
      `insert into statement (report_id, staff_id, user_id, name, email, next_reminder_date, overdue_date, statement_status) VALUES ` +
      `('incident-1', '0', '1', 'aaaa', 'aaaa@gov.uk', 'date1', 'date2', 'PENDING'), ` +
      `('incident-1', '1', '2', 'bbbb', 'bbbb@gov.uk', 'date1', 'date2', 'PENDING') returning id, user_id "userId"`,
  })
})

test('saveStatement', () => {
  statementsClient.saveStatement('user1', 'incident1', {
    lastTrainingMonth: 1,
    lastTrainingYear: 2,
    jobStartYear: 3,
    statement: 'A long time ago...',
  })

  expect(db.query).toBeCalledWith({
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
    values: [1, 2, 3, 'A long time ago...', 'user1', 'incident1', StatementStatus.PENDING.value],
  })
})

test('submitStatement', () => {
  statementsClient.submitStatement('user1', 'incident1')

  expect(db.query).toBeCalledWith({
    text: `update statement 
    set submitted_date = CURRENT_TIMESTAMP
    ,   statement_status = $1
    ,   updated_date = CURRENT_TIMESTAMP
    where user_id = $2
    and report_id = $3
    and statement_status = $4`,
    values: [StatementStatus.SUBMITTED.value, 'user1', 'incident1', StatementStatus.PENDING.value],
  })
})

test('getNumberOfPendingStatements', () => {
  statementsClient.getNumberOfPendingStatements('report1')

  expect(db.query).toBeCalledWith({
    text: `select count(*) from statement where report_id = $1 AND statement_status = $2`,
    values: ['report1', StatementStatus.PENDING.value],
  })
})

test('getStatementsForReviewer', () => {
  statementsClient.getStatementsForReviewer('report1')

  expect(db.query).toBeCalledWith({
    text: `select id
            ,      name
            ,      overdue_date <= now()    "isOverdue"
            ,      statement_status = $1    "isSubmitted"
            from statement where report_id = $2
            order by name`,
    values: [StatementStatus.SUBMITTED.value, 'report1'],
  })
})

test('getStatementForReviewer', () => {
  statementsClient.getStatementForReviewer('statement1')

  expect(db.query).toBeCalledWith({
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
    values: ['statement1'],
  })
})
