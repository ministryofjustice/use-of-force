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
  const getCurrentDraft = (userId, bookingId) => incidentClient.getCurrentDraftReport(userId, bookingId)

  const getReport = (userId, reportId) => incidentClient.getReport(userId, reportId)

  async function getReports(userId, status) {
    const result = await incidentClient.getReports(userId, status)
    return result.rows
  }

  async function isDraftComplete(username, bookingId) {
    const { form = {} } = await getCurrentDraft(username, bookingId)
    const { complete } = getReportStatus(form)
    return complete
  }

  async function update({ currentUser, formId, bookingId, formObject, incidentDate }) {
    const { username: userId, token, displayName: reporterName } = currentUser
    const incidentDateValue = incidentDate ? incidentDate.value : null
    const formValue = !isNilOrEmpty(formObject) ? formObject : null
    if (formId) {
      if (incidentDateValue || formValue) {
        logger.info(`Updated report with id: ${formId} for user: ${userId} on booking: ${bookingId}`)
        await incidentClient.updateDraftReport(formId, incidentDateValue, formValue)
      }
      return formId
    }
    const elite2Client = elite2ClientBuilder(token)
    const { offenderNo, agencyId } = await elite2Client.getOffenderDetails(bookingId)
    const id = await incidentClient.createDraftReport({
      userId,
      reporterName,
      bookingId,
      agencyId,
      offenderNo,
      incidentDate: incidentDateValue,
      formResponse: formObject,
    })
    logger.info(`Created new report with id: ${id} for user: ${userId} on booking: ${bookingId}`)
    return id
  }

  const requestStatements = ({ reportId, currentUser, incidentDate, overdueDate, submittedDate, staffMembers }) => {
    const staffExcludingReporter = staffMembers.filter(staff => staff.userId !== currentUser.username)
    return staffExcludingReporter.map(staff =>
      notificationService.sendStatementRequest(
        staff.email,
        {
          involvedName: staff.name,
          reporterName: currentUser.displayName,
          incidentDate,
          overdueDate,
          submittedDate,
        },
        { reportId, statementId: staff.statementId }
      )
    )
  }

  async function submit(currentUser, bookingId, now = moment()) {
    const { id, incidentDate } = await getCurrentDraft(currentUser.username, bookingId)
    if (id) {
      const reportSubmittedDate = now
      const overdueDate = moment(reportSubmittedDate).add(3, 'days')

      const staff = await involvedStaffService.save(id, reportSubmittedDate, overdueDate, currentUser)
      logger.info(`Submitting report for user: ${currentUser.username} and booking: ${bookingId}`)
      await incidentClient.submitReport(currentUser.username, bookingId, reportSubmittedDate.toDate())

      // Always ensure report is persisted before sending out notifications
      await incidentClient.commitAndStartNewTransaction()

      await requestStatements({
        reportId: id,
        currentUser,
        incidentDate,
        overdueDate,
        submittedDate: reportSubmittedDate,
        staffMembers: staff,
      })

      return id
    }
    return false
  }

  return {
    getReport,
    getReports,
    getCurrentDraft,
    isDraftComplete,
    update,
    submit,
    getReportStatus,
  }
}
