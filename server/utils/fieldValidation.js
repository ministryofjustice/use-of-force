const baseJoi = require('joi')
const dateExtend = require('joi-date-extensions')
const postcodeExtend = require('joi-postcode')
const { getFieldName, getFieldDetail, mergeWithRight, getIn, isNilOrEmpty } = require('../utils/functionalHelpers')

const joi = baseJoi.extend(dateExtend).extend(postcodeExtend)

const fieldOptions = {
  requiredString: joi.string().required(),
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
}

module.exports = {
  validate(formResponse, pageConfig) {
    const formSchema = createSchemaFromConfig(pageConfig)
    const joiErrors = joi.validate(formResponse, formSchema, { stripUnknown: false, abortEarly: false })
    const fieldsConfig = getIn(['fields'], pageConfig)

    if (isNilOrEmpty(joiErrors.error)) {
      return []
    }

    return joiErrors.error.details.map(error => {
      const fieldConfig = fieldsConfig.find(field => getFieldName(field) === error.path[0])
      const errorMessage = getIn([...error.path, 'validationMessage'], fieldConfig) || error.message

      return {
        text: errorMessage,
        href: `#${getFieldName(fieldConfig)}`,
      }
    })
  },
}

function createSchemaFromConfig(pageConfig) {
  const formSchema = pageConfig.fields.reduce((schema, field) => {
    const fieldName = getFieldName(field)

    const fieldConfigResponseType = getFieldDetail(['responseType'], field)
    const [responseType, ...fieldArgs] = fieldConfigResponseType.split('_')

    const joiFieldItem = fieldOptions[responseType]
    const joiFieldSchema = typeof joiFieldItem === 'function' ? joiFieldItem(...fieldArgs) : joiFieldItem

    return mergeWithRight(schema, { [fieldName]: joiFieldSchema })
  }, {})

  return joi.object().keys(formSchema)
}
