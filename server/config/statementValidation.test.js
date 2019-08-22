const moment = require('moment')
const config = require('./statement.js')

const formProcessing = require('../services/formProcessing')

const validatorChecker = formConfig => input => {
  const { extractedFields: formResponse, errors } = formProcessing.processInput(formConfig, input)
  return { formResponse, errors }
}

const check = validatorChecker(config)

const validInput = {
  lastTrainingMonth: '11',
  lastTrainingYear: '1999',
  jobStartYear: '1995',
  statement: 'A statement about the incident',
}

it('successful input', () => {
  const input = validInput
  const { errors, formResponse } = check(input)

  expect(errors).toEqual([])

  expect(formResponse).toEqual({
    lastTrainingMonth: 11,
    lastTrainingYear: 1999,
    jobStartYear: 1995,
    statement: 'A statement about the incident',
  })
})

it('no values supplied', () => {
  const input = { submit: 'save-and-continue' }
  const { errors, formResponse } = check(input)

  expect(errors).toEqual([
    {
      href: '#lastTrainingMonth',
      text: 'Select the month you last attended refresher training',
    },
    {
      href: '#lastTrainingYear',
      text: 'Enter the year you last attended refresher training',
    },
    {
      href: '#jobStartYear',
      text: 'Enter the year you joined the prison service',
    },
    {
      href: '#statement',
      text: 'Enter your statement',
    },
  ])

  expect(formResponse).toEqual({})
})

describe('lastTrainingMonth', () => {
  it('wrong type', () => {
    const input = { ...validInput, lastTrainingMonth: 'asasas' }
    const { errors, formResponse } = check(input)

    expect(errors).toEqual([
      {
        href: '#lastTrainingMonth',
        text: 'Select the month you last attended refresher training',
      },
    ])

    expect(formResponse).toEqual({
      lastTrainingYear: 1999,
      jobStartYear: 1995,
      statement: 'A statement about the incident',
    })
  })

  it('not a valid month', () => {
    const input = { ...validInput, lastTrainingMonth: '12' }
    const { errors, formResponse } = check(input)

    expect(errors).toEqual([
      {
        href: '#lastTrainingMonth',
        text: 'Select the month you last attended refresher training',
      },
    ])

    expect(formResponse).toEqual({
      lastTrainingYear: 1999,
      lastTrainingMonth: 12,
      jobStartYear: 1995,
      statement: 'A statement about the incident',
    })
  })
})

describe('lastTrainingYear', () => {
  it('wrong type', () => {
    const input = { ...validInput, lastTrainingYear: 'asasas' }
    const { errors, formResponse } = check(input)

    expect(errors).toEqual([
      {
        href: '#lastTrainingYear',
        text: 'Enter the year you last attended refresher training',
      },
    ])

    expect(formResponse).toEqual({
      jobStartYear: 1995,
      lastTrainingMonth: 11,
      statement: 'A statement about the incident',
    })
  })

  it('not a valid year', () => {
    const input = { ...validInput, lastTrainingYear: `${moment().year() + 1}` }
    const { errors, formResponse } = check(input)

    expect(errors).toEqual([
      {
        href: '#lastTrainingYear',
        text: 'Enter the year you last attended refresher training which is not in the future',
      },
    ])

    expect(formResponse).toEqual({
      lastTrainingYear: 2020,
      lastTrainingMonth: 11,
      jobStartYear: 1995,
      statement: 'A statement about the incident',
    })
  })
})

describe('jobStartYear', () => {
  it('wrong type', () => {
    const input = { ...validInput, jobStartYear: 'asasas' }
    const { errors, formResponse } = check(input)

    expect(errors).toEqual([
      {
        href: '#jobStartYear',
        text: 'Enter the year you joined the prison service',
      },
    ])

    expect(formResponse).toEqual({
      lastTrainingYear: 1999,
      lastTrainingMonth: 11,
      statement: 'A statement about the incident',
    })
  })

  it('not a valid year', () => {
    const input = { ...validInput, jobStartYear: `${moment().year() + 1}` }
    const { errors, formResponse } = check(input)

    expect(errors).toEqual([
      {
        href: '#jobStartYear',
        text: 'Enter the year you joined the prison service which is not in the future',
      },
    ])

    expect(formResponse).toEqual({
      lastTrainingYear: 1999,
      lastTrainingMonth: 11,
      jobStartYear: 2020,
      statement: 'A statement about the incident',
    })
  })
})

describe('statement', () => {
  it('not empty space', () => {
    const input = { ...validInput, statement: '   \n   \t   ' }
    const { errors, formResponse } = check(input)

    expect(errors).toEqual([
      {
        href: '#statement',
        text: 'Enter your statement',
      },
    ])

    expect(formResponse).toEqual({
      lastTrainingYear: 1999,
      lastTrainingMonth: 11,
      jobStartYear: 1995,
    })
  })

  it('surrounding space is trimmed', () => {
    const input = { ...validInput, statement: '   \n A description  \t   ' }
    const { errors, formResponse } = check(input)

    expect(errors).toEqual([])

    expect(formResponse).toEqual({
      lastTrainingYear: 1999,
      lastTrainingMonth: 11,
      jobStartYear: 1995,
      statement: 'A description',
    })
  })
})
