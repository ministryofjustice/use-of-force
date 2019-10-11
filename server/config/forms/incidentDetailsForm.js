const { joi, validations, usernamePattern, namePattern, caseInsensitiveComparator } = require('./validations')
const { EXTRACTED } = require('../fieldType')
const { isValid } = require('../../utils/fieldValidation')
const { toDate, toInteger, toBoolean, removeEmptyValues, hasAtLeastOneOf, withoutKeysNotIn } = require('./sanitisers')

/**
 * Ensure that each object in 'inputs' has exactly the field name 'username' and no others.
 * Any object that does not have a 'username' is removed, other fields of an object are removed.
 * @param inputs
 * @returns {{username: *}[]}
 */
const sanitiseUsernames = (inputs = []) =>
  inputs
    .filter(hasAtLeastOneOf(['username']))
    .map(withoutKeysNotIn(['username']))
    .map(({ username }) => ({ username: username.toUpperCase() }))

const {
  requiredNumber,
  requiredIntegerMsg,
  requiredString,
  requiredPatternMsg,
  requiredBoolean,
  requiredBooleanMsg,
  any,
  arrayOfObjects,
} = validations

const requiredIncidentDate = joi.object({
  date: joi.object({
    day: requiredNumber,
    month: requiredNumber,
    year: requiredNumber,
  }),
  time: requiredString.regex(/^(0[0-9]|1[0-9]|2[0-3]|[0-9])[:.][0-5][0-9]$/),
  raw: any,
  value: joi.date().allow(null),
  isInvalidDate: requiredBoolean.invalid(true),
  isFutureDate: requiredBoolean.invalid(true),
  isFutureDateTime: requiredBoolean.invalid(true),
})

const optionalInvolvedStaff = joi
  .array()
  .items({
    username: requiredPatternMsg(usernamePattern)('Usernames can only contain letters and an underscore').uppercase(),
  })
  .ruleset.unique('username')
  .message("Username '{#value.username}' has already been added - remove this user")

const optionalInvolvedStaffWhenPersisted = arrayOfObjects({
  username: requiredString.regex(usernamePattern, 'Username'),
  name: requiredString,
  email: requiredString,
  staffId: requiredNumber,
})
  .ruleset.unique('username')
  .message("Username '{#value.username}' has already been added - remove this user")

module.exports = {
  optionalInvolvedStaff,
  optionalInvolvedStaffWhenPersisted,

  formConfig: {
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
          sanitiser: toInteger,
        },
      },
      {
        plannedUseOfForce: {
          sanitiser: toBoolean,
        },
      },
      {
        involvedStaff: {
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
        incidentDate: requiredIncidentDate,

        locationId: requiredIntegerMsg('Select the location of the incident'),

        plannedUseOfForce: requiredBooleanMsg('Select yes if the use of force was planned'),

        involvedStaff: optionalInvolvedStaff,

        witnesses: arrayOfObjects({
          name: requiredPatternMsg(namePattern)('Witness names can only contain letters, spaces, hyphens, apostrophe'),
        })
          .ruleset.unique(caseInsensitiveComparator('name'))
          .message("Witness '{#value.name}' has already been added - remove this witness"),
      }),
    },

    isComplete(values) {
      return (
        // It's possible to store invalid usernames which haven't been validated against the auth server.
        // The separate check ensures that all involvedStaff have the correct extra fields that are stored against them once validated.
        isValid(this.schemas.complete, values, true) &&
        isValid(optionalInvolvedStaffWhenPersisted, values.involvedStaff)
      )
    },
    nextPath: {
      path: bookingId => `/report/${bookingId}/use-of-force-details`,
    },
  },
}
