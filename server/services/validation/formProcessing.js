const R = require('ramda')
const { validate } = require('./fieldValidation')

const processInput = ({ validationSpec, input }) => {
  const sanitisedInput = validationSpec.sanitiser(input)
  const validationResult = validate(validationSpec, sanitisedInput)
  const errors = validationResult.error ? validationResult.error.details : []
  const { payloadFields, extractedFields } = validationSpec.fieldTypeSplitter(validationResult.value)
  return { payloadFields, extractedFields, errors }
}

/**
 * Create new object from formObject with field 'formName' replaced by formPayload.
 * @param {object} args
 * @param {any} args.formObject from database
 * @param {any} args.formPayload from request
 * @param {any} args.formName
 * @returns {object}
 */
const mergeIntoPayload = ({ formObject, formPayload, formName }) => {
  const updatedFormObject = {
    ...formObject,
    [formName]: formPayload,
  }

  const payloadChanged = !R.equals(formObject, updatedFormObject)
  return payloadChanged && updatedFormObject
}

module.exports = {
  processInput,
  mergeIntoPayload,
}
