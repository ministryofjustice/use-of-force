const { buildValidationSpec, isValid, validate } = require('./fieldValidation')
const { processInput, mergeIntoPayload } = require('./formProcessing')

module.exports = {
  buildValidationSpec,
  isValid, // TODO: Only used by reportStatusChecker.  Move checker into this package? Hmm.
  validate, // TODO: This could probably be removed (with edits elsewhere)
  processInput,
  mergeIntoPayload, // TODO: This should go somewhere else
}
