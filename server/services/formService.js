const { equals } = require('../utils/functionalHelpers')
const { validate } = require('../utils/fieldValidation')

module.exports = function createSomeService(formClient) {
  async function getFormResponse(userId) {
    const data = await formClient.getFormDataForUser(userId)

    return data.rows[0] || {}
  }

  async function update({ userId, formId, formObject, config, userInput, formSection, formName }) {
    const updatedFormObject = getUpdatedFormObject({
      formObject,
      fieldMap: config.fields,
      userInput,
      formSection,
      formName,
    })

    if (equals(formObject, updatedFormObject)) {
      return formObject
    }

    await formClient.update(formId, updatedFormObject, userId)
    return updatedFormObject
  }

  function getUpdatedFormObject({ formObject, fieldMap, userInput, formSection, formName }) {
    const answers = fieldMap.reduce(answersFromMapReducer(userInput), {})

    return {
      ...formObject,
      [formSection]: {
        ...formObject[formSection],
        [formName]: answers,
      },
    }
  }

  function answersFromMapReducer(userInput) {
    return (answersAccumulator, field) => {
      const { fieldName, answerIsRequired } = getFieldInfo(field, userInput)

      if (!answerIsRequired) {
        return answersAccumulator
      }

      return { ...answersAccumulator, [fieldName]: userInput[fieldName] }
    }
  }

  function getFieldInfo(field, userInput) {
    const fieldName = Object.keys(field)[0]
    const fieldConfig = field[fieldName]

    const fieldDependentOn = userInput[fieldConfig.dependentOn]
    const predicateResponse = fieldConfig.predicate
    const dependentMatchesPredicate = fieldConfig.dependentOn && fieldDependentOn === predicateResponse

    return {
      fieldName,
      answerIsRequired: !fieldDependentOn || dependentMatchesPredicate,
    }
  }

  return {
    getFormResponse,
    update,
    getValidationErrors: validate,
  }
}
