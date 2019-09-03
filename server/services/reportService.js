const logger = require('../../log.js')
const { isNilOrEmpty } = require('../utils/utils')
const { check: getReportStatus } = require('../services/reportStatusChecker')

module.exports = function createReportService({
  incidentClient,
  elite2ClientBuilder,
  involvedStaffService,
  notificationService,
}) {
  function getCurrentDraft(userId, bookingId) {
    return incidentClient.getCurrentDraftReport(userId, bookingId)
  }

  async function isDraftComplete(username, bookingId) {
    const { form_response: formData = {} } = await getCurrentDraft(username, bookingId)
    const { complete } = getReportStatus(formData)
    return complete
  }

  async function update({ currentUser, formId, bookingId, formObject, incidentDate }) {
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

  const requestStatements = (currentUser, incidentDate, staffMembers) => {
    const staffExcludingCurrentUser = staffMembers.filter(staff => staff.username !== currentUser.username)
    return staffExcludingCurrentUser.map(staff =>
      notificationService.sendStatementRequest(staff.email, {
        involvedName: staff.name,
        reporterName: currentUser.displayName,
        incidentDate,
      })
    )
  }

  async function submit(currentUser, bookingId) {
    const { id, incident_date: incidentDate } = await getCurrentDraft(currentUser.username, bookingId)
    if (id) {
      const staff = await involvedStaffService.save(id, currentUser)
      logger.info(`Submitting report for user: ${currentUser.username} and booking: ${bookingId}`)
      await incidentClient.submitReport(currentUser.username, bookingId)

      // Always ensure report is persisted before sending out notifications
      await incidentClient.commitAndStartNewTransaction()

      await requestStatements(currentUser, incidentDate, staff)

      return id
    }
    return false
  }

  return {
    getCurrentDraft,
    isDraftComplete,
    update,
    submit,
    getReportStatus,
  }
}
