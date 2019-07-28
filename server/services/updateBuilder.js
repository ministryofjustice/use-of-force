const { equals } = require('../utils/utils')
const { EXTRACTED, PAYLOAD } = require('../config/fieldType')

const requiresAnotherFieldToBeADifferentValue = ({ dependentOn, predicate: requiredValue }, userInput) => {
  if (!dependentOn) {
    return false
  }
  const dependentFieldValue = userInput[dependentOn]
  const matchesRequiredValue = dependentFieldValue && dependentFieldValue === requiredValue
  return !matchesRequiredValue
}

const getFieldInfo = ({ field, userInput, requiredFieldType }) => {
  const fieldName = Object.keys(field)[0]
  const fieldConfig = field[fieldName]

  const { sanitiser = value => value, fieldType = PAYLOAD } = fieldConfig

  return {
    fieldName,
    sanitiser,
    exclude: fieldType !== requiredFieldType || requiresAnotherFieldToBeADifferentValue(fieldConfig, userInput),
  }
}

const extractFields = ({ userInput, requiredFieldType }) => {
  return (answersAccumulator, field) => {
    const { fieldName, exclude, sanitiser } = getFieldInfo({ field, userInput, requiredFieldType })

    if (exclude) {
      return answersAccumulator
    }

    return { ...answersAccumulator, [fieldName]: sanitiser(userInput[fieldName]) }
  }
}

const extractAnswers = userInput => extractFields({ userInput, requiredFieldType: PAYLOAD })
const extractOtherFields = userInput => extractFields({ userInput, requiredFieldType: EXTRACTED })

const buildUpdate = ({ formObject, fieldMap, userInput, formSection, formName }) => {
  const answers = fieldMap.reduce(extractAnswers(userInput), {})
  const extractedFields = fieldMap.reduce(extractOtherFields(userInput), {})

  const updatedFormObject = {
    ...formObject,
    [formSection]: {
      ...formObject[formSection],
      [formName]: answers,
    },
  }

  const payloadChanged = !equals(formObject, updatedFormObject)
  return {
    ...(payloadChanged && { payload: updatedFormObject }),
    ...(extractedFields && extractedFields),
  }
}

module.exports = buildUpdate
