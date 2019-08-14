const { equals, isNilOrEmpty } = require('../utils/utils')
const { EXTRACTED, PAYLOAD } = require('../config/fieldType')
const { validate } = require('../utils/fieldValidation')

const requiresAnotherFieldToBeADifferentValue = ({ dependentOn, predicate: requiredValue }, userInput) => {
  if (!dependentOn) {
    return false
  }
  const dependentFieldValue = userInput[dependentOn]
  const matchesRequiredValue = dependentFieldValue && dependentFieldValue === requiredValue
  return !matchesRequiredValue
}

const getFieldInfo = ({ field, userInput }) => {
  const fieldName = Object.keys(field)[0]
  const fieldConfig = field[fieldName]

  const { sanitiser = value => value } = fieldConfig

  return {
    fieldName,
    sanitiser,
    exclude: requiresAnotherFieldToBeADifferentValue(fieldConfig, userInput),
  }
}

const sanitiseInput = userInput => {
  return (answersAccumulator, field) => {
    const { fieldName, exclude, sanitiser } = getFieldInfo({ field, userInput })

    if (exclude) {
      return answersAccumulator
    }

    return { ...answersAccumulator, [fieldName]: sanitiser(userInput[fieldName]) }
  }
}

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

const processInput = ({ validate: shouldValidate, fields }, userInput) => {
  const response = fields.reduce(sanitiseInput(userInput), {})
  const errors = shouldValidate ? validate(fields, response) : []
  const { payloadFields, extractedFields } = splitByType(fields, response)
  return { payloadFields, extractedFields, errors }
}

const mergeIntoPayload = ({ formObject, formPayload, formSection, formName }) => {
  const updatedFormObject = {
    ...formObject,
    [formSection]: {
      ...formObject[formSection],
      [formName]: formPayload,
    },
  }

  const payloadChanged = !equals(formObject, updatedFormObject)
  return payloadChanged && updatedFormObject
}

module.exports = {
  processInput,
  mergeIntoPayload,
}
