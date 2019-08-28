const moment = require('moment')
const config = require('./incident.js')
const formProcessing = require('../services/formProcessing')

const validatorChecker = formConfig => input => {
  const { payloadFields: formResponse, errors, extractedFields } = formProcessing.processInput(formConfig, input)
  return { formResponse, errors, extractedFields }
}

let validInput = {}
const check = validatorChecker(config.incidentDetails)
beforeEach(() => {
  validInput = {
    incidentDate: '2019-08-27T13:59:33+01:00',
    locationId: -1,
    plannedUseOfForce: 'true',
    involvedStaff: [{ username: 'User bob' }, { username: '' }],
    witnesses: [{ name: 'User bob' }, { name: '' }],
  }
})

describe('Incident details page - overall', () => {
  it('Should return no validation error messages if every primary input field completed correctly', () => {
    const input = validInput
    const { errors, formResponse, extractedFields } = check(input)

    expect(errors).toEqual([])

    expect(extractedFields).toEqual({ incidentDate: moment('2019-08-27T12:59:33.000Z').toDate() })
    expect(formResponse).toEqual({
      locationId: -1,
      plannedUseOfForce: true,
      involvedStaff: [{ username: 'User bob' }],
      witnesses: [{ name: 'User bob' }],
    })
  })

  it('Should return error massages if no input field is completed', () => {
    const input = {}
    const { errors, formResponse, extractedFields } = check(input)

    expect(errors).toEqual([
      {
        href: '#locationId',
        text: 'Select the location of the incident',
      },
      {
        href: '#plannedUseOfForce',
        text: 'Select yes if the use of force was planned',
      },
      {
        href: '#involvedStaff[0][username]',
        text: 'Enter the name of the staff member involved in the use of force incident',
      },
    ])

    expect(formResponse).toEqual({})
    expect(extractedFields).toEqual({})
  })
})

describe('Incident location', () => {
  it('Not a number', () => {
    const input = { ...validInput, locationId: 'aaa' }
    const { errors, formResponse } = check(input)

    expect(errors).toEqual([
      {
        href: '#locationId',
        text: 'Select the location of the incident',
      },
    ])

    expect(formResponse).toEqual({
      plannedUseOfForce: true,
      involvedStaff: [{ username: 'User bob' }],
      witnesses: [{ name: 'User bob' }],
    })
  })
})

describe('Planned use of force', () => {
  it('Not a boolean', () => {
    const input = { ...validInput, plannedUseOfForce: 'not a bool' }
    const { errors, formResponse } = check(input)

    expect(errors).toEqual([
      {
        href: '#plannedUseOfForce',
        text: 'Select yes if the use of force was planned',
      },
    ])

    expect(formResponse).toEqual({
      locationId: -1,
      involvedStaff: [{ username: 'User bob' }],
      witnesses: [{ name: 'User bob' }],
    })
  })
})

describe('Involved staff', () => {
  it('None present', () => {
    const input = { ...validInput, involvedStaff: [{ username: '' }] }
    const { errors, formResponse } = check(input)

    expect(errors).toEqual([
      {
        href: '#involvedStaff[0][username]',
        text: 'Enter the name of the staff member involved in the use of force incident',
      },
    ])

    expect(formResponse).toEqual({
      locationId: -1,
      plannedUseOfForce: true,
      witnesses: [{ name: 'User bob' }],
    })
  })
})
