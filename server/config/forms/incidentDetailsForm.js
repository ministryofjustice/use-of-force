const { joi, asMeta, validations, usernamePattern, namePattern, caseInsensitiveComparator } = require('./validations')
const { EXTRACTED } = require('../fieldType')
const { toDate, removeEmptyObjects, toBoolean } = require('./sanitisers')
const { buildValidationSpec } = require('../../services/validation')
const {
  ValidationError,
  hourValidation,
  minuteValidation,
  dateValidation,
  timeValidation,
} = require('./incidentDateValidation')

const {
  optionalForPartialValidation,
  requiredNumber,
  requiredIntegerMsg,
  requiredString,
  optionalString,
  requiredPatternMsg,
  requiredBooleanMsg,
  arrayOfObjects,
} = validations

const requiredIncidentDate = joi
  .object({
    date: joi
      .any()
      .custom(dateValidation)
      .messages({
        [ValidationError.invalid]: 'Enter a date in the correct format, for example, 23/07/2020',
        [ValidationError.isFuture]: 'Enter a date that is not in the future',
      }),

    time: joi
      .object({
        hour: joi
          .any()
          .custom(hourValidation)
          .messages({
            [ValidationError.missing]: 'Enter missing hours',
            [ValidationError.isNotNumber]: 'Enter hours using numbers only',
            [ValidationError.isTooLarge]: 'Enter an hour which is 23 or less',
            [ValidationError.isNot2Digits]: 'Enter the hours using 2 digits',
            [ValidationError.isNotPositiveNumber]: 'Enter an hour which is 00 or more',
          }),

        minute: joi
          .any()
          .custom(minuteValidation)
          .messages({
            [ValidationError.missing]: 'Enter missing minutes',
            [ValidationError.isNotNumber]: 'Enter minutes using numbers only',
            [ValidationError.isTooLarge]: 'Enter the minutes using 59 or less',
            [ValidationError.isNot2Digits]: 'Enter the minutes using 2 digits',
            [ValidationError.isNotPositiveNumber]: 'Enter the minutes using 00 or more',
          }),
      })
      .custom(timeValidation)
      .messages({
        [ValidationError.isFuture]: 'Enter a time which is not in the future',
      }),

    value: joi.date().allow(null),
  })
  .meta({ sanitiser: toDate })

const optionalInvolvedStaff = joi
  .array()
  .items(
    joi
      .object({
        username: requiredPatternMsg(usernamePattern)('Usernames can only contain letters and an underscore')
          .uppercase()
          .alter(optionalForPartialValidation),
      })
      .id('username')
  )
  .ruleset.unique(caseInsensitiveComparator('username'))
  .message("Username '{#value.username}' has already been added - remove this user")
  .meta({ sanitiser: removeEmptyObjects, firstFieldName: 'involvedStaff[0]' })

const transientSchema = joi.object({
  incidentDate: requiredIncidentDate.meta({ fieldType: EXTRACTED }).alter(optionalForPartialValidation),

  locationId: requiredIntegerMsg('Select the location of the incident').alter(optionalForPartialValidation),

  plannedUseOfForce: requiredBooleanMsg('Select yes if the use of force was planned').alter(
    optionalForPartialValidation
  ),

  involvedStaff: optionalInvolvedStaff,

  witnesses: arrayOfObjects({
    name: requiredPatternMsg(namePattern)(
      'Witness names can only contain letters, spaces, full stops, hyphens, apostrophe'
    ).alter(optionalForPartialValidation),
  })
    .ruleset.unique(caseInsensitiveComparator('name'))
    .message("Witness '{#value.name}' has already been added - remove this witness"),
})

const persistentSchema = transientSchema.fork('involvedStaff.username', schema =>
  schema.append({
    name: requiredString,
    email: optionalString,
    staffId: requiredNumber,
    missing: joi.boolean().valid(false).meta(asMeta(toBoolean)),
    verified: joi.boolean().meta(asMeta(toBoolean)),
  })
)
module.exports = {
  optionalInvolvedStaff: transientSchema.extract('involvedStaff'),
  optionalInvolvedStaffWhenPersisted: persistentSchema.extract('involvedStaff'),

  complete: buildValidationSpec(transientSchema),
  persistent: buildValidationSpec(persistentSchema),
  partial: buildValidationSpec(transientSchema.tailor('partial')),
}
