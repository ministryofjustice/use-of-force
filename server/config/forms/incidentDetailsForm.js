const { joi, validations, usernamePattern, namePattern, caseInsensitiveComparator } = require('./validations')
const { EXTRACTED } = require('../fieldType')
const { isValid } = require('../../utils/fieldValidation')
const { toDate, removeEmptyObjects } = require('./sanitisers')

const {
  requiredNumber,
  requiredIntegerMsg,
  requiredString,
  requiredStringMsg,
  requiredPatternMsg,
  requiredBoolean,
  requiredBooleanMsg,
  any,
  arrayOfObjects,
} = validations

const timePattern = /^(0[0-9]|1[0-9]|2[0-3]|[0-9])[:.][0-5][0-9]$/

const requiredIncidentDate = joi
  .object({
    date: joi
      .object({
        day: requiredIntegerMsg('Enter the date'),
        month: requiredIntegerMsg('Enter the month'),
        year: requiredIntegerMsg('Enter the year'),
      })
      .required(),
    time: requiredStringMsg('Enter the time of the incident')
      .pattern(timePattern)
      .message('Enter a time in the correct format - for example, 23:59'),
    raw: any,
    value: joi.date().allow(null),
    isInvalidDate: requiredBoolean
      .invalid(true)
      .messages({ 'any.invalid': 'Enter a date in the correct format - for example, 27 3 2007' }),
    isFutureDate: requiredBoolean.invalid(true).messages({ 'any.invalid': 'Enter a date that is not in the future' }),
    isFutureDateTime: requiredBoolean
      .invalid(true)
      .messages({ 'any.invalid': 'Enter a time which is not in the future' }),
  })
  // .required()
  /* 'The toDate' sanitiser below runs on pre-sanitised fields thanks to requiredIntegerMsg, requiredString above.
     These pre-defined Joi schemas include the sanitisers toInteger and trimmedString respectively.
   */
  .meta({ sanitiser: toDate })

const optionalInvolvedStaff = arrayOfObjects({
  username: requiredPatternMsg(usernamePattern)('Usernames can only contain letters and an underscore').uppercase(),
})
  .ruleset.unique(caseInsensitiveComparator('username'))
  .message("Username '{#value.username}' has already been added - remove this user")
  .meta({ sanitiser: removeEmptyObjects })

const optionalInvolvedStaffWhenPersisted = arrayOfObjects({
  username: requiredString.pattern(usernamePattern, 'Username'),
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
        incidentDate: {},
      },
      {
        locationId: {},
      },
      {
        plannedUseOfForce: {},
      },
      {
        involvedStaff: {
          firstFieldName: 'involvedStaff[0]',
        },
      },
      {
        witnesses: {},
      },
    ],

    schemas: {
      complete: joi.object({
        incidentDate: requiredIncidentDate.meta({ fieldType: EXTRACTED }),

        locationId: requiredIntegerMsg('Select the location of the incident'),

        plannedUseOfForce: requiredBooleanMsg('Select yes if the use of force was planned'),

        involvedStaff: optionalInvolvedStaff.meta({ firstFieldName: 'involvedStaff[0]' }),

        witnesses: arrayOfObjects({
          name: requiredPatternMsg(namePattern)('Witness names can only contain letters, spaces, hyphens, apostrophe'),
        })
          .ruleset.unique(caseInsensitiveComparator('name'))
          .message("Witness '{#value.name}' has already been added - remove this witness")
          .meta({ sanitiser: removeEmptyObjects }),
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
