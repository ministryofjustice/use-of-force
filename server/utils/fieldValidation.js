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

module.exports = {
  validate(fields, formSchema, formResponse, stripUnknown = false) {
    const joiErrors = formSchema.validate(formResponse, { stripUnknown, abortEarly: false })
    const fieldsConfig = fields
    if (isNilOrEmpty(joiErrors.error)) {
      return []
    }

    const errors = joiErrors.error.details.map(error => {
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

    return errors
  },

  isValid(schema, value, stripUnknown = false) {
    const joiErrors = schema.validate(value, { stripUnknown, abortEarly: false })
    return isNilOrEmpty(joiErrors.error)
  },
}
