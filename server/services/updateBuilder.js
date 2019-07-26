const { equals } = require('../utils/utils')

const getFieldInfo = (field, userInput) => {
  const fieldName = Object.keys(field)[0]
  const fieldConfig = field[fieldName]

  const fieldDependentOn = userInput[fieldConfig.dependentOn]
  const { sanitiser = value => value, predicate: predicateResponse } = fieldConfig
  const dependentMatchesPredicate = fieldConfig.dependentOn && fieldDependentOn === predicateResponse

  return {
    fieldName,
    sanitiser,
    answerIsRequired: !fieldDependentOn || dependentMatchesPredicate,
  }
}

const answersFromMapReducer = userInput => {
  return (answersAccumulator, field) => {
    const { fieldName, answerIsRequired, sanitiser } = getFieldInfo(field, userInput)

    if (!answerIsRequired) {
      return answersAccumulator
    }

    return { ...answersAccumulator, [fieldName]: sanitiser(userInput[fieldName]) }
  }
}

const buildUpdate = ({ formObject, fieldMap, userInput, formSection, formName }) => {
  const answers = fieldMap.reduce(answersFromMapReducer(userInput), {})

  const updatedFormObject = {
    ...formObject,
    [formSection]: {
      ...formObject[formSection],
      [formName]: answers,
    },
  }
  return !equals(formObject, updatedFormObject) && updatedFormObject
}

module.exports = buildUpdate
