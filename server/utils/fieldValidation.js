const R = require('ramda')
const moment = require('moment')
const { isNilOrEmpty } = require('../utils/utils')

const { buildSanitiser } = require('../services/sanitiser')
const { buildFieldTypeSplitter } = require('../services/fieldTypeSplitter')
const { buildErrorDetailAdapter } = require('../services/errorDetailAdapter')
const { EXTRACTED } = require('../config/fieldType')

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
  validate2({ errorDetailAdapter, schema }, input) {
    const validationResult = schema.validate(input, validatorConfig(true))
    return R.evolve({
      error: {
        details: R.map(errorDetailAdapter),
      },
    })(validationResult)
  },

  isValid(schema, value, stripUnknown = false) {
    const joiErrors = schema.validate(value, { stripUnknown, abortEarly: false })
    return isNilOrEmpty(joiErrors.error)
  },

  buildValidationSpec(schema) {
    const description = schema.describe()

    return {
      sanitiser: buildSanitiser(description),
      errorDetailAdapter: buildErrorDetailAdapter(description),
      fieldTypeSplitter: buildFieldTypeSplitter(description, EXTRACTED),
      schema,
    }
  },
}
