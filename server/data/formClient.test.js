const formClient = require('./formClient')
const db = require('./dataAccess/db')

jest.mock('../../server/data/dataAccess/db')

afterEach(() => {
  db.query.mockReset()
})

describe('getCurrentDraftIncident', () => {
  test('it should call query on db', () => {
    formClient.getCurrentDraftIncident('user1')
    expect(db.query).toBeCalledTimes(1)
  })

  test('it should pass om the correct sql', () => {
    formClient.getCurrentDraftIncident('user1', -1)

    expect(db.query).toBeCalledWith({
      text: `select id, incident_date, form_response from incidents i
          where user_id = $1
          and booking_id = $2
          and status = 'IN_PROGRESS'
          and i.sequence_no = (select max(i2.sequence_no) from incidents i2 where i2.booking_id = i.booking_id and user_id = i.user_id)`,
      values: ['user1', -1],
    })
  })
})

test('create', () => {
  db.query.mockReturnValue({ rows: [{ id: 1 }] })

  const id = formClient.create({
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
    values: [{ someData: true }, 'user1', 'Bob Smith', 'AA11ABC', 'booking-1', 'IN_PROGRESS', 'date-1'],
  })
})

test('update', () => {
  formClient.update('formId', 'date-1', {})

  expect(db.query).toBeCalledWith({
    text: 'update incidents i set form_response = $1, incident_date = COALESCE($2, i.incident_date) where i.id = $3',
    values: [{}, 'date-1', 'formId'],
  })
})

test('submit', () => {
  formClient.submit('user1', 'booking1')

  expect(db.query).toBeCalledWith({
    text: `update incidents i set status = $1, submitted_date = CURRENT_TIMESTAMP 
    where user_id = $2
    and booking_id = $3
    and status = 'IN_PROGRESS'
    and i.sequence_no = (select max(i2.sequence_no) from incidents i2 where i2.booking_id = i.booking_id and user_id = i.user_id)`,
    values: ['SUBMITTED', 'user1', 'booking1'],
  })
})

test('getIncidentsForUser', () => {
  formClient.getIncidentsForUser('user1', 'STATUS_1')

  expect(db.query).toBeCalledWith({
    text: `select i.id, i.booking_id, i.reporter_name, i.offender_no, i.incident_date, inv.id, inv."name"
            from involved_staff inv 
            inner join incidents i on inv.incident_id = i.id   
          where i.status = $1 
          and inv.user_id = $2 
          and inv.statement_status = $3`,
    values: ['SUBMITTED', 'user1', 'PENDING'],
  })
})

test('getInvolvedStaff', async () => {
  const expected = [{ id: 1 }, { id: 2 }]
  db.query.mockReturnValue({ rows: expected })

  const result = await formClient.getInvolvedStaff('incident-1')

  expect(result).toEqual(expected)
  expect(db.query).toBeCalledWith({
    text: `select id, user_id, name, email from involved_staff where incident_id = $1`,
    values: ['incident-1'],
  })
})

test('deleteInvolvedStaff', () => {
  formClient.deleteInvolvedStaff('incident-1')

  expect(db.query).toBeCalledWith({
    text: `delete from involved_staff where incident_id = $1`,
    values: ['incident-1'],
  })
})

test('insertInvolvedStaff', async () => {
  db.query.mockReturnValue({ rows: [{ id: 1 }, { id: 2 }] })

  const ids = await formClient.insertInvolvedStaff('incident-1', [
    { userId: 1, name: 'aaaa' },
    { userId: 2, name: 'bbbb' },
  ])

  expect(ids).toEqual([1, 2])
  expect(db.query).toBeCalledWith({
    text: `insert into involved_staff (incident_id, user_id, name, statement_status) VALUES ('incident-1', '1', 'aaaa', 'PENDING'), ('incident-1', '2', 'bbbb', 'PENDING') returning id`,
  })
})
