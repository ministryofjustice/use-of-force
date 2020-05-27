const moment = require('moment')
const logger = require('../../log.js')
const { isNilOrEmpty } = require('../utils/utils')
const { check: getReportStatus } = require('./reportStatusChecker')

module.exports = function createReportService({
  incidentClient,
  elite2ClientBuilder,
  involvedStaffService,
  notificationService,
  db,
}) {
  const getCurrentDraft = (userId, bookingId) => incidentClient.getCurrentDraftReport(userId, bookingId)

  const getReport = (userId, reportId) => incidentClient.getReport(userId, reportId)

  async function getReports(userId, status, opts) {
    const result = await incidentClient.getReports(userId, status, opts)
    return result.rows
  }

  async function isDraftComplete(username, bookingId) {
    const { form = {} } = await getCurrentDraft(username, bookingId)
    const { complete } = getReportStatus(form)
    return complete
  }

  async function update({ currentUser, formId, bookingId, formObject, incidentDate }) {
    const incidentDateValue = incidentDate ? incidentDate.value : null
    const formValue = !isNilOrEmpty(formObject) ? formObject : null

    return formId
      ? updateReport(formId, bookingId, currentUser, incidentDateValue, formValue)
      : startNewReport(bookingId, currentUser, incidentDateValue, formObject)
  }

  const updateAgencyId = async (agencyId, username, bookingId) => {
    logger.info('updating agencyId')
    await incidentClient.updateAgencyId(agencyId, username, bookingId)
  }

  const updateReport = async (formId, bookingId, currentUser, incidentDateValue, formValue) => {
    const { username: userId } = currentUser
    if (incidentDateValue || formValue) {
      logger.info(`Updated report with id: ${formId} for user: ${userId} on booking: ${bookingId}`)
      await incidentClient.updateDraftReport(formId, incidentDateValue, formValue)
    }
    return formId
  }

  const startNewReport = async (bookingId, currentUser, incidentDateValue, formObject) => {
    const { username: userId, token, displayName: reporterName } = currentUser

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
    const staffExcludingUnverified = staffExcludingReporter.filter(staff => staff.email)
    const notifications = staffExcludingUnverified.map(staff =>
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
    return Promise.all(notifications)
  }

  async function submit(currentUser, bookingId, now = moment()) {
    const { id, incidentDate } = await getCurrentDraft(currentUser.username, bookingId)
    if (id) {
      const reportSubmittedDate = now
      const overdueDate = moment(reportSubmittedDate).add(3, 'days')

      const staff = await db.inTransaction(async client => {
        const savedStaff = await involvedStaffService.save(id, reportSubmittedDate, overdueDate, currentUser, client)
        logger.info(`Submitting report for user: ${currentUser.username} and booking: ${bookingId}`)
        await incidentClient.submitReport(currentUser.username, bookingId, reportSubmittedDate.toDate(), client)
        return savedStaff
      })

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

  const deleteReport = async (username, reportId) => {
    logger.info(`User: ${username} is deleting report: '${reportId}'`)

    const report = await incidentClient.getReportForReviewer(reportId)
    if (!report) {
      throw new Error(`Report: '${reportId}' does not exist`)
    }

    await incidentClient.deleteReport(reportId)
  }

  return {
    getReport,
    getReports,
    getCurrentDraft,
    isDraftComplete,
    update,
    submit,
    deleteReport,
    getReportStatus,
    updateAgencyId,
  }
}
