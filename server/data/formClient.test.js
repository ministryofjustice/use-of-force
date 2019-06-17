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
    formClient.getFormDataForUser('user1')

    expect(db.query).toBeCalledWith({
      text: 'select id, form_response from form where user_id = $1',
      values: ['user1'],
    })
  })
})

describe('update', () => {
  test('it should call query on db', () => {
    formClient.update('formId', {}, 'userId')
    expect(db.query).toBeCalledTimes(1)
  })

  test('it should insert if no formId passed in', () => {
    formClient.update(undefined, {}, 'user1')

    expect(db.query).toBeCalledWith({
      text: 'insert into form (form_response, user_id) values ($1, $2)',
      values: [{}, 'user1'],
    })
  })

  test('it should update if formId passed in', () => {
    formClient.update('formId', {}, 'user1')

    expect(db.query).toBeCalledWith({
      text: 'update form set form_response = $1 where user_id=$2',
      values: [{}, 'user1'],
    })
  })
})
