const logger = require('../../log.js')
const { equals } = require('../utils/utils')
const { validate } = require('../utils/fieldValidation')

module.exports = function createIncidentService({ formClient, elite2ClientBuilder }) {
  async function getFormResponse(userId, bookingId) {
    const data = await formClient.getFormDataForUser(userId, bookingId)
    return data.rows[0] || {}
  }

  async function submitForm(userId, bookingId) {
    const form = await getFormResponse(userId, bookingId)
    if (form.id) {
      logger.info(`Submitting form for user: ${userId} and booking: ${bookingId}`)
      await formClient.submit(userId, bookingId)
      return form.id
    }
    return false
  }

  async function update({ token, userId, reporterName, formId, bookingId, updatedFormObject }) {
    if (formId) {
      await formClient.update(formId, updatedFormObject)
    } else {
      const elite2Client = elite2ClientBuilder(token)
      const { offenderNo } = await elite2Client.getOffenderDetails(bookingId)
      await formClient.create({
        userId,
        bookingId,
        reporterName,
        offenderNo,
        formResponse: updatedFormObject,
      })
    }
    return updatedFormObject
  }

  function getUpdatedFormObject({ formObject, fieldMap, userInput, formSection, formName }) {
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
    getUpdatedFormObject,
  }
}
