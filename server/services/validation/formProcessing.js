const { validate } = require('./fieldValidation')

const processInput = ({ validationSpec, input }) => {
  const sanitisedInput = validationSpec.sanitiser(input)
  const validationResult = validate(validationSpec, sanitisedInput)
  const errors = validationResult.error ? validationResult.error.details : []
  const { payloadFields, extractedFields } = validationSpec.fieldTypeSplitter(validationResult.value)
  return { payloadFields, extractedFields, errors }
}

module.exports = {
  processInput,
}
