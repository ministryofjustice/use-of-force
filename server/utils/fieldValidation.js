const baseJoi = require('joi')
const moment = require('moment')
const dateExtend = require('joi-date-extensions')
const postcodeExtend = require('joi-postcode')

const { getFieldName, getFieldDetail, mergeWithRight, getIn, isNilOrEmpty } = require('../utils/utils')

const joi = baseJoi.extend(dateExtend).extend(postcodeExtend)

const fieldOptions = {
  requiredMonthIndex: joi
    .number()
    .min(0)
    .max(11)
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
  requiredPostcode: joi.postcode().required(),
  requiredYesNoIf: (requiredItem = 'decision', requiredAnswer = 'Yes') =>
    joi.when(requiredItem, {
      is: requiredAnswer,
      then: joi.valid(['Yes', 'No']).required(),
      otherwise: joi.any().optional(),
    }),
  requiredOneOf: (...values) => joi.valid(values).required(),
  requiredYesNoNotKnown: joi.valid(['YES', 'NO', 'NOT_KNOWN']).required(),
  requiredCameraNumber: () =>
    joi.when('bodyWornCamera', {
      is: 'YES',
      then: joi
        .array()
        .min(1)
        .items(
          joi.object().keys({
            cameraNum: joi
              .string()
              .required()
              .error(() => 'Enter the body-worn camera number'),
          })
        )
        .required(),
    }),
  requiredTagAndDescription: () =>
    joi.when('baggedEvidence', {
      is: true,
      then: joi
        .array()
        .min(1)
        .items(
          joi.object().keys({
            evidenceTagReference: joi
              .string()
              .trim()
              .required()
              .error(() => 'Enter the evidence tag number'),
            description: joi
              .string()
              .trim()
              .required()
              .error(() => 'Enter a description of the evidence'),
          })
        )
        .required(),
    }),

  requiredBatonUsed: () =>
    joi.when('batonDrawn', {
      is: true,
      then: joi.valid([true, false]).required(),
      otherwise: joi.any().optional(),
    }),

  requiredPavaUsed: () =>
    joi.when('pavaDrawn', {
      is: true,
      then: joi.valid([true, false]).required(),
      otherwise: joi.any().optional(),
    }),

  requiredOfficersInvolved: () =>
    joi.when('guidingHold', {
      is: true,
      then: joi.valid([1, 2]).required(),
      otherwise: joi.any().optional(),
    }),

  requiredRestraintPositions: () =>
    joi.when('restraint', {
      is: true,
      then: joi
        .alternatives()
        .try(
          joi.array().items(joi.string().valid('STANDING', 'FACE_DOWN', 'ON_BACK', 'KNEELING')),
          joi.string().valid('STANDING', 'FACE_DOWN', 'ON_BACK', 'KNEELING')
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
    const joiErrors = joi.validate(formResponse, formSchema, { stripUnknown, abortEarly: false })
    const fieldsConfig = fields

    if (isNilOrEmpty(joiErrors.error)) {
      return []
    }

    const errors = joiErrors.error.details.map(error => {
      const fieldConfig = fieldsConfig.find(field => getFieldName(field) === error.path[0])
      const errorMessage =
        getIn([...error.path, 'validationMessage', error.type], fieldConfig) ||
        getIn([...error.path, 'validationMessage'], fieldConfig) ||
        error.message

      return {
        text: errorMessage,
        href: `#${getHref(fieldConfig, error)}`,
      }
    })

    return errors
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
