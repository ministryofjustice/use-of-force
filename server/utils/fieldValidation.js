const moment = require('moment')

const { getFieldName, isNilOrEmpty } = require('../utils/utils')

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
  validate(fieldsConfig, formSchema, formResponse, stripUnknown = false) {
    const validationResult = formSchema.validate(formResponse, {
      abortEarly: false,
      convert: true,
      allowUnknown: false,
      stripUnknown,
      context: contextFactory(),
    })

    if (isNilOrEmpty(validationResult.error)) {
      return validationResult
    }

    const errorDetails = validationResult.error.details.map(error => {
      const fieldConfig = fieldsConfig.find(field => getFieldName(field) === error.path[0])

      return {
        text: error.message,
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
