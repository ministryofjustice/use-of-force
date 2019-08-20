const logger = require('../../log.js')
const { isNilOrEmpty } = require('../utils/utils')

module.exports = function createReportService({ incidentClient, elite2ClientBuilder }) {
  function getCurrentDraft(userId, bookingId) {
    return incidentClient.getCurrentDraftReport(userId, bookingId)
  }

  async function submit(userId, bookingId) {
    const form = await getCurrentDraft(userId, bookingId)
    if (form.id) {
      logger.info(`Submitting report for user: ${userId} and booking: ${bookingId}`)
      await incidentClient.submitReport(userId, bookingId)
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
      await updateInvolvedStaff({ reportId, involvedStaff })
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
    getCurrentDraft,
    update,
    submit,
    getInvolvedStaff,
  }
}
