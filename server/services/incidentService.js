const logger = require('../../log.js')
const { isNilOrEmpty } = require('../utils/utils')

module.exports = function createIncidentService({ incidentClient, elite2ClientBuilder }) {
  function getCurrentDraftIncident(userId, bookingId) {
    return incidentClient.getCurrentDraftIncident(userId, bookingId)
  }

  async function submitForm(userId, bookingId) {
    const form = await getCurrentDraftIncident(userId, bookingId)
    if (form.id) {
      logger.info(`Submitting form for user: ${userId} and booking: ${bookingId}`)
      await incidentClient.submit(userId, bookingId)
      return form.id
    }
    return false
  }

  async function update({ currentUser, formId, bookingId, formObject, incidentDate, involvedStaff }) {
    const reportId = await updateIncident({
      currentUser,
      formId,
      bookingId,
      formObject,
      incidentDate,
    })
    if (involvedStaff) {
      await updateInvolvedStaff({ reportId, involvedStaff })
    }
  }

  async function updateIncident({ currentUser, formId, bookingId, formObject, incidentDate }) {
    const { username: userId, token, displayName: reporterName } = currentUser
    if (formId) {
      if (!isNilOrEmpty(formObject)) {
        logger.info(`Updated incident with id: ${formId} for user: ${userId} on booking: ${bookingId}`)
        await incidentClient.updateDraftIncident(formId, incidentDate, formObject)
      }
      return formId
    }
    const elite2Client = elite2ClientBuilder(token)
    const { offenderNo } = await elite2Client.getOffenderDetails(bookingId)
    const id = await incidentClient.createDraftIncident({
      userId,
      reporterName,
      bookingId,
      offenderNo,
      incidentDate,
      formResponse: formObject,
    })
    logger.info(`Created new incident with id: ${id} for user: ${userId} on booking: ${bookingId}`)
    return id
  }

  async function updateInvolvedStaff({ reportId, involvedStaff = [] }) {
    await incidentClient.deleteInvolvedStaff(reportId)
    if (involvedStaff.length) {
      // TODO The reporting staff may need to be added to the list
      const staff = involvedStaff.map(user => ({
        userId: user.username,
        name: user.name,
        email: user.email,
      }))
      await incidentClient.insertInvolvedStaff(reportId, staff)
    }
  }

  const getInvolvedStaff = reportId => {
    return incidentClient.getInvolvedStaff(reportId)
  }

  return {
    getCurrentDraftIncident,
    update,
    submitForm,
    getInvolvedStaff,
  }
}
