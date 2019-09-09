const moment = require('moment')
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
    const { form = {} } = await getCurrentDraft(username, bookingId)
    const { complete } = getReportStatus(form)
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
    const staffExcludingReporter = staffMembers.filter(staff => staff.userId !== currentUser.username)
    return staffExcludingReporter.map(staff =>
      notificationService.sendStatementRequest(staff.email, {
        involvedName: staff.name,
        reporterName: currentUser.displayName,
        incidentDate,
      })
    )
  }

  async function submit(currentUser, bookingId, now = moment()) {
    const { id, incidentDate } = await getCurrentDraft(currentUser.username, bookingId)
    if (id) {
      const reportSubmittedDate = now
      const staff = await involvedStaffService.save(id, reportSubmittedDate, currentUser)
      logger.info(`Submitting report for user: ${currentUser.username} and booking: ${bookingId}`)
      await incidentClient.submitReport(currentUser.username, bookingId, reportSubmittedDate.toDate())

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
