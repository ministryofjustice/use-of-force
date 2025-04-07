import  moment from 'moment'
import incidentDetailsForm from './incidentDetailsForm'
import validation from '../../services/validation'

const { complete, partial } = incidentDetailsForm 
const { processInput } = validation

const buildCheck = schema => input => {
  const {
    payloadFields: formResponse,
    errors,
    extractedFields,
  } = processInput({
    validationSpec: schema,
    input,
  })
  return { formResponse, errors, extractedFields }
}

let validInput = {}
const incidentLocationId = '00000000-1111-2222-3333-444444444444'
beforeEach(() => {
  validInput = {
    incidentDate: { date: '15/01/2019', time: { hour: '12', minute: '45' } },
    incidentLocationId,
    plannedUseOfForce: 'false',
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
        incidentLocationId,
        plannedUseOfForce: false,
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
          href: '#incidentLocationId',
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
    it('is missing', () => {
      const input = { ...validInput, incidentLocationId: undefined }
      const { errors, formResponse } = check(input)

      expect(errors).toEqual([
        {
          href: '#incidentLocationId',
          text: 'Select the location of the incident',
        },
      ])

      expect(formResponse).toEqual({
        plannedUseOfForce: false,
        witnesses: [{ name: 'User bob' }],
      })
    })
  })

  describe('Planned use of force', () => {
    it('Not planned strips authorisedBy field', () => {
      const input = { ...validInput, plannedUseOfForce: 'false', authorisedBy: 'Eric Bloodaxe' }
      const { errors, formResponse } = check(input)

      expect(errors).toEqual([])

      expect(formResponse).toEqual({
        plannedUseOfForce: false,
        incidentLocationId,
        witnesses: [{ name: 'User bob' }],
      })
    })

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
        incidentLocationId,
        witnesses: [{ name: 'User bob' }],
      })
    })

    it('No authorisedBy field', () => {
      const input = { ...validInput, plannedUseOfForce: 'true' }
      const { errors, formResponse } = check(input)

      expect(errors).toEqual([
        {
          href: '#authorisedBy',
          text: 'Enter the name of the person who authorised the use of force',
        },
      ])

      expect(formResponse).toEqual({
        incidentLocationId,
        plannedUseOfForce: true,
        witnesses: [{ name: 'User bob' }],
      })
    })

    it('Valid authorisedBy field', () => {
      const input = { ...validInput, plannedUseOfForce: 'true', authorisedBy: 'Eric Bloodaxe' }
      const { errors, formResponse } = check(input)

      expect(errors).toEqual([])

      expect(formResponse).toEqual({
        incidentLocationId,
        authorisedBy: 'Eric Bloodaxe',
        plannedUseOfForce: true,
        witnesses: [{ name: 'User bob' }],
      })
    })

    it('Illegal characters in authorisedBy field', () => {
      const input = { ...validInput, plannedUseOfForce: 'true', authorisedBy: '0' }
      const { errors, formResponse } = check(input)

      expect(errors).toEqual([
        {
          href: '#authorisedBy',
          text: 'Names may only contain letters, spaces, full stops, hyphens and apostrophes',
        },
      ])

      expect(formResponse).toEqual({
        incidentLocationId,
        authorisedBy: '0',
        plannedUseOfForce: true,
        witnesses: [{ name: 'User bob' }],
      })
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
        incidentLocationId,
        plannedUseOfForce: false,
      })
    })

    it('Invalid keys are stripped out', () => {
      const input = { ...validInput, witnesses: [{ name: 'bob', age: 21 }] }
      const { errors, formResponse } = check(input)

      expect(errors).toEqual([])

      expect(formResponse).toEqual({
        incidentLocationId,
        plannedUseOfForce: false,
        witnesses: [{ name: 'bob' }],
      })
    })

    it('names are trimmed', () => {
      const input = { ...validInput, witnesses: [{ name: '  bob    ' }] }
      const { errors, formResponse } = check(input)

      expect(errors).toEqual([])

      expect(formResponse).toEqual({
        incidentLocationId,
        plannedUseOfForce: false,
        witnesses: [{ name: 'bob' }],
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
        incidentLocationId,
        plannedUseOfForce: false,
        witnesses: [{ name: 'bob' }, { name: 'Bob' }],
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
        const { errors, extractedFields } = check(input)

        expect(errors).toEqual([
          {
            href: '#incidentDate[date]',
            text: 'Enter a date in the correct format, for example, 23/07/2020',
          },
        ])

        expect(extractedFields.incidentDate).toEqual({
          date: '',
          value: null,
          time: { hour: '12', minute: '45' },
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
        const { errors, extractedFields } = check(input)

        expect(errors).toEqual([
          {
            href: '#incidentDate[date]',
            text: 'Enter a date in the correct format, for example, 23/07/2020',
          },
        ])

        expect(extractedFields.incidentDate).toEqual({
          date: 'AA/12/2020',
          value: null,
          time: { hour: '12', minute: '45' },
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
        const { errors, extractedFields } = check(input)

        expect(errors).toEqual([
          {
            href: '#incidentDate[date]',
            text: 'Enter a date that is not in the future',
          },
        ])

        expect(extractedFields.incidentDate).toEqual({
          date: tomorrow.format('DD/MM/YYYY'),
          value: moment(tomorrow).set({ hours: 12, minutes: 45 }).toDate(),
          time: { hour: '12', minute: '45' },
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
        const { errors, extractedFields } = check(input)

        expect(errors).toEqual([
          {
            href: '#incidentDate[time][hour]',
            text: 'Enter missing hours',
          },
        ])

        expect(extractedFields.incidentDate).toEqual({
          date: '15/01/2019',
          value: null,
          time: { hour: '', minute: '45' },
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
        const { errors, extractedFields } = check(input)

        expect(errors).toEqual([
          {
            href: '#incidentDate[time][hour]',
            text: 'Enter hours using numbers only',
          },
        ])

        expect(extractedFields.incidentDate).toEqual({
          date: '15/01/2019',
          value: null,
          time: { hour: 'aa', minute: '45' },
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
        const { errors, extractedFields } = check(input)

        expect(errors).toEqual([
          {
            href: '#incidentDate[time][hour]',
            text: 'Enter hours using numbers only',
          },
        ])

        expect(extractedFields.incidentDate).toEqual({
          date: '15/01/2019',
          value: null,
          time: { hour: '1a', minute: '45' },
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
        const { errors, extractedFields } = check(input)

        expect(errors).toEqual([
          {
            href: '#incidentDate[time][hour]',
            text: 'Enter an hour which is 23 or less',
          },
        ])

        expect(extractedFields.incidentDate).toEqual({
          date: '15/01/2019',
          value: null,
          time: { hour: '24', minute: '45' },
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
        const { errors, extractedFields } = check(input)

        expect(errors).toEqual([
          {
            href: '#incidentDate[time][hour]',
            text: 'Enter the hours using 2 digits',
          },
        ])

        expect(extractedFields.incidentDate).toEqual({
          date: '15/01/2019',
          value: moment('2019-01-15T01:45:00.000Z').toDate(),
          time: { hour: '1', minute: '45' },
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
        const { errors, extractedFields } = check(input)

        expect(errors).toEqual([
          {
            href: '#incidentDate[time][hour]',
            text: 'Enter an hour which is 00 or more',
          },
        ])

        expect(extractedFields.incidentDate).toEqual({
          date: '15/01/2019',
          value: null,
          time: { hour: '-11', minute: '45' },
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
          const { errors, extractedFields } = check(input)

          expect(errors).toEqual([
            {
              href: '#incidentDate[time][minute]',
              text: 'Enter missing minutes',
            },
          ])

          expect(extractedFields.incidentDate).toEqual({
            date: '15/01/2019',
            value: null,
            time: { hour: '12', minute: '' },
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
          const { errors, extractedFields } = check(input)

          expect(errors).toEqual([
            {
              href: '#incidentDate[time][minute]',
              text: 'Enter minutes using numbers only',
            },
          ])

          expect(extractedFields.incidentDate).toEqual({
            date: '15/01/2019',
            value: null,
            time: { hour: '12', minute: 'aa' },
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
          const { errors, extractedFields } = check(input)

          expect(errors).toEqual([
            {
              href: '#incidentDate[time][minute]',
              text: 'Enter minutes using numbers only',
            },
          ])

          expect(extractedFields.incidentDate).toEqual({
            date: '15/01/2019',
            value: null,
            time: { hour: '03', minute: '4y' },
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
          const { errors, extractedFields } = check(input)

          expect(errors).toEqual([
            {
              href: '#incidentDate[time][minute]',
              text: 'Enter the minutes using 59 or less',
            },
          ])

          expect(extractedFields.incidentDate).toEqual({
            date: '15/01/2019',
            value: null,
            time: { hour: '12', minute: '60' },
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
          const { errors, extractedFields } = check(input)

          expect(errors).toEqual([
            {
              href: '#incidentDate[time][minute]',
              text: 'Enter the minutes using 2 digits',
            },
          ])

          expect(extractedFields.incidentDate).toEqual({
            date: '15/01/2019',
            value: moment('2019-01-15T12:04:00.000Z').toDate(),
            time: { hour: '12', minute: '4' },
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
          const { errors, extractedFields } = check(input)

          expect(errors).toEqual([
            {
              href: '#incidentDate[time][minute]',
              text: 'Enter the minutes using 00 or more',
            },
          ])

          expect(extractedFields.incidentDate).toEqual({
            date: '15/01/2019',
            value: null,
            time: { hour: '12', minute: '-04' },
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
          const { errors, extractedFields } = check(input)

          expect(errors).toEqual([
            {
              href: '#incidentDate[time]',
              text: 'Enter a time which is not in the future',
            },
          ])

          expect(extractedFields.incidentDate).toEqual({
            date: laterToday.format('DD/MM/YYYY'),
            value: laterToday.toDate(),
            time: { hour: laterToday.format('HH'), minute: laterToday.format('mm') },
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
          const { errors, extractedFields } = check(input)

          expect(errors).toEqual([
            {
              href: '#incidentDate[time]',
              text: 'Enter a time which is not in the future',
            },
          ])

          expect(extractedFields.incidentDate).toEqual({
            date: endOfToday.format('DD/MM/YYYY'),
            value: endOfToday.toDate(),
            time: { hour: endOfToday.format('HH'), minute: endOfToday.format('mm') },
          })
        })
      })
    })
  })
})

describe("'partial' validation", () => {
  const check = buildCheck(partial)
  describe('Incident details page - overall', () => {
    it('Does not check requiredness during partial validation', () => {
      const { errors, formResponse, extractedFields } = check({ ...validInput, plannedUseOfForce: 'true' })

      expect(errors).toEqual([])

      expect(extractedFields).toEqual({
        incidentDate: {
          date: '15/01/2019',
          time: { hour: '12', minute: '45' },
          value: moment('2019-01-15T12:45:00.000Z').toDate(),
        },
      })
      expect(formResponse).toEqual({
        incidentLocationId,
        plannedUseOfForce: true,
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
        witnesses: [],
      }

      const { errors, formResponse } = check(input)

      expect(errors).toEqual([])
      expect(formResponse).toEqual({})
    })

    it('arrays with rubbish in them are not errors', () => {
      const input = {
        witnesses: [{}, { bob: false }, 1, 'abc'],
      }

      const { errors, formResponse } = check(input)

      expect(errors).toEqual([])
      expect(formResponse).toEqual({})
    })
  })
})
