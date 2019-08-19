const incidentClient = require('./incidentClient')
const db = require('./dataAccess/db')
const { ReportStatus, StatementStatus } = require('../config/types')

jest.mock('../../server/data/dataAccess/db')

afterEach(() => {
  db.query.mockReset()
})

describe('getCurrentDraftIncident', () => {
  test('it should call query on db', () => {
    incidentClient.getCurrentDraftIncident('user1')
    expect(db.query).toBeCalledTimes(1)
  })

  test('it should pass om the correct sql', () => {
    incidentClient.getCurrentDraftIncident('user1', -1)

    expect(db.query).toBeCalledWith({
      text: `select id, incident_date, form_response from incidents i
          where user_id = $1
          and booking_id = $2
          and status = $3
          and i.sequence_no = (select max(i2.sequence_no) from incidents i2 where i2.booking_id = i.booking_id and user_id = i.user_id)`,
      values: ['user1', -1, ReportStatus.IN_PROGRESS.value],
    })
  })
})

test('createDraftIncident', async () => {
  db.query.mockReturnValue({ rows: [{ id: 1 }] })

  const id = await incidentClient.createDraftIncident({
    userId: 'user1',
    bookingId: 'booking-1',
    reporterName: 'Bob Smith',
    offenderNo: 'AA11ABC',
    incidentDate: 'date-1',
    formResponse: { someData: true },
  })

  expect(id).toEqual(id)
  expect(db.query).toBeCalledWith({
    text: `insert into incidents (form_response, user_id, reporter_name, offender_no, booking_id, status, incident_date, sequence_no, created_date)
            values ($1, CAST($2 AS VARCHAR), $3, $4, $5, $6, $7, (select COALESCE(MAX(sequence_no), 0) + 1 from incidents where booking_id = $5 and user_id = $2), CURRENT_TIMESTAMP)
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

test('updateDraftIncident', () => {
  incidentClient.updateDraftIncident('formId', 'date-1', {})

  expect(db.query).toBeCalledWith({
    text: 'update incidents i set form_response = $1, incident_date = COALESCE($2, i.incident_date) where i.id = $3',
    values: [{}, 'date-1', 'formId'],
  })
})

test('submit', () => {
  incidentClient.submit('user1', 'booking1')

  expect(db.query).toBeCalledWith({
    text: `update incidents i set status = $1, submitted_date = CURRENT_TIMESTAMP 
    where user_id = $2
    and booking_id = $3
    and status = $4
    and i.sequence_no = (select max(i2.sequence_no) from incidents i2 where i2.booking_id = i.booking_id and user_id = i.user_id)`,
    values: [ReportStatus.SUBMITTED.value, 'user1', 'booking1', ReportStatus.IN_PROGRESS.value],
  })
})

test('getStatementsForUser', () => {
  incidentClient.getStatementsForUser('user1', StatementStatus.PENDING)

  expect(db.query).toBeCalledWith({
    text: `select i.id, i.booking_id, i.reporter_name, i.offender_no, i.incident_date, inv."name"
            from involved_staff inv 
            inner join incidents i on inv.incident_id = i.id   
          where i.status = $1 
          and inv.user_id = $2 
          and inv.statement_status = $3`,
    values: [ReportStatus.SUBMITTED.value, 'user1', StatementStatus.PENDING.value],
  })
})

test('getStatement', () => {
  incidentClient.getStatement('user-1', 'incident-1', StatementStatus.PENDING)

  expect(db.query).toBeCalledWith({
    text: `select i.id
    ,      i.booking_id             "bookingId"
    ,      i.incident_date          "incidentDate"
    ,      inv.last_training_month  "lastTrainingMonth"
    ,      inv.last_training_year   "lastTrainingYear"
    ,      inv.job_start_year       "jobStartYear"
    ,      inv.statement
    ,      inv.submitted_date       "submittedDate"
    from incidents i 
    left join involved_staff inv on i.id = inv.incident_id
    where i.id = $1 and i.user_id = $2 and inv.statement_status = $3`,
    values: ['incident-1', 'user-1', StatementStatus.PENDING.value],
  })
})

test('getInvolvedStaff', async () => {
  const expected = [{ id: 1 }, { id: 2 }]
  db.query.mockReturnValue({ rows: expected })

  const result = await incidentClient.getInvolvedStaff('incident-1')

  expect(result).toEqual(expected)
  expect(db.query).toBeCalledWith({
    text: `select id, user_id username, name, email from involved_staff where incident_id = $1 order by id`,
    values: ['incident-1'],
  })
})

test('deleteInvolvedStaff', () => {
  incidentClient.deleteInvolvedStaff('incident-1')

  expect(db.query).toBeCalledWith({
    text: `delete from involved_staff where incident_id = $1`,
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
    text: `insert into involved_staff (incident_id, user_id, name, email, statement_status) VALUES ('incident-1', '1', 'aaaa', 'aaaa@gov.uk', 'PENDING'), ('incident-1', '2', 'bbbb', 'bbbb@gov.uk', 'PENDING') returning id`,
  })
})

test('saveStatement', () => {
  incidentClient.saveStatement('user1', 'incident1', {
    lastTrainingMonth: 1,
    lastTrainingYear: 2,
    jobStartYear: 3,
    statement: 'A long time ago...',
  })

  expect(db.query).toBeCalledWith({
    text: `update involved_staff 
    set last_training_month = $1
    ,   last_training_year = $2
    ,   job_start_year = $3
    ,   statement = $4
    where user_id = $5
    and incident_id = $6
    and statement_status = $7`,
    values: [1, 2, 3, 'A long time ago...', 'user1', 'incident1', StatementStatus.PENDING.value],
  })
})

test('submitStatement', () => {
  incidentClient.submitStatement('user1', 'incident1')

  expect(db.query).toBeCalledWith({
    text: `update involved_staff 
    set submitted_date = CURRENT_TIMESTAMP
    ,   statement_status = $1
    where user_id = $2
    and incident_id = $3
    and statement_status = $4`,
    values: [StatementStatus.SUBMITTED.value, 'user1', 'incident1', StatementStatus.PENDING.value],
  })
})
