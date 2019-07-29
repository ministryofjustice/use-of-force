const logger = require('../../log.js')
const { validate } = require('../utils/fieldValidation')
const { isNilOrEmpty, equals } = require('../utils/utils')

const getUpdatedFormObject = require('./updateBuilder')

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
    const incidentId = await updateIncident({ token, userId, reporterName, formId, bookingId, updatedFormObject })
    if (updatedFormObject.involved) {
      await updateInvolvedStaff(incidentId, updatedFormObject.involved)
    }
  }

  async function updateIncident({ token, userId, reporterName, formId, bookingId, updatedFormObject }) {
    if (formId) {
      if (!isNilOrEmpty(updatedFormObject.payload)) {
        logger.info(`Updated incident with id: ${formId} for user: ${userId} on booking: ${bookingId}`)
        await formClient.update(formId, updatedFormObject.incidentDate, updatedFormObject.payload)
      }
      return formId
    }
    const elite2Client = elite2ClientBuilder(token)
    const { offenderNo } = await elite2Client.getOffenderDetails(bookingId)
    const id = await formClient.create({
      userId,
      bookingId,
      reporterName,
      offenderNo,
      incidentDate: updatedFormObject.incidentDate,
      formResponse: updatedFormObject.payload,
    })
    logger.info(`Created new incident with id: ${id} for user: ${userId} on booking: ${bookingId}`)
    return id
  }

  async function updateInvolvedStaff(incidentId, involvedStaff) {
    await formClient.deleteInvolvedStaff(incidentId)
    if (involvedStaff.length) {
      await formClient.insertInvolvedStaff(incidentId, involvedStaff)
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
