const incidentClient = require('./incidentClient')
const db = require('./dataAccess/db')
const { ReportStatus, StatementStatus } = require('../config/types')

jest.mock('../../server/data/dataAccess/db')

afterEach(() => {
  db.query.mockReset()
})

describe('getCurrentDraftReport', () => {
  test('it should call query on db', () => {
    incidentClient.getCurrentDraftReport('user1')
    expect(db.query).toBeCalledTimes(1)
  })

  test('it should pass om the correct sql', () => {
    incidentClient.getCurrentDraftReport('user1', -1)

    expect(db.query).toBeCalledWith({
      text: `select id, incident_date, form_response from report r
          where user_id = $1
          and booking_id = $2
          and status = $3
          and r.sequence_no = (select max(r2.sequence_no) from report r2 where r2.booking_id = r.booking_id and user_id = r.user_id)`,
      values: ['user1', -1, ReportStatus.IN_PROGRESS.value],
    })
  })
})

test('createDraftReport', async () => {
  db.query.mockReturnValue({ rows: [{ id: 1 }] })

  const id = await incidentClient.createDraftReport({
    userId: 'user1',
    bookingId: 'booking-1',
    reporterName: 'Bob Smith',
    offenderNo: 'AA11ABC',
    incidentDate: 'date-1',
    formResponse: { someData: true },
  })

  expect(id).toEqual(id)
  expect(db.query).toBeCalledWith({
    text: `insert into report (form_response, user_id, reporter_name, offender_no, booking_id, status, incident_date, sequence_no, created_date)
            values ($1, CAST($2 AS VARCHAR), $3, $4, $5, $6, $7, (select COALESCE(MAX(sequence_no), 0) + 1 from report where booking_id = $5 and user_id = $2), CURRENT_TIMESTAMP)
            returning id`,
    values: [
      { someData: true },
      'user1',
      'Bob Smith',
      'AA11ABC',
      'booking-1',
      ReportStatus.IN_PROGRESS.value,
      'date-1',
    ],
  })
})

test('updateDraftReport', () => {
  incidentClient.updateDraftReport('formId', 'date-1', {})

  expect(db.query).toBeCalledWith({
    text: 'update report r set form_response = $1, incident_date = COALESCE($2, r.incident_date) where r.id = $3',
    values: [{}, 'date-1', 'formId'],
  })
})

test('submitReport', () => {
  incidentClient.submitReport('user1', 'booking1')

  expect(db.query).toBeCalledWith({
    text: `update report r set status = $1, submitted_date = CURRENT_TIMESTAMP 
    where user_id = $2
    and booking_id = $3
    and status = $4
    and r.sequence_no = (select max(r2.sequence_no) from report r2 where r2.booking_id = r.booking_id and user_id = r.user_id)`,
    values: [ReportStatus.SUBMITTED.value, 'user1', 'booking1', ReportStatus.IN_PROGRESS.value],
  })
})

test('getStatementsForUser', () => {
  incidentClient.getStatementsForUser('user1', StatementStatus.PENDING)

  expect(db.query).toBeCalledWith({
    text: `select r.id, r.booking_id, r.reporter_name, r.offender_no, r.incident_date, s."name"
            from statement s 
            inner join report r on s.report_id = r.id   
          where r.status = $1 
          and s.user_id = $2 
          and s.statement_status = $3`,
    values: [ReportStatus.SUBMITTED.value, 'user1', StatementStatus.PENDING.value],
  })
})

test('getStatement', () => {
  incidentClient.getStatement('user-1', 'incident-1', StatementStatus.PENDING)

  expect(db.query).toBeCalledWith({
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
    values: ['incident-1', 'user-1', StatementStatus.PENDING.value],
  })
})

test('getInvolvedStaff', async () => {
  const expected = [{ id: 1 }, { id: 2 }]
  db.query.mockReturnValue({ rows: expected })

  const result = await incidentClient.getInvolvedStaff('incident-1')

  expect(result).toEqual(expected)
  expect(db.query).toBeCalledWith({
    text: `select id, user_id username, name, email from statement where report_id = $1 order by id`,
    values: ['incident-1'],
  })
})

test('deleteInvolvedStaff', () => {
  incidentClient.deleteInvolvedStaff('incident-1')

  expect(db.query).toBeCalledWith({
    text: `delete from statement where report_id = $1`,
    values: ['incident-1'],
  })
})

test('insertInvolvedStaff', async () => {
  db.query.mockReturnValue({ rows: [{ id: 1 }, { id: 2 }] })

  const ids = await incidentClient.insertInvolvedStaff('incident-1', [
    { userId: 1, name: 'aaaa', email: 'aaaa@gov.uk' },
    { userId: 2, name: 'bbbb', email: 'bbbb@gov.uk' },
  ])

  expect(ids).toEqual([1, 2])
  expect(db.query).toBeCalledWith({
    text: `insert into statement (report_id, user_id, name, email, statement_status) VALUES ('incident-1', '1', 'aaaa', 'aaaa@gov.uk', 'PENDING'), ('incident-1', '2', 'bbbb', 'bbbb@gov.uk', 'PENDING') returning id`,
  })
})

test('save', () => {
  incidentClient.saveStatement('user1', 'incident1', {
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
    where user_id = $5
    and report_id = $6
    and statement_status = $7`,
    values: [1, 2, 3, 'A long time ago...', 'user1', 'incident1', StatementStatus.PENDING.value],
  })
})

test('submitStatement', () => {
  incidentClient.submitStatement('user1', 'incident1')

  expect(db.query).toBeCalledWith({
    text: `update statement 
    set submitted_date = CURRENT_TIMESTAMP
    ,   statement_status = $1
    where user_id = $2
    and report_id = $3
    and statement_status = $4`,
    values: [StatementStatus.SUBMITTED.value, 'user1', 'incident1', StatementStatus.PENDING.value],
  })
})
