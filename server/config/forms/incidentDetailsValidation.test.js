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
    incidentDate: { date: '15/01/2019', time: { hour: '12', minute: '45' } },
    locationId: -1,
    plannedUseOfForce: 'true',
    involvedStaff: [{ username: 'itag_user' }, { username: '' }],
    witnesses: [{ name: 'User bob' }, { name: '' }],
  }
})

describe("'complete' validation", () => {
  const check = buildCheck(complete)
  describe('Incident details page - overall', () => {
    it('correct input produces no validation errors', () => {
      const { errors, formResponse, extractedFields } = check(validInput)

      expect(errors).toEqual([])

      expect(extractedFields).toEqual({
        incidentDate: {
          date: '15/01/2019',
          time: { hour: '12', minute: '45' },
          value: moment('2019-01-15T12:45:00.000Z').toDate(),
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
      const input = { incidentDate: { date: '', time: { hour: '', minute: '' } } }
      const { errors, formResponse, extractedFields } = check(input)

      expect(errors).toEqual([
        {
          href: '#incidentDate[date]',
          text: 'Enter a date in the correct format, for example, 23/07/2020',
        },
        {
          href: '#incidentDate[time][hour]',
          text: 'Enter missing hours',
        },
        {
          href: '#incidentDate[time][minute]',
          text: 'Enter missing minutes',
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
          date: '',
          time: {
            hour: '',
            minute: '',
          },
          value: null,
        },
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
    describe('date', () => {
      it('empty date', () => {
        const input = {
          ...validInput,
          incidentDate: {
            date: undefined,
            time: { hour: '12', minute: '45' },
          },
        }
        const { errors, formResponse, extractedFields } = check(input)

        expect(errors).toEqual([
          {
            href: '#incidentDate[date]',
            text: 'Enter a date in the correct format, for example, 23/07/2020',
          },
        ])

        expect(extractedFields).toEqual({
          incidentDate: {
            date: '',
            value: null,
            time: { hour: '12', minute: '45' },
          },
        })
        expect(formResponse).toEqual({
          locationId: -1,
          plannedUseOfForce: true,
          involvedStaff: [{ username: 'ITAG_USER' }],
          witnesses: [{ name: 'User bob' }],
        })
      })

      it('Invalid date', () => {
        const input = {
          ...validInput,
          incidentDate: {
            date: 'AA/12/2020',
            time: { hour: '12', minute: '45' },
          },
        }
        const { errors, formResponse, extractedFields } = check(input)

        expect(errors).toEqual([
          {
            href: '#incidentDate[date]',
            text: 'Enter a date in the correct format, for example, 23/07/2020',
          },
        ])

        expect(extractedFields).toEqual({
          incidentDate: {
            date: 'AA/12/2020',
            value: null,
            time: { hour: '12', minute: '45' },
          },
        })
        expect(formResponse).toEqual({
          locationId: -1,
          plannedUseOfForce: true,
          involvedStaff: [{ username: 'ITAG_USER' }],
          witnesses: [{ name: 'User bob' }],
        })
      })

      it('Date in the future', () => {
        const tomorrow = moment().add(1, 'day').seconds(0).milliseconds(0)
        const input = {
          ...validInput,
          incidentDate: {
            date: tomorrow.format('DD/MM/YYYY'),
            time: { hour: '12', minute: '45' },
          },
        }
        const { errors, formResponse, extractedFields } = check(input)

        expect(errors).toEqual([
          {
            href: '#incidentDate[date]',
            text: 'Enter a date that is not in the future',
          },
        ])

        expect(extractedFields).toEqual({
          incidentDate: {
            date: tomorrow.format('DD/MM/YYYY'),
            value: moment(tomorrow).set({ hours: 12, minutes: 45 }).toDate(),
            time: { hour: '12', minute: '45' },
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

    describe('hours', () => {
      it('missing hours', () => {
        const input = {
          ...validInput,
          incidentDate: {
            date: '15/01/2019',
            time: { hour: '', minute: '45' },
          },
        }
        const { errors, formResponse, extractedFields } = check(input)

        expect(errors).toEqual([
          {
            href: '#incidentDate[time][hour]',
            text: 'Enter missing hours',
          },
        ])

        expect(extractedFields).toEqual({
          incidentDate: {
            date: '15/01/2019',
            value: null,
            time: { hour: '', minute: '45' },
          },
        })
        expect(formResponse).toEqual({
          locationId: -1,
          plannedUseOfForce: true,
          involvedStaff: [{ username: 'ITAG_USER' }],
          witnesses: [{ name: 'User bob' }],
        })
      })

      it('hours is not number', () => {
        const input = {
          ...validInput,
          incidentDate: {
            date: '15/01/2019',
            time: { hour: 'aa', minute: '45' },
          },
        }
        const { errors, formResponse, extractedFields } = check(input)

        expect(errors).toEqual([
          {
            href: '#incidentDate[time][hour]',
            text: 'Enter hours using numbers only',
          },
        ])

        expect(extractedFields).toEqual({
          incidentDate: {
            date: '15/01/2019',
            value: null,
            time: { hour: 'aa', minute: '45' },
          },
        })
        expect(formResponse).toEqual({
          locationId: -1,
          plannedUseOfForce: true,
          involvedStaff: [{ username: 'ITAG_USER' }],
          witnesses: [{ name: 'User bob' }],
        })
      })

      it('hour contains number and non-number', () => {
        const input = {
          ...validInput,
          incidentDate: {
            date: '15/01/2019',
            time: { hour: '1a', minute: '45' },
          },
        }
        const { errors, formResponse, extractedFields } = check(input)

        expect(errors).toEqual([
          {
            href: '#incidentDate[time][hour]',
            text: 'Enter hours using numbers only',
          },
        ])

        expect(extractedFields).toEqual({
          incidentDate: {
            date: '15/01/2019',
            value: null,
            time: { hour: '1a', minute: '45' },
          },
        })
        expect(formResponse).toEqual({
          locationId: -1,
          plannedUseOfForce: true,
          involvedStaff: [{ username: 'ITAG_USER' }],
          witnesses: [{ name: 'User bob' }],
        })
      })

      it('hours is too large', () => {
        const input = {
          ...validInput,
          incidentDate: {
            date: '15/01/2019',
            time: { hour: '24', minute: '45' },
          },
        }
        const { errors, formResponse, extractedFields } = check(input)

        expect(errors).toEqual([
          {
            href: '#incidentDate[time][hour]',
            text: 'Enter an hour which is 23 or less',
          },
        ])

        expect(extractedFields).toEqual({
          incidentDate: {
            date: '15/01/2019',
            value: null,
            time: { hour: '24', minute: '45' },
          },
        })
        expect(formResponse).toEqual({
          locationId: -1,
          plannedUseOfForce: true,
          involvedStaff: [{ username: 'ITAG_USER' }],
          witnesses: [{ name: 'User bob' }],
        })
      })

      it('hours not 2 digits', () => {
        const input = {
          ...validInput,
          incidentDate: {
            date: '15/01/2019',
            time: { hour: '1', minute: '45' },
          },
        }
        const { errors, formResponse, extractedFields } = check(input)

        expect(errors).toEqual([
          {
            href: '#incidentDate[time][hour]',
            text: 'Enter the hours using 2 digits',
          },
        ])

        expect(extractedFields).toEqual({
          incidentDate: {
            date: '15/01/2019',
            value: moment('2019-01-15T01:45:00.000Z').toDate(),
            time: { hour: '1', minute: '45' },
          },
        })
        expect(formResponse).toEqual({
          locationId: -1,
          plannedUseOfForce: true,
          involvedStaff: [{ username: 'ITAG_USER' }],
          witnesses: [{ name: 'User bob' }],
        })
      })
      it('hours are a negative number', () => {
        const input = {
          ...validInput,
          incidentDate: {
            date: '15/01/2019',
            time: { hour: '-11', minute: '45' },
          },
        }
        const { errors, formResponse, extractedFields } = check(input)

        expect(errors).toEqual([
          {
            href: '#incidentDate[time][hour]',
            text: 'Enter an hour which is 00 or more',
          },
        ])

        expect(extractedFields).toEqual({
          incidentDate: {
            date: '15/01/2019',
            value: null,
            time: { hour: '-11', minute: '45' },
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

    describe('minutes', () => {
      it('missing minutes', () => {
        const input = {
          ...validInput,
          incidentDate: {
            date: '15/01/2019',
            time: { hour: '12', minute: '' },
          },
        }
        const { errors, formResponse, extractedFields } = check(input)

        expect(errors).toEqual([
          {
            href: '#incidentDate[time][minute]',
            text: 'Enter missing minutes',
          },
        ])

        expect(extractedFields).toEqual({
          incidentDate: {
            date: '15/01/2019',
            value: null,
            time: { hour: '12', minute: '' },
          },
        })
        expect(formResponse).toEqual({
          locationId: -1,
          plannedUseOfForce: true,
          involvedStaff: [{ username: 'ITAG_USER' }],
          witnesses: [{ name: 'User bob' }],
        })
      })

      it('minutes is not number', () => {
        const input = {
          ...validInput,
          incidentDate: {
            date: '15/01/2019',
            time: { hour: '12', minute: 'aa' },
          },
        }
        const { errors, formResponse, extractedFields } = check(input)

        expect(errors).toEqual([
          {
            href: '#incidentDate[time][minute]',
            text: 'Enter minutes using numbers only',
          },
        ])

        expect(extractedFields).toEqual({
          incidentDate: {
            date: '15/01/2019',
            value: null,
            time: { hour: '12', minute: 'aa' },
          },
        })
        expect(formResponse).toEqual({
          locationId: -1,
          plannedUseOfForce: true,
          involvedStaff: [{ username: 'ITAG_USER' }],
          witnesses: [{ name: 'User bob' }],
        })
      })

      it('minutes contains number and non-number', () => {
        const input = {
          ...validInput,
          incidentDate: {
            date: '15/01/2019',
            time: { hour: '03', minute: '4y' },
          },
        }
        const { errors, formResponse, extractedFields } = check(input)

        expect(errors).toEqual([
          {
            href: '#incidentDate[time][minute]',
            text: 'Enter minutes using numbers only',
          },
        ])

        expect(extractedFields).toEqual({
          incidentDate: {
            date: '15/01/2019',
            value: null,
            time: { hour: '03', minute: '4y' },
          },
        })
        expect(formResponse).toEqual({
          locationId: -1,
          plannedUseOfForce: true,
          involvedStaff: [{ username: 'ITAG_USER' }],
          witnesses: [{ name: 'User bob' }],
        })
      })

      it('minutes is too large', () => {
        const input = {
          ...validInput,
          incidentDate: {
            date: '15/01/2019',
            time: { hour: '12', minute: '60' },
          },
        }
        const { errors, formResponse, extractedFields } = check(input)

        expect(errors).toEqual([
          {
            href: '#incidentDate[time][minute]',
            text: 'Enter the minutes using 59 or less',
          },
        ])

        expect(extractedFields).toEqual({
          incidentDate: {
            date: '15/01/2019',
            value: null,
            time: { hour: '12', minute: '60' },
          },
        })
        expect(formResponse).toEqual({
          locationId: -1,
          plannedUseOfForce: true,
          involvedStaff: [{ username: 'ITAG_USER' }],
          witnesses: [{ name: 'User bob' }],
        })
      })

      it('minutes not 2 digits', () => {
        const input = {
          ...validInput,
          incidentDate: {
            date: '15/01/2019',
            time: { hour: '12', minute: '4' },
          },
        }
        const { errors, formResponse, extractedFields } = check(input)

        expect(errors).toEqual([
          {
            href: '#incidentDate[time][minute]',
            text: 'Enter the minutes using 2 digits',
          },
        ])

        expect(extractedFields).toEqual({
          incidentDate: {
            date: '15/01/2019',
            value: moment('2019-01-15T12:04:00.000Z').toDate(),
            time: { hour: '12', minute: '4' },
          },
        })
        expect(formResponse).toEqual({
          locationId: -1,
          plannedUseOfForce: true,
          involvedStaff: [{ username: 'ITAG_USER' }],
          witnesses: [{ name: 'User bob' }],
        })
      })

      it('minutes are a negative number', () => {
        const input = {
          ...validInput,
          incidentDate: {
            date: '15/01/2019',
            time: { hour: '12', minute: '-04' },
          },
        }
        const { errors, formResponse, extractedFields } = check(input)

        expect(errors).toEqual([
          {
            href: '#incidentDate[time][minute]',
            text: 'Enter the minutes using 00 or more',
          },
        ])

        expect(extractedFields).toEqual({
          incidentDate: {
            date: '15/01/2019',
            value: null,
            time: { hour: '12', minute: '-04' },
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

    describe('time', () => {
      it('time is not in the future', () => {
        const laterToday = moment().add(1, 'hour').seconds(0).milliseconds(0)

        const input = {
          ...validInput,
          incidentDate: {
            date: laterToday.format('DD/MM/YYYY'),
            time: { hour: laterToday.format('HH'), minute: laterToday.format('mm') },
          },
        }
        const { errors, formResponse, extractedFields } = check(input)

        expect(errors).toEqual([
          {
            href: '#incidentDate[time]',
            text: 'Enter a time which is not in the future',
          },
        ])

        expect(extractedFields).toEqual({
          incidentDate: {
            date: laterToday.format('DD/MM/YYYY'),
            value: laterToday.toDate(),
            time: { hour: laterToday.format('HH'), minute: laterToday.format('mm') },
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

    it('time is last minute of current day', () => {
      const endOfToday = moment({ hour: 23, minute: 59, seconds: 0, milliseconds: 0 })

      const input = {
        ...validInput,
        incidentDate: {
          date: endOfToday.format('DD/MM/YYYY'),
          time: { hour: endOfToday.format('HH'), minute: endOfToday.format('mm') },
        },
      }
      const { errors, formResponse, extractedFields } = check(input)

      expect(errors).toEqual([
        {
          href: '#incidentDate[time]',
          text: 'Enter a time which is not in the future',
        },
      ])

      expect(extractedFields).toEqual({
        incidentDate: {
          date: endOfToday.format('DD/MM/YYYY'),
          value: endOfToday.toDate(),
          time: { hour: endOfToday.format('HH'), minute: endOfToday.format('mm') },
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
    it('Does not check requiredness during partial validation', () => {
      const { errors, formResponse, extractedFields } = check(validInput)

      expect(errors).toEqual([])

      expect(extractedFields).toEqual({
        incidentDate: {
          date: '15/01/2019',
          time: { hour: '12', minute: '45' },
          value: moment('2019-01-15T12:45:00.000Z').toDate(),
        },
      })
      expect(formResponse).toEqual({
        locationId: -1,
        plannedUseOfForce: true,
        involvedStaff: [{ username: 'ITAG_USER' }],
        witnesses: [{ name: 'User bob' }],
      })
    })

    it('Validation occurs for incident date when an input field is completed', () => {
      const input = { incidentDate: { date: '', time: { hour: '', minute: 'aa' } } }
      const { errors, formResponse, extractedFields } = check(input)

      expect(errors).toEqual([
        {
          href: '#incidentDate[date]',
          text: 'Enter a date in the correct format, for example, 23/07/2020',
        },
        {
          href: '#incidentDate[time][hour]',
          text: 'Enter missing hours',
        },
        {
          href: '#incidentDate[time][minute]',
          text: 'Enter minutes using numbers only',
        },
      ])

      expect(formResponse).toEqual({})
      expect(extractedFields).toEqual({
        incidentDate: {
          date: '',
          time: { hour: '', minute: 'aa' },
          value: null,
        },
      })
    })

    it('Validation does not occurs for incident date when no input field is complete', () => {
      const input = {}
      const { errors, formResponse, extractedFields } = check(input)

      expect(errors).toEqual([])

      expect(formResponse).toEqual({})
      expect(extractedFields).toEqual({})
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
        date: '15/01/2019',
        time: { hour: '12', minute: '45' },
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
