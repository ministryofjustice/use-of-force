const baseJoi = require('joi')
const dateExtend = require('joi-date-extensions')
const postcodeExtend = require('joi-postcode')
const { getFieldName, getFieldDetail, mergeWithRight, getIn, isNilOrEmpty } = require('../utils/utils')

const joi = baseJoi.extend(dateExtend).extend(postcodeExtend)
const { processUserInput } = require('../services/updateBuilder')

const fieldOptions = {
  requiredString: joi.string().required(),
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
              .error(() => 'Please input the camera number(s)'),
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
              .required()
              .error(() => 'Please input the tag name for the evidence'),
            description: joi
              .string()
              .required()
              .error(() => 'Please input a description of the evidence'),
          })
        )
        .required(),
    }),
}

module.exports = {
  validate(response, fields) {
    const { formSpecificPayload: formResponse } = processUserInput({ fieldMap: fields, userInput: response })

    const formSchema = createSchemaFromConfig(fields)
    const joiErrors = joi.validate(formResponse, formSchema, { stripUnknown: false, abortEarly: false })
    const fieldsConfig = fields

    if (isNilOrEmpty(joiErrors.error)) {
      return { errors: [], formResponse }
    }

    const errors = joiErrors.error.details.map(error => {
      const fieldConfig = fieldsConfig.find(field => getFieldName(field) === error.path[0])
      const errorMessage = getIn([...error.path, 'validationMessage'], fieldConfig) || error.message

      return {
        text: errorMessage,
        href: `#${getFieldName(fieldConfig)}`,
      }
    })

    return { errors, formResponse }
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
