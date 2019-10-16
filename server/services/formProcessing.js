const R = require('ramda')
const { equals, isNilOrEmpty } = require('../utils/utils')
const { EXTRACTED, PAYLOAD } = require('../config/fieldType')
const { validate } = require('../utils/fieldValidation')
const { buildSanitiser } = require('./sanitiser')

const extractFields = (userInput, requiredFieldType) => {
  return (answersAccumulator, field) => {
    const fieldName = Object.keys(field)[0]
    const { fieldType = PAYLOAD } = field[fieldName]

    const value = userInput[fieldName]
    return fieldType !== requiredFieldType || isNilOrEmpty(value)
      ? answersAccumulator
      : { ...answersAccumulator, [fieldName]: value }
  }
}
const extractFieldsOfType = (fields, input, fieldType) => fields.reduce(extractFields(input, fieldType), {})

const splitByType = (fields, userInput) => ({
  payloadFields: extractFieldsOfType(fields, userInput, PAYLOAD),
  extractedFields: extractFieldsOfType(fields, userInput, EXTRACTED),
})

/**
 *  string | object  -> string
 *
 *  Given the 'text' property of an error object return a single error message from that property.
 *  The 'text' property may be a string, or an object having one or more properties
 *  If 'text' is a string return that, otherwise select one of the object's properties and return that.
 *  Object properties have a priority, with 'string.base' being selected first, otherwise 'string.empty'
 *  otherwise any other property.
 */
const extractSingleErrorMessage = R.unless(
  R.is(String),
  R.cond([
    [R.has('string.base'), R.prop('string.base')],
    [R.has('string.empty'), R.prop('string.empty')],
    [
      R.T,
      R.pipe(
        R.values,
        R.head
      ),
    ],
  ])
)

/**
 * Ensure that the 'text' property of every supplied error object is a string.
 *
 * The content of the 'text' property depends upon the number of validation error messages produced by Joi.
 * If there is just one message then 'text' is a string, otherwise 'text' is an object whose property
 * names identify different validation errors while the values are the error messages
 * associated with validation error name.
 * 'text' properties that are strings are untouched.  'text' properties that are objects are replaced with
 * a string value selected from the set of error messages contained in the 'text' object.
 */
const simplifyErrors = R.map(R.over(R.lensProp('text'), extractSingleErrorMessage))

const processInput = ({ validate: shouldValidate = true, formConfig, input }) => {
  const { schemas, fields } = formConfig

  // TODO: The sanitiser should be built in advance and attached to the formConfig
  const sanitisedInput = buildSanitiser(schemas.complete)(input)

  const validationResult = validate(fields, schemas.complete, sanitisedInput)
  const errors = shouldValidate && validationResult.error ? simplifyErrors(validationResult.error.details) : []

  const { payloadFields, extractedFields } = splitByType(fields, validationResult.value)
  return { payloadFields, extractedFields, errors }
}

/**
 * Create new object from formObject with field 'formName' replaced by formPayload.
 * @param formObject from database
 * @param formPayload from request
 * @param formName
 * @returns {object}
 */
const mergeIntoPayload = ({ formObject, formPayload, formName }) => {
  const updatedFormObject = {
    ...formObject,
    [formName]: formPayload,
  }

  const payloadChanged = !equals(formObject, updatedFormObject)
  return payloadChanged && updatedFormObject
}

module.exports = {
  processInput,
  mergeIntoPayload,
}
