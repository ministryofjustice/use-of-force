const joi = require('@hapi/joi').extend(require('@hapi/joi-date'))
const moment = require('moment')
const R = require('ramda')

const setErrorMessage = message =>
  R.map(e => {
    e.message = message
    return e
  })

const caseInsensitiveComparator = key =>
  R.eqBy(
    R.pipe(
      R.prop(key),
      R.trim,
      R.toUpper
    )
  )

const namePattern = /^[a-zA-Z][a-zA-Z\s\-'.]{0,48}[a-zA-Z]$/
const usernamePattern = /^[a-zA-Z0-9_]{2,50}$/

module.exports = {
  joi,
  usernamePattern,
  validations: {
    any: joi.any(),

    requiredMonthIndex: joi
      .number()
      .min(0)
      .max(11)
      .required(),

    requiredMonthIndexNotInFuture: yearRef =>
      joi
        .number()
        .min(0)
        .when(joi.ref(yearRef), {
          switch: [
            {
              is: joi
                .number()
                .less(moment().year())
                .required(),
              then: joi
                .number()
                .integer()
                .max(11)
                .required(),
            },
            {
              is: joi
                .number()
                .valid(moment().year())
                .required(),
              then: joi
                .number()
                .integer()
                .max(moment().month())
                .required(),
              otherwise: joi.any().optional(),
            },
          ],
        })
        .required(),

    requiredYearNotInFuture: () =>
      joi
        .number()
        .min(1900)
        .max(moment().year())
        .required(),

    requiredString: joi
      .string()
      .trim()
      .required(),

    requiredNumber: joi.number().required(),

    requiredBoolean: joi
      .boolean()
      .required()
      .strict(),

    optionalBoolean: joi
      .boolean()
      .optional()
      .strict(),

    optionalString: joi
      .string()
      .allow('')
      .optional(),

    requiredDay: joi
      .date()
      .format('DD')
      .required(),

    requiredMonth: joi
      .date()
      .format('MM')
      .required(),

    requiredYear: joi
      .date()
      .format('YYYY')
      .required(),

    requiredOneOf: (...values) => joi.valid(values).required(),

    requiredYesNoNotKnown: joi.valid('YES', 'NO', 'NOT_KNOWN').required(),

    requiredIncidentDate: joi.object({
      date: joi.object({
        day: joi.number().required(),
        month: joi.number().required(),
        year: joi.number().required(),
      }),
      time: joi
        .string()
        .trim()
        .regex(/^(0[0-9]|1[0-9]|2[0-3]|[0-9])[:.][0-5][0-9]$/)
        .required(),
      raw: joi.any(),
      value: joi.date().allow(null),
      isInvalidDate: joi
        .boolean()
        .invalid(true)
        .required(),
      isFutureDate: joi
        .boolean()
        .invalid(true)
        .required(),
      isFutureDateTime: joi
        .boolean()
        .invalid(true)
        .required(),
    }),

    requiredCameraNumber: joi.when('bodyWornCamera', {
      is: 'YES',
      then: joi
        .array()
        .min(1)
        .items(
          joi.object({
            cameraNum: joi
              .string()
              .required()
              .error(setErrorMessage('Enter the body-worn camera number')),
          })
        )
        .ruleset.unique('cameraNum')
        .message("Camera '{#value.cameraNum}' has already been added - remove this camera")
        .required(),
    }),

    requiredTagAndDescription: joi.when(joi.ref('baggedEvidence'), {
      is: true,
      then: joi
        .array()
        .min(1)
        .items(
          joi.object({
            evidenceTagReference: joi
              .string()
              .trim()
              .required()
              .error(setErrorMessage('Enter the evidence tag number')),
            description: joi
              .string()
              .trim()
              .required()
              .error(setErrorMessage('Enter a description of the evidence')),
          })
        )
        .ruleset.unique('evidenceTagReference')
        .message("Evidence tag '{#value.evidenceTagReference}' has already been added - remove this evidence tag")
        .required(),
    }),

    requiredBatonUsed: joi.when('batonDrawn', {
      is: true,
      then: joi.valid(true, false).required(),
    }),

    requiredPavaUsed: joi.when('pavaDrawn', {
      is: true,
      then: joi.valid(true, false).required(),
    }),

    requiredOfficersInvolved: joi.when('guidingHold', {
      is: true,
      then: joi.valid(1, 2).required(),
    }),

    requiredRestraintPositions: joi.when('restraint', {
      is: true,
      then: joi
        .alternatives()
        .try(joi.array().items(joi.string().valid('STANDING', 'FACE_DOWN', 'ON_BACK', 'KNEELING')))
        .required(),
    }),

    f213CompletedBy: joi
      .string()
      .trim()
      .regex(namePattern, '213')
      .required(),

    requiredMemberOfHealthcare: joi.when('healthcareInvolved', {
      is: true,
      then: joi
        .string()
        .trim()
        .regex(namePattern, 'HealthcarePractitioner')
        .required(),
    }),

    optionalInvolvedStaff: joi
      .array()
      .items(
        joi.object({
          username: joi
            .string()
            .trim()
            .regex(usernamePattern, 'Username'),
        })
      )
      .ruleset.unique('username')
      .message("Username '{#value.username}' has already been added - remove this user"),

    optionalInvolvedStaffWhenPersisted: joi
      .array()
      .items(
        joi.object({
          username: joi
            .string()
            .trim()
            .regex(usernamePattern, 'Username')
            .required(),
          name: joi
            .string()
            .trim()
            .required(),
          email: joi
            .string()
            .trim()
            .required(),
          staffId: joi.number().required(),
        })
      )
      .ruleset.unique('username')
      .message("Username '{#value.username}' has already been added - remove this user"),

    optionalWitnesses: joi
      .array()
      .items(
        joi.object({
          name: joi
            .string()
            .trim()
            .regex(namePattern, 'Witnesses'),
        })
      )
      .ruleset.unique(caseInsensitiveComparator('name'))
      .message("Witness '{#value.name}' has already been added - remove this witness"),

    requiredStaffNeedingMedicalAttention: joi.when('staffMedicalAttention', {
      is: true,
      then: joi
        .array()
        .min(1)
        .items(
          joi.object({
            name: joi
              .string()
              .trim()
              .required()
              .regex(namePattern, 'StaffMedicalAttention'),

            hospitalisation: joi
              .any()
              .valid(true, false)
              .required()
              .error(setErrorMessage('Select yes if the staff member had to go to hospital')),
          })
        )
        .ruleset.unique(caseInsensitiveComparator('name'))
        .message("Name '{#value.name}' has already been added - remove this name")
        .required(),
    }),
  },
}
