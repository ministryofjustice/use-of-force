const moment = require('moment')
const logger = require('../../log.js')
const { ReportStatus } = require('../config/types')

/**
 * @param {object} args
 * @param {any} args.incidentClient
 * @param {import('../types/uof').UserService} args.userService
 * @param {any} args.statementsClient
 * @param {any} args.db
 */
module.exports = function createReportService({ incidentClient, statementsClient, userService, db }) {
  const getDraftInvolvedStaff = reportId => incidentClient.getDraftInvolvedStaff(reportId)

  const removeMissingDraftInvolvedStaff = async (userId, bookingId) => {
    const { id, form = {} } = await incidentClient.getCurrentDraftReport(userId, bookingId)

    const { incidentDetails = {} } = form
    const { involvedStaff = [] } = incidentDetails
    const updatedInvolvedStaff = involvedStaff.filter(staff => !staff.missing)

    const updatedFormObject = {
      ...form,
      incidentDetails: { ...incidentDetails, involvedStaff: updatedInvolvedStaff },
    }
    await incidentClient.updateDraftReport(id, null, updatedFormObject)
  }

  const getInvolvedStaff = reportId => incidentClient.getInvolvedStaff(reportId)

  async function lookup(token, usernames) {
    return userService.getUsers(token, usernames)
  }

  const loadUser = async (token, username) => {
    const results = await userService.getUsers(token, [username])

    if (!results || results[0].missing) {
      throw new Error(`Could not retrieve user details for missing user: '${username}'`)
    }
    const [user] = results
    logger.info('Found user:', user)
    return user
  }

  const getStaffRequiringStatements = async (currentUser, addedStaff) => {
    const userAlreadyAdded = addedStaff.find(user => currentUser.username === user.username)
    if (userAlreadyAdded) {
      return addedStaff
    }
    // Current user hasn't added themselves, so add them to the list.
    const foundUser = await loadUser(currentUser.token, currentUser.username)

    return [...addedStaff, foundUser]
  }

  const save = async (reportId, reportSubmittedDate, overdueDate, currentUser, client) => {
    const involvedStaff = await getDraftInvolvedStaff(reportId)

    const staffToCreateStatmentsFor = await getStaffRequiringStatements(currentUser, involvedStaff)

    const staff = staffToCreateStatmentsFor.map(user => ({
      staffId: user.staffId,
      userId: user.username,
      name: user.name,
      email: user.email,
    }))

    const firstReminderDate = moment(reportSubmittedDate).add(1, 'day')
    const userIdsToStatementIds = await statementsClient.createStatements({
      reportId,
      firstReminder: firstReminderDate.toDate(),
      overdueDate: overdueDate.toDate(),
      staff,
      client,
    })
    return staff.map(staffMember => ({ ...staffMember, statementId: userIdsToStatementIds[staffMember.userId] }))
  }

  const addInvolvedStaff = async (token, reportId, username) => {
    logger.info(`Adding involved staff with username: ${username} to report: '${reportId}'`)
    const foundUser = await loadUser(token, username)
    logger.info(`found staff: '${foundUser}'`)

    const report = await incidentClient.getReportForReviewer(reportId)
    if (!report) {
      throw new Error(`Report: '${reportId}' does not exist`)
    }

    if (await statementsClient.isStatementPresentForUser(reportId, username)) {
      throw new Error(`Staff member already exists: '${username}' on report: '${reportId}'`)
    }

    await db.inTransaction(async client => {
      await statementsClient.createStatements({
        reportId,
        firstReminder: null,
        overdueDate: moment(report.submittedDate)
          .add(3, 'day')
          .toDate(),
        staff: [
          {
            staffId: foundUser.staffId,
            userId: foundUser.username,
            name: foundUser.name,
            email: foundUser.email,
          },
        ],
        client,
      })

      if (report.status === ReportStatus.COMPLETE.value) {
        logger.info(`There are now pending statements on : ${reportId}, moving from 'COMPLETE' to 'SUBMITTED'`)
        await incidentClient.changeStatus(reportId, ReportStatus.COMPLETE, ReportStatus.SUBMITTED, client)
      }
    })
  }

  return {
    getInvolvedStaff,
    removeMissingDraftInvolvedStaff,
    getDraftInvolvedStaff,
    addInvolvedStaff,
    save,
    lookup,
  }
}
