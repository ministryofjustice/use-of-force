const moment = require('moment')
const {
  complete,
  partial,
  persistent,
  optionalInvolvedStaff,
  optionalInvolvedStaffWhenPersisted,
} = require('./incidentDetailsForm')
const { processInput } = require('../../services/validation')
const { isValid } = require('../../services/validation/fieldValidation')

const buildCheck = schema => input => {
  const { payloadFields: formResponse, errors, extractedFields } = processInput({
    validationSpec: schema,
    input,
  })
  return { formResponse, errors, extractedFields }
}

let validInput = {}

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

describe("'complete' validation", () => {
  const check = buildCheck(complete)
  describe('Incident details page - overall', () => {
    it('Should return no validation error messages if every primary input field completed correctly', () => {
      const { errors, formResponse, extractedFields } = check(validInput)

      expect(errors).toEqual([])

      expect(extractedFields).toEqual({
        incidentDate: {
          date: {
            day: 15,
            month: 1,
            year: 2019,
          },
          raw: {
            day: 15,
            month: 1,
            time: '12:45',
            year: 2019,
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
      const input = { incidentDate: {} }
      const { errors, formResponse, extractedFields } = check(input)

      expect(errors).toEqual([
        {
          href: '#incidentDate[date][day]',
          text: 'Enter the date',
        },
        {
          href: '#incidentDate[date][month]',
          text: 'Enter the month',
        },
        {
          href: '#incidentDate[date][year]',
          text: 'Enter the year',
        },
        {
          href: '#incidentDate[time]',
          text: 'Enter the time of the incident',
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
            day: null,
            month: null,
            time: null,
            year: null,
          },
          time: null,
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

    it('Username throws errors when duplicates are found', () => {
      const input = { ...validInput, involvedStaff: [{ username: 'Bob' }, { username: 'Bob' }] }
      const { errors } = check(input)
      expect(errors).toEqual([
        {
          href: '#involvedStaff[1]',
          text: "Username 'BOB' has already been added - remove this user",
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
          text: 'Witness names can only contain letters, spaces, full stops, hyphens, apostrophe',
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

    it('Duplicate names are rejected', () => {
      const input = { ...validInput, witnesses: [{ name: ' bob' }, { name: 'Bob ' }] }
      const { errors, formResponse } = check(input)

      expect(errors).toEqual([
        {
          href: '#witnesses[1]',
          text: "Witness 'Bob' has already been added - remove this witness",
        },
      ])

      expect(formResponse).toEqual({
        locationId: -1,
        plannedUseOfForce: true,
        witnesses: [{ name: 'bob' }, { name: 'Bob' }],
        involvedStaff: [{ username: 'ITAG_USER' }],
      })
    })
  })

  describe('incidentDate', () => {
    it('invalid time format', () => {
      const input = {
        ...validInput,
        incidentDate: {
          date: { day: '15', month: '1', year: '2019' },
          time: '12345',
        },
      }
      const { errors, formResponse, extractedFields } = check(input)

      expect(errors).toEqual([
        {
          href: '#incidentDate[time]',
          text: 'Enter a time in the correct format - for example, 23:59',
        },
      ])

      expect(extractedFields).toEqual({
        incidentDate: {
          date: {
            day: 15,
            month: 1,
            year: 2019,
          },
          raw: {
            day: 15,
            month: 1,
            time: '12345',
            year: 2019,
          },
          value: null,
          time: '12345',
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

    it('invalid date', () => {
      const input = {
        ...validInput,
        incidentDate: {
          date: { day: '29', month: '2', year: '2019' },
          time: '12:45',
        },
      }
      const { errors, formResponse, extractedFields } = check(input)

      expect(errors).toEqual([
        {
          href: '#incidentDate[isInvalidDate]',
          text: 'Enter a date in the correct format - for example, 27 3 2007',
        },
      ])

      expect(extractedFields).toEqual({
        incidentDate: {
          date: {
            day: 29,
            month: 2,
            year: 2019,
          },
          raw: {
            day: 29,
            month: 2,
            time: '12:45',
            year: 2019,
          },
          value: null,
          time: '12:45',
          isFutureDate: false,
          isFutureDateTime: false,
          isInvalidDate: true,
        },
      })
      expect(formResponse).toEqual({
        locationId: -1,
        plannedUseOfForce: true,
        involvedStaff: [{ username: 'ITAG_USER' }],
        witnesses: [{ name: 'User bob' }],
      })
    })

    it('Missing day', () => {
      const input = {
        ...validInput,
        incidentDate: {
          date: { month: '2', year: '2019' },
          time: '12:45',
        },
      }
      const { errors, formResponse, extractedFields } = check(input)

      expect(errors).toEqual([
        {
          href: '#incidentDate[date][day]',
          text: 'Enter the date',
        },
      ])

      expect(extractedFields).toEqual({
        incidentDate: {
          date: {
            day: null,
            month: 2,
            year: 2019,
          },
          raw: {
            day: null,
            month: 2,
            time: '12:45',
            year: 2019,
          },
          value: null,
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

    it('Missing time', () => {
      const input = {
        ...validInput,
        incidentDate: {
          date: { day: '28', month: '2', year: '2019' },
        },
      }
      const { errors, formResponse, extractedFields } = check(input)

      expect(errors).toEqual([
        {
          href: '#incidentDate[time]',
          text: 'Enter the time of the incident',
        },
      ])

      expect(extractedFields).toEqual({
        incidentDate: {
          date: {
            day: 28,
            month: 2,
            year: 2019,
          },
          raw: {
            day: 28,
            month: 2,
            time: null,
            year: 2019,
          },
          value: null,
          time: null,
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

    it('Empty time', () => {
      const input = {
        ...validInput,
        incidentDate: {
          date: { day: '28', month: '2', year: '2019' },
          time: '',
        },
      }
      const { errors, formResponse, extractedFields } = check(input)

      expect(errors).toEqual([
        {
          href: '#incidentDate[time]',
          text: 'Enter the time of the incident',
        },
      ])

      expect(extractedFields).toEqual({
        incidentDate: {
          date: {
            day: 28,
            month: 2,
            year: 2019,
          },
          raw: {
            day: 28,
            month: 2,
            time: null,
            year: 2019,
          },
          value: null,
          time: null,
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

    it('Wrong types', () => {
      const input = {
        ...validInput,
        incidentDate: {
          date: { day: 'aaa', month: 'bbb', year: 'ccc' },
          time: '12:34',
        },
      }
      const { errors, formResponse, extractedFields } = check(input)

      expect(errors).toEqual([
        {
          href: '#incidentDate[date][day]',
          text: 'Enter the date',
        },
        {
          href: '#incidentDate[date][month]',
          text: 'Enter the month',
        },
        {
          href: '#incidentDate[date][year]',
          text: 'Enter the year',
        },
      ])

      expect(extractedFields).toEqual({
        incidentDate: {
          date: {
            day: null,
            month: null,
            year: null,
          },
          raw: {
            day: null,
            month: null,
            time: '12:34',
            year: null,
          },
          value: null,
          time: '12:34',
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

    it('time in the future', () => {
      const now = moment()
      const day = now.format('D')
      const month = now.format('M')
      const year = now.format('YYYY')
      const timeInTheFuture = moment(now)
        .seconds(0)
        .milliseconds(0)
        .add(2, 'minute')
      const time = timeInTheFuture.format('HH:mm')

      const input = {
        ...validInput,
        incidentDate: {
          date: { day, month, year },
          time,
        },
      }
      const { errors, formResponse, extractedFields } = check(input)

      expect(errors).toEqual([
        {
          href: '#incidentDate[isFutureDateTime]',
          text: 'Enter a time which is not in the future',
        },
      ])

      expect(extractedFields).toEqual({
        incidentDate: {
          date: {
            day: now.date(),
            month: now.month() + 1,
            year: now.year(),
          },
          raw: {
            day: now.date(),
            month: now.month() + 1,
            time,
            year: now.year(),
          },
          value: timeInTheFuture.toDate(),
          time,
          isFutureDate: false,
          isFutureDateTime: true,
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

    it('date in the future', () => {
      const now = moment()
      const dateInTheFuture = moment(now)
        .seconds(0)
        .milliseconds(0)
        .add(1, 'day')

      const day = dateInTheFuture.format('D')
      const month = dateInTheFuture.format('M')
      const year = dateInTheFuture.format('YYYY')
      const time = dateInTheFuture.format('HH:mm')

      const input = {
        ...validInput,
        incidentDate: {
          date: { day, month, year },
          time,
        },
      }
      const { errors, formResponse, extractedFields } = check(input)

      expect(errors).toEqual([
        {
          href: '#incidentDate[isFutureDate]',
          text: 'Enter a date that is not in the future',
        },
      ])

      expect(extractedFields).toEqual({
        incidentDate: {
          date: {
            day: dateInTheFuture.date(),
            month: dateInTheFuture.month() + 1,
            year: dateInTheFuture.year(),
          },
          raw: {
            day: dateInTheFuture.date(),
            month: dateInTheFuture.month() + 1,
            time,
            year: dateInTheFuture.year(),
          },
          value: dateInTheFuture.toDate(),
          time,
          isFutureDate: true,
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
  })

  describe('check optional staff role', () => {
    test('Check optional staff', () => {
      expect(isValid(optionalInvolvedStaff, [{ username: 'Bob' }])).toEqual(true)
      expect(isValid(optionalInvolvedStaff, [{ username: 'VQO24O' }])).toEqual(true)
      expect(isValid(optionalInvolvedStaff, [])).toEqual(true)
    })

    test('invalid (optionalInvolvedStaff)', () => {
      expect(isValid(optionalInvolvedStaff, [{ username: 'Bob', age: 29 }])).toEqual(false)
      expect(isValid(optionalInvolvedStaff, true)).toEqual(false)
      expect(isValid(optionalInvolvedStaff, [{ username: '' }])).toEqual(false)
      expect(isValid(optionalInvolvedStaff, [{ bob: 'Bob' }])).toEqual(false)
    })

    test('Check valid (optionalInvolvedStaffWhenPersisted)', () => {
      expect(
        isValid(optionalInvolvedStaffWhenPersisted, [
          { username: 'VQO24O', name: 'Bob', email: 'a@bcom', staffId: 123 },
        ])
      ).toEqual(true)
      expect(isValid(optionalInvolvedStaffWhenPersisted, [])).toEqual(true)
    })

    test('invalid (optionalInvolvedStaffWhenPersisted)', () => {
      expect(isValid(optionalInvolvedStaffWhenPersisted, [{ username: 'Bob', age: 29 }])).toEqual(false)
      expect(isValid(optionalInvolvedStaffWhenPersisted, true)).toEqual(false)
      expect(isValid(optionalInvolvedStaffWhenPersisted, [{ username: '' }])).toEqual(false)
      expect(isValid(optionalInvolvedStaffWhenPersisted, [{ bob: 'Bob' }])).toEqual(false)
    })
  })
})

describe("'partial' validation", () => {
  const check = buildCheck(partial)
  describe('Incident details page - overall', () => {
    it('Should return no validation error messages if every primary input field completed correctly', () => {
      const { errors, formResponse, extractedFields } = check(validInput)

      expect(errors).toEqual([])

      expect(extractedFields).toEqual({
        incidentDate: {
          date: {
            day: 15,
            month: 1,
            year: 2019,
          },
          raw: {
            day: 15,
            month: 1,
            time: '12:45',
            year: 2019,
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

    it('Should only return  error massages for incident date if no input field is completed', () => {
      const input = { incidentDate: {} }
      const { errors, formResponse, extractedFields } = check(input)

      expect(errors).toEqual([
        {
          href: '#incidentDate[date][day]',
          text: 'Enter the date',
        },
        {
          href: '#incidentDate[date][month]',
          text: 'Enter the month',
        },
        {
          href: '#incidentDate[date][year]',
          text: 'Enter the year',
        },
        {
          href: '#incidentDate[time]',
          text: 'Enter the time of the incident',
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
            day: null,
            month: null,
            time: null,
            year: null,
          },
          time: null,
          value: null,
          isFutureDate: false,
          isFutureDateTime: false,
          isInvalidDate: false,
        },
      })
    })

    it('empty arrays are not errors', () => {
      const input = {
        involvedStaff: [],
        witnesses: [],
      }

      const { errors, formResponse } = check(input)

      expect(errors).toEqual([])
      expect(formResponse).toEqual({})
    })

    it('arrays with rubbish in them are not errors', () => {
      const input = {
        involvedStaff: [{}, { bob: false }, 1, 'abc'],
        witnesses: [{}, { bob: false }, 1, 'abc'],
      }

      const { errors, formResponse } = check(input)

      expect(errors).toEqual([])
      expect(formResponse).toEqual({})
    })
  })
})

describe("'persistent' validation", () => {
  const check = buildCheck(persistent)

  beforeEach(() => {
    validInput = {
      incidentDate: {
        date: { day: '15', month: '1', year: '2019' },
        time: '12:45',
      },
      locationId: -1,
      plannedUseOfForce: 'true',
      involvedStaff: [
        {
          name: 'Licence Batchloader',
          missing: 'false',
          staffId: 6,
          username: 'NOMIS_BATCHLOAD',
          verified: 'true',
        },
      ],
      witnesses: [{ name: 'User bob' }, { name: '' }],
    }
  })

  describe('Incident details page - persistent', () => {
    it('Should return no validation error messages if no invalid data', () => {
      const { errors } = check(validInput)

      expect(errors).toEqual([])
    })

    it('unverified users are valid', () => {
      const { errors } = check({
        ...validInput,
        involvedStaff: [
          {
            name: 'Licence Batchloader',
            missing: 'false',
            staffId: 6,
            username: 'NOMIS_BATCHLOAD',
            verified: 'false',
          },
        ],
      })

      expect(errors).toEqual([])
    })

    it('missing users are invalid', () => {
      const { errors } = check({
        ...validInput,
        involvedStaff: [
          {
            name: 'Licence Batchloader',
            missing: 'true',
            staffId: 6,
            username: 'NOMIS_BATCHLOAD',
            verified: 'false',
          },
        ],
      })

      expect(errors).toEqual([
        {
          href: '#involvedStaff[0][missing]',
          text: '"involvedStaff[0].missing" must be [false]',
        },
      ])
    })
  })
})
