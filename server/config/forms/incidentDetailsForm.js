const { joi, validations } = require('./validations')
const { EXTRACTED } = require('../fieldType')
const { validate, isValid } = require('../../utils/fieldValidation')
const { toDate, toInteger, toBoolean, removeEmptyValues, hasAtLeastOneOf, withoutKeysNotIn } = require('./sanitisers')

const sanitiseUsernames = (inputs = []) =>
  inputs
    .filter(hasAtLeastOneOf(['username']))
    .map(withoutKeysNotIn(['username']))
    .map(({ username }) => ({ username: username.toUpperCase() }))

module.exports = {
  fields: [
    {
      incidentDate: {
        sanitiser: toDate,
        fieldType: EXTRACTED,
        validationMessage: {
          'incidentDate.date.day.number.base': 'Enter the date',
          'incidentDate.date.month.number.base': 'Enter the month',
          'incidentDate.date.year.number.base': 'Enter the year',
          'incidentDate.time.any.required': 'Enter the time of the incident',
          'incidentDate.time.string.empty': 'Enter the time of the incident',
          'incidentDate.time.string.pattern.base': 'Enter a time in the correct format - for example, 23:59',
          'incidentDate.isInvalidDate.any.invalid': 'Enter a date in the correct format - for example, 27 3 2007',
          'incidentDate.isFutureDateTime.any.invalid': 'Enter a time which is not in the future',
          'incidentDate.isFutureDate.any.invalid': 'Enter a date that is not in the future',
        },
      },
    },
    {
      locationId: {
        validationMessage: 'Select the location of the incident',
        sanitiser: toInteger,
      },
    },
    {
      plannedUseOfForce: {
        validationMessage: 'Select yes if the use of force was planned',
        sanitiser: toBoolean,
      },
    },
    {
      involvedStaff: {
        validationMessage: { 'string.pattern.name': 'Usernames can only contain letters and an underscore' },
        sanitiser: sanitiseUsernames,
        firstFieldName: 'involvedStaff[0][username]',
      },
    },
    {
      witnesses: {
        validationMessage: {
          'string.pattern.name': 'Witness names can only contain letters, spaces, hyphens, apostrophe',
        },
        sanitiser: removeEmptyValues(['name']),
      },
    },
  ],
  schemas: {
    complete: joi.object({
      incidentDate: validations.requiredIncidentDate,
      locationId: validations.requiredNumber,
      plannedUseOfForce: validations.requiredBoolean,
      involvedStaff: validations.optionalInvolvedStaff,
      witnesses: validations.optionalWitnesses,
    }),
  },
  isComplete(values) {
    return (
      // It's possible to store invalid usernames which haven't been validated against the auth server.
      // The separate check ensures that all involvedStaff have the correct extra fields that are stored against them once validated.
      isValid(this.schemas.complete, values, true) &&
      isValid(validations.optionalInvolvedStaffWhenPersisted, values.involvedStaff)
    )
  },
  nextPath: {
    path: bookingId => `/report/${bookingId}/use-of-force-details`,
  },
}
