const logger = require('../../log.js')
const { equals } = require('../utils/utils')
const { validate } = require('../utils/fieldValidation')

module.exports = function createSomeService(formClient) {
  async function getFormResponse(userId, bookingId) {
    const data = await formClient.getFormDataForUser(userId, bookingId)
    return data.rows[0] || {}
  }

  async function submitForm(userId, bookingId) {
    const result = await formClient.submit(userId, bookingId)
    logger.info(`Rows altered: ${result.rows}`)
  }

  async function update({ userId, formId, bookingId, formObject, config, userInput, formSection, formName }) {
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

    if (formId) {
      await formClient.update(formId, updatedFormObject)
    } else {
      await formClient.create(userId, bookingId, updatedFormObject)
    }
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
      const { fieldName, answerIsRequired, sanitiser } = getFieldInfo(field, userInput)

      if (!answerIsRequired) {
        return answersAccumulator
      }

      return { ...answersAccumulator, [fieldName]: sanitiser(userInput[fieldName]) }
    }
  }

  function getFieldInfo(field, userInput) {
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

  const getIncidentsForUser = async (userId, status) => {
    const data = await formClient.getIncidentsForUser(userId, status)
    return data.rows
  }

  return {
    getFormResponse,
    update,
    submitForm,
    getValidationErrors: validate,
    getIncidentsForUser,
  }
}
