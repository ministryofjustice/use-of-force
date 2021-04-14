import StatementsClient from './statementsClient'
import { StatementStatus } from '../config/types'
import { PageResponse } from '../utils/page'

let statementsClient: StatementsClient
const query = jest.fn()

beforeEach(() => {
  jest.resetAllMocks()
  query.mockResolvedValue({ rows: [] })
  statementsClient = new StatementsClient(query)
})

test('getStatements', async () => {
  const results = await statementsClient.getStatements('user1', 1)

  expect(results).toStrictEqual(new PageResponse({ max: 0, min: 0, page: 1, totalCount: 0, totalPages: 0 }, []))
  expect(query).toBeCalledWith({
    text: `select r.id, count(*) OVER() AS "totalCount"
            , r.reporter_name          "reporterName"
            , r.offender_no            "offenderNo"
            , r.incident_date          "incidentDate"
            , s."name"
            , s.in_progress            "inProgress"
            , s.overdue_date <= now()  "isOverdue"
            , s.statement_status       "status"
            from statement s 
            inner join report r on s.report_id = r.id   
          where s.user_id = $1
          and s.deleted is null
          order by status, r.incident_date desc
          offset $2
          limit $3`,
    values: ['user1', 0, 20],
  })
})

test('getStatementForUser', () => {
  statementsClient.getStatementForUser('user-1', 19, StatementStatus.PENDING)

  expect(query).toBeCalledWith({
    text: `select s.id
            ,      r.booking_id             "bookingId"
            ,      r.incident_date          "incidentDate"
            ,      s.last_training_month    "lastTrainingMonth"
            ,      s.last_training_year     "lastTrainingYear"
            ,      s.job_start_year         "jobStartYear"
            ,      s.statement
            ,      s.submitted_date         "submittedDate"
            ,      s.name                   "name"
            ,      r.reporter_name          "reporterName"
            from report r
            left join statement s on r.id = s.report_id
            where r.id = $1
              and r.deleted is null
              and s.user_id = $2
              and s.statement_status = $3
              and s.deleted is null`,
    values: [19, 'user-1', StatementStatus.PENDING.value],
  })
})

test('getAdditionalComments', () => {
  statementsClient.getAdditionalComments(48)

  expect(query).toBeCalledWith({
    text: `select  
    s.additional_comment "additionalComment",
    s.date_submitted     "dateSubmitted" 
    from v_statement_amendments s
    where s.statement_id = $1`,
    values: [48],
  })
})

test('saveAdditionalComment', () => {
  statementsClient.saveAdditionalComment(50, 'Another comment made')
  expect(query).toBeCalledWith({
    text: `insert into v_statement_amendments (statement_id, additional_comment)
            values ($1, $2)`,
    values: [50, 'Another comment made'],
  })
})

test('createStatements', async () => {
  query.mockReturnValue({
    rows: [
      { id: 1, userId: 'a' },
      { id: 2, userId: 'b' },
    ],
  })

  const firstReminder = new Date(1)
  const overdueDate = new Date(2)

  const ids = await statementsClient.createStatements(1, firstReminder, overdueDate, [
    { staffId: 0, username: 'user-1', name: 'aaaa', email: 'aaaa@gov.uk' },
    { staffId: 1, username: 'user-2', name: 'bbbb', email: 'bbbb@gov.uk' },
  ])

  expect(ids).toEqual({ a: 1, b: 2 })
  expect(query).toBeCalledWith({
    text:
      `insert into v_statement (report_id, staff_id, user_id, name, email, next_reminder_date, overdue_date, statement_status) VALUES ` +
      `('1', '0', 'user-1', 'aaaa', 'aaaa@gov.uk', '1970-01-01 00:00:00.001+00', '1970-01-01 00:00:00.002+00', 'PENDING'), ` +
      `('1', '1', 'user-2', 'bbbb', 'bbbb@gov.uk', '1970-01-01 00:00:00.001+00', '1970-01-01 00:00:00.002+00', 'PENDING') returning id, user_id "userId"`,
  })
})

test('deleteStatement', async () => {
  query.mockReturnValue({ rows: [] })

  const date = new Date()
  await statementsClient.deleteStatement({ statementId: -1, query, now: date })

  expect(query).toBeCalledWith({
    text: 'update statement set deleted = $1 where id = $2',
    values: [date, -1],
  })
  expect(query).toBeCalledWith({
    text: 'update statement_amendments set deleted = $1 where statement_id = $2',
    values: [date, -1],
  })
})

test('saveStatement', () => {
  statementsClient.saveStatement('user1', 1, {
    lastTrainingMonth: 1,
    lastTrainingYear: 2,
    jobStartYear: 3,
    statement: 'A long time ago...',
  })

  expect(query).toBeCalledWith({
    text: `update v_statement 
    set last_training_month = $1
    ,   last_training_year = $2
    ,   job_start_year = $3
    ,   statement = $4
    ,   updated_date = CURRENT_TIMESTAMP
    ,   in_progress = true
    where user_id = $5
    and report_id = $6
    and statement_status = $7`,
    values: [1, 2, 3, 'A long time ago...', 'user1', 1, StatementStatus.PENDING.value],
  })
})

test('submitStatement', () => {
  statementsClient.submitStatement('user1', 1)

  expect(query).toBeCalledWith({
    text: `update v_statement 
    set submitted_date = CURRENT_TIMESTAMP
    ,   statement_status = $1
    ,   updated_date = CURRENT_TIMESTAMP
    where user_id = $2
    and report_id = $3
    and statement_status = $4`,
    values: [StatementStatus.SUBMITTED.value, 'user1', 1, StatementStatus.PENDING.value],
  })
})

test('setEmail', () => {
  statementsClient.setEmail('user1', 1, 'user@gov.uk')

  expect(query).toBeCalledWith({
    text: `update v_statement 
    set email = $3
    ,   updated_date = CURRENT_TIMESTAMP
    where user_id = $1
    and report_id = $2`,
    values: ['user1', 1, 'user@gov.uk'],
  })
})

test('getNumberOfPendingStatements', async () => {
  query.mockResolvedValue({ rows: [{ count: 10 }] })
  const count = await statementsClient.getNumberOfPendingStatements(1)

  expect(count).toBe(10)
  expect(query).toBeCalledWith({
    text: `select count(*) from v_statement where report_id = $1 AND statement_status = $2`,
    values: [1, StatementStatus.PENDING.value],
  })
})

test('getStatementsForReviewer', () => {
  statementsClient.getStatementsForReviewer(1)

  expect(query).toBeCalledWith({
    text: `select s.id
            ,      r.id                                   "reportId"
            ,      s.name
            ,      s.user_id                              "userId"
            ,      s.overdue_date <= now()                "isOverdue"
            ,      s.statement_status = $1                "isSubmitted"
            ,      s.removal_requested_date is not null   "isRemovalRequested"
            ,      r.booking_id                           "bookingId"
            ,      r.incident_date                        "incidentDate"
            ,      s.last_training_month                  "lastTrainingMonth"
            ,      s.last_training_year                   "lastTrainingYear"
            ,      s.job_start_year                       "jobStartYear"
            ,      s.statement
            ,      s.submitted_date                       "submittedDate"
            from v_report r
            left join v_statement s on r.id = s.report_id
            where report_id = $2
            order by s.name`,
    values: [StatementStatus.SUBMITTED.value, 1],
  })
})

test('getStatementForReviewer', () => {
  statementsClient.getStatementForReviewer(1)

  expect(query).toBeCalledWith({
    text: `select s.id
            ,      r.id                                      "reportId"
            ,      s.name
            ,      s.user_id                                 "userId"
            ,      s.overdue_date <= now()                   "isOverdue"
            ,      s.statement_status = $1                   "isSubmitted"
            ,      s.removal_requested_date is not null      "isRemovalRequested"
            ,      r.booking_id                              "bookingId"
            ,      r.incident_date                           "incidentDate"
            ,      s.last_training_month                     "lastTrainingMonth"
            ,      s.last_training_year                      "lastTrainingYear"
            ,      s.job_start_year                          "jobStartYear"
            ,      s.statement
            ,      s.submitted_date                          "submittedDate"
            from v_report r
            left join v_statement s on r.id = s.report_id
            where s.id = $2`,
    values: [StatementStatus.SUBMITTED.value, 1],
  })
})

test('isStatementPresentForUser', async () => {
  query.mockReturnValue({ rows: [{ count: 1 }] })

  const result = await statementsClient.isStatementPresentForUser(1, 'user-1')

  expect(result).toEqual(true)
  expect(query).toBeCalledWith({
    text: `select count(*) from v_statement where report_id = $1 and user_id = $2`,
    values: [1, 'user-1'],
  })
})

test('requestStatementRemoval', async () => {
  await statementsClient.requestStatementRemoval(1, 'removal reason')

  expect(query).toBeCalledWith({
    text: `update "statement"
              set removal_requested_date = now()
              ,   removal_requested_reason = $1
              ,   updated_date = now()
              where id = $2`,
    values: ['removal reason', 1],
  })
})

test('refuseStatementRemoval', async () => {
  await statementsClient.refuseStatementRemoval(1)

  expect(query).toBeCalledWith({
    text: `update "statement"
              set removal_requested_date = null
              ,   removal_requested_reason = null
              ,   updated_date = now()
              where id = $1`,
    values: [1],
  })
})

test('getRemovalRequestedReasonByStatementId', async () => {
  statementsClient.getRemovalRequestedReasonByStatementId(1)

  expect(query).toBeCalledWith({
    text: `select removal_requested_reason  "removalRequestedReason" from v_statement where id = $1`,
    values: [1],
  })
})
