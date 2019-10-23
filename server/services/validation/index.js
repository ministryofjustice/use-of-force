const { isValid, validate } = require('./fieldValidation')
const { processInput, mergeIntoPayload } = require('./formProcessing')
const { buildSanitiser } = require('./sanitiser')
const { buildFieldTypeSplitter } = require('./fieldTypeSplitter')
const { buildErrorDetailAdapter } = require('./errorDetailAdapter')
const { EXTRACTED } = require('../../config/fieldType')

const buildValidationSpec = schema => {
  const description = schema.describe()

  return {
    sanitiser: buildSanitiser(description),
    errorDetailAdapter: buildErrorDetailAdapter(description),
    fieldTypeSplitter: buildFieldTypeSplitter(description, EXTRACTED),
    schema,
  }
}

module.exports = {
  buildValidationSpec,
  isValid, // TODO: Only used by reportStatusChecker.  Move checker into this package? Hmm.
  validate, // TODO: This could probably be removed (with edits elsewhere)
  processInput,
  mergeIntoPayload, // TODO: This should go somewhere else
}
