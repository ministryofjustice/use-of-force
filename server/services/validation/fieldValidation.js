const moment = require('moment')
const { isNilOrEmpty } = require('../../utils/utils')

const contextFactory = () => ({
  year: moment().year(),
  month: moment().month(),
})

const validatorConfig = stripUnknown => ({
  abortEarly: false,
  convert: true,
  allowUnknown: false,
  stripUnknown,
  context: contextFactory(),
})

module.exports = {
  validate({ errorDetailAdapter, schema }, input) {
    const validationResult = schema.validate(input, validatorConfig(true))
    if (validationResult.error) {
      validationResult.error.details = validationResult.error.details.map(errorDetailAdapter)
    }
    return validationResult
  },

  isValid(schema, value, stripUnknown = false) {
    const joiErrors = schema.validate(value, { stripUnknown, abortEarly: false })
    return isNilOrEmpty(joiErrors.error)
  },
}
