const { joi, validations, usernamePattern, namePattern, caseInsensitiveComparator } = require('./validations')
const { EXTRACTED } = require('../fieldType')
const { toDate, removeEmptyObjects } = require('./sanitisers')
const { buildValidationSpec } = require('../../services/validation')

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
  /*
   * 'The toDate' sanitiser below runs on pre-sanitised fields thanks to requiredIntegerMsg, requiredString above.
   * These pre-defined Joi schemas include the sanitisers 'toInteger' and 'trimmedString' respectively.
   */
  .meta({ sanitiser: toDate })

const optionalInvolvedStaff = joi
  .array()
  .items(
    joi
      .object({
        username: requiredPatternMsg(usernamePattern)(
          'Usernames can only contain letters and an underscore'
        ).uppercase(),
      })
      .id('username')
  )
  .ruleset.unique(caseInsensitiveComparator('username'))
  .message("Username '{#value.username}' has already been added - remove this user")
  .meta({ sanitiser: removeEmptyObjects, firstFieldName: 'involvedStaff[0]' })

const transientSchema = joi.object({
  incidentDate: requiredIncidentDate.meta({ fieldType: EXTRACTED }),

  locationId: requiredIntegerMsg('Select the location of the incident'),

  plannedUseOfForce: requiredBooleanMsg('Select yes if the use of force was planned'),

  involvedStaff: optionalInvolvedStaff,

  witnesses: arrayOfObjects({
    name: requiredPatternMsg(namePattern)('Witness names can only contain letters, spaces, hyphens, apostrophe'),
  })
    .ruleset.unique(caseInsensitiveComparator('name'))
    .message("Witness '{#value.name}' has already been added - remove this witness"),
})

const persistentSchema = transientSchema.fork('involvedStaff.username', schema =>
  schema.append({ name: requiredString, email: requiredString, staffId: requiredNumber })
)
module.exports = {
  optionalInvolvedStaff: transientSchema.extract('involvedStaff'),
  optionalInvolvedStaffWhenPersisted: persistentSchema.extract('involvedStaff'),

  complete: buildValidationSpec(transientSchema),
  persistent: buildValidationSpec(persistentSchema),

  partial: {},
}
