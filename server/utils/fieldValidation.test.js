const { isValid, validate } = require('./fieldValidation')

jest.mock('moment', () => () => ({
  year: () => 2019,
  month: () => 9,
}))

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

describe('validate', () => {
  describe('requiredMonthIndexNotInFuture', () => {
    const fields = [
      {
        month: {
          responseType: 'requiredMonthIndexNotInFuture_year',
          validationMessage: 'Select the month',
        },
      },
      {
        year: {
          responseType: 'requiredYearNotInFuture',
        },
      },
    ]

    const selectMonth = {
      href: '#month',
      text: 'Select the month',
    }

    const yearLessEq2019 = {
      href: '#year',
      text: '"year" must be less than or equal to 2019',
    }

    const yearMustBeANumber = {
      href: '#year',
      text: '"year" must be a number',
    }

    const yearIsRequired = {
      href: '#year',
      text: '"year" is required',
    }

    test('This month of this year valid', () => {
      expect(validate(fields, { month: '9', year: '2019' })).toEqual([])
    })

    test('Next month of this year invalid', () => {
      expect(validate(fields, { month: '10', year: '2019' })).toEqual([selectMonth])
    })

    test('Next year invalid', () => {
      expect(validate(fields, { month: '01', year: '2020' })).toEqual([yearLessEq2019])
    })

    test('Last month of previous year valid', () => {
      expect(validate(fields, { month: '11', year: '2018' })).toEqual([])
    })

    test('year is not a number', () => {
      expect(validate(fields, { month: '1', year: 'xxxx' })).toEqual([yearMustBeANumber])
    })

    test('no month or year', () => {
      expect(validate(fields, {})).toEqual(expect.arrayContaining([yearIsRequired, selectMonth]))
    })
  })
})
