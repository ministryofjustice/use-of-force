const { isValid } = require('./fieldValidation')

describe('isValid', () => {
  test('Check valid ', () => {
    expect(isValid('optionalInvolvedStaff', [{ username: 'Bob' }])).toEqual(true)
    expect(isValid('optionalInvolvedStaff', [])).toEqual(true)
  })

  test('invalid', () => {
    expect(isValid('optionalInvolvedStaff', [{ username: 'Bob', age: 29 }])).toEqual(false)
    expect(isValid('optionalInvolvedStaff', true)).toEqual(false)
    expect(isValid('optionalInvolvedStaff', [{ username: '' }])).toEqual(false)
    expect(isValid('optionalInvolvedStaff', [{ bob: 'Bob' }])).toEqual(false)
  })
})
