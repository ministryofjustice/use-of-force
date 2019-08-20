const logger = require('../../log.js')
const { isNilOrEmpty } = require('../utils/utils')

module.exports = function createReportService({ incidentClient, elite2ClientBuilder, involvedStaffService }) {
  function getCurrentDraft(userId, bookingId) {
    return incidentClient.getCurrentDraftReport(userId, bookingId)
  }

  async function submit(currentUser, bookingId) {
    const form = await getCurrentDraft(currentUser.username, bookingId)
    if (form.id) {
      await involvedStaffService.addCurrentUser(form.id, currentUser)
      logger.info(`Submitting report for user: ${currentUser.username} and booking: ${bookingId}`)
      await incidentClient.submitReport(currentUser.username, bookingId)
      return form.id
    }
    return false
  }

  async function update({ currentUser, formId, bookingId, formObject, incidentDate, involvedStaff }) {
    const reportId = await updateReport({
      currentUser,
      formId,
      bookingId,
      formObject,
      incidentDate,
    })
    if (involvedStaff) {
      await involvedStaffService.update(reportId, involvedStaff)
    }
  }

  async function updateReport({ currentUser, formId, bookingId, formObject, incidentDate }) {
    const { username: userId, token, displayName: reporterName } = currentUser
    if (formId) {
      if (!isNilOrEmpty(formObject)) {
        logger.info(`Updated report with id: ${formId} for user: ${userId} on booking: ${bookingId}`)
        await incidentClient.updateDraftReport(formId, incidentDate, formObject)
      }
      return formId
    }
    const elite2Client = elite2ClientBuilder(token)
    const { offenderNo } = await elite2Client.getOffenderDetails(bookingId)
    const id = await incidentClient.createDraftReport({
      userId,
      reporterName,
      bookingId,
      offenderNo,
      incidentDate,
      formResponse: formObject,
    })
    logger.info(`Created new report with id: ${id} for user: ${userId} on booking: ${bookingId}`)
    return id
  }

  return {
    getCurrentDraft,
    update,
    submit,
  }
}
