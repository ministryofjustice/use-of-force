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
    incidentDate: {
      date: { day: '15', month: '1', year: '2019' },
      time: '12:45',
    },
    locationId: -1,
    plannedUseOfForce: 'true',
    involvedStaff: [{ username: 'itag_user' }, { username: '' }],
    witnesses: [{ name: 'User bob' }, { name: '' }],
  }
})

describe('Incident details page - overall', () => {
  it('Should return no validation error messages if every primary input field completed correctly', () => {
    const input = validInput
    const { errors, formResponse, extractedFields } = check(input)

    expect(errors).toEqual([])

    expect(extractedFields).toEqual({
      incidentDate: {
        date: {
          day: 15,
          month: 1,
          year: 2019,
        },
        raw: {
          day: '15',
          month: '1',
          time: '12:45',
          year: '2019',
        },
        value: moment('2019-01-15T12:45:00.000Z').toDate(),
        time: '12:45',
        isFutureDate: false,
        isFutureDateTime: false,
        isInvalidDate: false,
      },
    })
    expect(formResponse).toEqual({
      locationId: -1,
      plannedUseOfForce: true,
      involvedStaff: [{ username: 'ITAG_USER' }],
      witnesses: [{ name: 'User bob' }],
    })
  })

  it('Should return error massages if no input field is completed', () => {
    const input = {}
    const { errors, formResponse, extractedFields } = check(input)

    expect(errors).toEqual([
      {
        href: '#incidentDate[date][day]',
        text: '"incidentDate.date.day" must be a number',
      },
      {
        href: '#incidentDate[date][month]',
        text: '"incidentDate.date.month" must be a number',
      },
      {
        href: '#incidentDate[date][year]',
        text: '"incidentDate.date.year" must be a number',
      },
      {
        href: '#incidentDate[time]',
        text: '"incidentDate.time" is required',
      },
      {
        href: '#locationId',
        text: 'Select the location of the incident',
      },
      {
        href: '#plannedUseOfForce',
        text: 'Select yes if the use of force was planned',
      },
    ])

    expect(formResponse).toEqual({})
    expect(extractedFields).toEqual({
      incidentDate: {
        date: {
          day: null,
          month: null,
          year: null,
        },

        raw: {
          day: undefined,
          month: undefined,
          time: undefined,
          year: undefined,
        },
        time: undefined,
        value: null,
        isFutureDate: false,
        isFutureDateTime: false,
        isInvalidDate: false,
      },
    })
  })
})

describe('Incident date', () => {
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
      involvedStaff: [{ username: 'ITAG_USER' }],
      witnesses: [{ name: 'User bob' }],
    })
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
      involvedStaff: [{ username: 'ITAG_USER' }],
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
      involvedStaff: [{ username: 'ITAG_USER' }],
      witnesses: [{ name: 'User bob' }],
    })
  })
})

describe('Involved staff', () => {
  it('None present', () => {
    const input = { ...validInput, involvedStaff: [] }
    const { errors, formResponse } = check(input)

    expect(errors).toEqual([])

    expect(formResponse).toEqual({
      locationId: -1,
      plannedUseOfForce: true,
      witnesses: [{ name: 'User bob' }],
    })
  })

  it('Invalid keys are stripped out', () => {
    const input = { ...validInput, involvedStaff: [{ username: 'ITAG_USER', age: 21 }] }
    const { errors, formResponse } = check(input)

    expect(errors).toEqual([])

    expect(formResponse).toEqual({
      locationId: -1,
      plannedUseOfForce: true,
      involvedStaff: [{ username: 'ITAG_USER' }],
      witnesses: [{ name: 'User bob' }],
    })
  })

  it('Usernames are trimmed and uppercased', () => {
    const input = { ...validInput, involvedStaff: [{ username: '  bob    ' }] }
    const { errors, formResponse } = check(input)

    expect(errors).toEqual([])

    expect(formResponse).toEqual({
      locationId: -1,
      plannedUseOfForce: true,
      involvedStaff: [{ username: 'BOB' }],
      witnesses: [{ name: 'User bob' }],
    })
  })

  it('Username throws error when format incorrect', () => {
    const input = { ...validInput, involvedStaff: [{ username: 'User bob' }] }
    const { errors } = check(input)
    expect(errors).toEqual([
      {
        href: '#involvedStaff[0][username]',
        text: 'Usernames can only contain letters and an underscore',
      },
    ])
  })
})

describe('Witnesses', () => {
  it('Witnesses throws error when format incorrect', () => {
    const input = { ...validInput, witnesses: [{ name: 'User bob 9' }] }
    const { errors } = check(input)
    expect(errors).toEqual([
      {
        href: '#witnesses[0][name]',
        text: 'Witness names can only contain letters, spaces, hyphens, apostrophe',
      },
    ])
  })

  it('None present', () => {
    const input = { ...validInput, witnesses: [] }
    const { errors, formResponse } = check(input)

    expect(errors).toEqual([])

    expect(formResponse).toEqual({
      locationId: -1,
      plannedUseOfForce: true,
      involvedStaff: [{ username: 'ITAG_USER' }],
    })
  })

  it('Invalid keys are stripped out', () => {
    const input = { ...validInput, witnesses: [{ name: 'bob', age: 21 }] }
    const { errors, formResponse } = check(input)

    expect(errors).toEqual([])

    expect(formResponse).toEqual({
      locationId: -1,
      plannedUseOfForce: true,
      witnesses: [{ name: 'bob' }],
      involvedStaff: [{ username: 'ITAG_USER' }],
    })
  })

  it('names are trimmed', () => {
    const input = { ...validInput, witnesses: [{ name: '  bob    ' }] }
    const { errors, formResponse } = check(input)

    expect(errors).toEqual([])

    expect(formResponse).toEqual({
      locationId: -1,
      plannedUseOfForce: true,
      witnesses: [{ name: 'bob' }],
      involvedStaff: [{ username: 'ITAG_USER' }],
    })
  })
})
