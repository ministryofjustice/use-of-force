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
      text: `select id, form_response from form f
          where user_id = $1
          and booking_id = $2
          and status = 'IN_PROGRESS'
          and f.sequence_no = (select max(f2.sequence_no) from form f2 where f2.booking_id = f.booking_id and user_id = f.user_id)`,
      values: ['user1', -1],
    })
  })
})

test('create', () => {
  formClient.create('user1', 'booking-1', { someData: true })

  expect(db.query).toBeCalledWith({
    text: `insert into form (form_response, user_id, booking_id, status, sequence_no, start_date)
            values ($1, CAST($2 AS VARCHAR), $3, $4, (select COALESCE(MAX(sequence_no), 0) + 1 from form where booking_id = $3 and user_id = $2), CURRENT_TIMESTAMP)`,
    values: [{ someData: true }, 'user1', 'booking-1', 'IN_PROGRESS'],
  })
})

test('update', () => {
  formClient.update('formId', {})

  expect(db.query).toBeCalledWith({
    text: 'update form f set form_response = $1 where f.id = $2',
    values: [{}, 'formId'],
  })
})

test('submit', () => {
  formClient.submit('user1', 'booking1')

  expect(db.query).toBeCalledWith({
    text: `update form f set status = $1, submitted_date = CURRENT_TIMESTAMP 
    where user_id = $2
    and booking_id = $3
    and status = 'IN_PROGRESS'
    and f.sequence_no = (select max(f2.sequence_no) from form f2 where f2.booking_id = f.booking_id and user_id = f.user_id)`,
    values: ['SUBMITTED', 'user1', 'booking1'],
  })
})

test('getIncidentsForUser', () => {
  formClient.getIncidentsForUser('user1', 'STATUS_1')

  expect(db.query).toBeCalledWith({
    text: `select id, booking_id, start_date, user_id
          from form
          where (user_id = $1 or form_response -> 'incident' -> 'newIncident' -> 'involved'  @> $2)
          and status = $3`,
    values: ['user1', '[{"name":"user1"}]', 'STATUS_1'],
  })
})
