const moment = require('moment')
const logger = require('../../log.js')
const { ReportStatus } = require('../config/types')

const AddStaffResult = {
  SUCCESS: 'success',
  SUCCESS_UNVERIFIED: 'unverified',
  MISSING: 'missing',
  ALREADY_EXISTS: 'already-exists',
}

module.exports = {
  AddStaffResult,
  /**
   * @param {object} args
   * @param {any} args.incidentClient
   * @param {import('../types/uof').UserService} args.userService
   * @param {any} args.statementsClient
   * @param {any} args.db
   */
  createInvolvedStaffService: ({ incidentClient, statementsClient, userService, db }) => {
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

    const loadInvolvedStaff = async (reportId, statementId) => {
      const involvedStaff = await incidentClient.getInvolvedStaff(reportId)
      const found = involvedStaff.find(staff => staff.statementId === statementId)
      if (!found) {
        throw new Error(`Staff with id: ${statementId}, does not exist on report: '${reportId}'`)
      }
      return found
    }

    const loadInvolvedStaffByUsername = async (reportId, username) => {
      const involvedStaff = await incidentClient.getInvolvedStaff(reportId)
      const found = involvedStaff.find(staff => staff.userId === username)
      if (!found) {
        throw new Error(`Staff with username: ${username}, does not exist on report: '${reportId}'`)
      }
      return found
    }

    async function lookup(token, usernames) {
      return userService.getUsers(token, usernames)
    }

    const getStaffRequiringStatements = async (currentUser, addedStaff) => {
      const userAlreadyAdded = addedStaff.find(user => currentUser.username === user.username)
      if (userAlreadyAdded) {
        return addedStaff
      }
      // Current user hasn't added themselves, so add them to the list.
      const [foundUser] = await userService.getUsers(currentUser.token, [currentUser.username])

      if (!foundUser || foundUser.missing) {
        throw new Error(`Could not retrieve user details for current user: '${currentUser.username}'`)
      }

      logger.info('Found user:', foundUser)
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

      const [foundUser] = await userService.getUsers(token, [username])

      if (!foundUser || foundUser.missing) {
        return AddStaffResult.MISSING
      }

      logger.info(`found staff: '${foundUser}'`)

      const report = await incidentClient.getReportForReviewer(reportId)
      if (!report) {
        throw new Error(`Report: '${reportId}' does not exist`)
      }

      if (await statementsClient.isStatementPresentForUser(reportId, username)) {
        return AddStaffResult.ALREADY_EXISTS
      }

      return db.inTransaction(async client => {
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
        return foundUser.verified ? AddStaffResult.SUCCESS : AddStaffResult.SUCCESS_UNVERIFIED
      })
    }

    const removeInvolvedStaff = async (reportId, statementId) => {
      logger.info(`Removing statement: ${statementId} from report: ${reportId}`)

      await db.inTransaction(async client => {
        const pendingStatementBeforeDeletion = await statementsClient.getNumberOfPendingStatements(reportId, client)

        await statementsClient.deleteStatement({
          statementId,
          client,
        })

        if (pendingStatementBeforeDeletion !== 0) {
          const pendingStatementCount = await statementsClient.getNumberOfPendingStatements(reportId, client)

          if (pendingStatementCount === 0) {
            logger.info(`All statements complete on : ${reportId}, marking as complete`)
            await incidentClient.changeStatus(reportId, ReportStatus.SUBMITTED, ReportStatus.COMPLETE, client)
          }
        }
      })
    }

    return {
      getInvolvedStaff,
      loadInvolvedStaff,
      loadInvolvedStaffByUsername,
      removeMissingDraftInvolvedStaff,
      getDraftInvolvedStaff,
      addInvolvedStaff,
      removeInvolvedStaff,
      save,
      lookup,
    }
  },
}
