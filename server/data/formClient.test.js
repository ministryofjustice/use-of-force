const formClient = require('./formClient')
const db = require('./dataAccess/db')

jest.mock('../../server/data/dataAccess/db')

afterEach(() => {
  db.query.mockReset()
})

describe('getFormDataForUser', () => {
  test('it should call query on db', () => {
    formClient.getFormDataForUser('user1')
    expect(db.query).toBeCalledTimes(1)
  })

  test('it should pass om the correct sql', () => {
    formClient.getFormDataForUser('user1', -1)

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
    text: `select id, booking_id, reporter_name, offender_no, incident_date
          from incidents
          where (user_id = $1 or form_response -> 'incident' -> 'newIncident' -> 'involved'  @> $2)
          and status = $3`,
    values: ['user1', '[{"name":"user1"}]', 'STATUS_1'],
  })
})
