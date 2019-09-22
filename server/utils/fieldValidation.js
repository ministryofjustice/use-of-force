const joi = require('@hapi/joi').extend(require('@hapi/joi-date'))
const moment = require('moment')
const R = require('ramda')

const { getFieldName, getFieldDetail, mergeWithRight, getIn, isNilOrEmpty } = require('../utils/utils')

const setErrorMessage = message =>
  R.map(e => {
    e.message = message
    return e
  })

const namePattern = /^[a-zA-Z][a-zA-Z\s\-'.]{0,48}[a-zA-Z]$/

const fieldOptions = {
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

  optionalInvolvedStaff: joi.array().items(
    joi.object({
      username: joi
        .string()
        .trim()
        .regex(/^[a-zA-Z_]{2,50}$/, 'Username'),
    })
  ),

  optionalInvolvedStaffWhenPersisted: joi.array().items(
    joi.object({
      username: joi
        .string()
        .trim()
        .regex(/^[a-zA-Z_]{2,50}$/, 'Username')
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
  ),

  optionalWitnesses: joi.array().items(
    joi.object({
      name: joi
        .string()
        .trim()
        .regex(namePattern, 'Witnesses'),
    })
  ),

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
      .required(),
  }),
}

const getHref = (fieldConfig, error) => {
  const [head, ...sections] = error.path
  const { firstFieldName } = fieldConfig[head]

  if (sections.length === 0 && firstFieldName) {
    /* If this field represents an array and the error is related to its structure 
        we want to focus on the first field within the array item 
    */
    return firstFieldName
  }

  return sections.reduce((path, section) => `${path}[${section}]`, head)
}

module.exports = {
  validate(fields, formResponse, stripUnknown = false) {
    const formSchema = createSchemaFromConfig(fields)
    const joiErrors = formSchema.validate(formResponse, { stripUnknown, abortEarly: false })
    const fieldsConfig = fields
    if (isNilOrEmpty(joiErrors.error)) {
      return []
    }

    const errors = joiErrors.error.details.map(error => {
      const fieldConfig = fieldsConfig.find(field => getFieldName(field) === error.path[0])

      const errorMessage =
        getIn([error.path[0], 'validationMessage', error.type], fieldConfig) ||
        getIn([...error.path, 'validationMessage'], fieldConfig) ||
        error.message

      return {
        text: errorMessage,
        href: `#${getHref(fieldConfig, error)}`,
      }
    })

    return errors
  },

  isValid(schemaName, fieldValue) {
    const joiFieldItem = fieldOptions[schemaName]
    const joiErrors = joiFieldItem.validate(fieldValue, { stripUnknown: false, abortEarly: false })
    return isNilOrEmpty(joiErrors.error)
  },
}

function createSchemaFromConfig(fields) {
  const formSchema = fields.reduce((schema, field) => {
    const fieldName = getFieldName(field)
    const fieldConfigResponseType = getFieldDetail(['responseType'], field)
    const [responseType, ...fieldArgs] = fieldConfigResponseType.split('_')

    const joiFieldItem = fieldOptions[responseType]
    const joiFieldSchema = typeof joiFieldItem === 'function' ? joiFieldItem(...fieldArgs) : joiFieldItem

    return mergeWithRight(schema, { [fieldName]: joiFieldSchema })
  }, {})

  return joi.object().keys(formSchema)
}
