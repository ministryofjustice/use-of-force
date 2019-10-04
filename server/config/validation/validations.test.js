const { validate } = require('../../utils/fieldValidation')
const {
  joi,
  validations: { requiredMonthIndexNotInFuture, requiredYearNotInFuture },
} = require('./validations')

jest.mock('moment', () => () => ({
  year: () => 2019,
  month: () => 9,
}))

describe('requiredMonthIndexNotInFuture', () => {
  const formSchema = joi.object({ year: requiredYearNotInFuture, month: requiredMonthIndexNotInFuture('year') })

  const fields = [
    {
      month: {
        validationMessage: 'Select the month',
      },
    },
    {
      year: {},
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
    expect(validate(fields, formSchema, { month: '9', year: '2019' })).toEqual([])
  })

  test('Next month of this year invalid', () => {
    expect(validate(fields, formSchema, { month: '10', year: '2019' })).toEqual([selectMonth])
  })

  test('Next year invalid', () => {
    expect(validate(fields, formSchema, { month: '01', year: '2020' })).toEqual([yearLessEq2019])
  })

  test('Last month of previous year valid', () => {
    expect(validate(fields, formSchema, { month: '11', year: '2018' })).toEqual([])
  })

  test('year is not a number', () => {
    expect(validate(fields, formSchema, { month: '1', year: 'xxxx' })).toEqual([yearMustBeANumber])
  })

  test('no month or year', () => {
    expect(validate(fields, formSchema, {})).toEqual(expect.arrayContaining([yearIsRequired]))
  })
})
