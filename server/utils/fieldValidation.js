const R = require('ramda')
const moment = require('moment')

const { getFieldName, getIn, isNilOrEmpty } = require('../utils/utils')

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

const contextFactory = () => ({
  year: moment().year(),
  month: moment().month(),
})

module.exports = {
  validate(fields, formSchema, formResponse, stripUnknown = false) {
    const validationResult = formSchema.validate(formResponse, {
      abortEarly: false,
      convert: true,
      allowUnknown: false,
      stripUnknown,
      context: contextFactory(),
    })

    const fieldsConfig = fields
    if (isNilOrEmpty(validationResult.error)) {
      return validationResult
    }

    const errorDetails = validationResult.error.details.map(error => {
      const fieldConfig = fieldsConfig.find(field => getFieldName(field) === error.path[0])

      const errorMessage =
        getIn([error.path[0], 'validationMessage', `${error.context.label}.${error.type}`], fieldConfig) ||
        getIn([error.path[0], 'validationMessage', error.type], fieldConfig) ||
        getIn([...error.path, 'validationMessage'], fieldConfig) ||
        error.message

      return {
        text: errorMessage,
        href: `#${getHref(fieldConfig, error)}`,
      }
    })

    validationResult.error.details = errorDetails
    return validationResult
  },

  isValid(schema, value, stripUnknown = false) {
    const joiErrors = schema.validate(value, { stripUnknown, abortEarly: false })
    return isNilOrEmpty(joiErrors.error)
  },
}
