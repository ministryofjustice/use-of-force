const moment = require('moment')

module.exports = function createReportService({ incidentClient, statementsClient, userService }) {
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
    if (!usernames.length) {
      return {
        additionalFields: { involvedStaff: [] },
        additionalErrors: [],
      }
    }

    const duplicates = getDuplicates(usernames)
    if (duplicates.length) {
      return {
        additionalFields: {},
        additionalErrors: buildErrors(duplicates, username => `User with name '${username}' has already been added`),
      }
    }

    const { exist = [], missing = [], notVerified = [], success } = await userService.getUsers(token, usernames)

    if (!success) {
      return {
        additionalFields: {},
        additionalErrors: buildErrors(
          notVerified,
          username => `User with name '${username}' does not have an e-mail address`
        ),
      }
    }

    const existingStaff = exist.map(user => {
      const { i, name, email, staffId, username } = user
      return { i, name, email, staffId, username }
    })

    const missingStaff = missing.map(user => {
      const { i, username } = user
      return { i, username, missing: true }
    })

    const involvedStaff = [...existingStaff, ...missingStaff]
      .sort(({ i }, { i: j }) => i - j)
      .map(({ i, ...rest }) => rest)

    return {
      additionalFields: { involvedStaff },
      additionalErrors: [],
    }
  }

  const getStaffRequiringStatements = async (currentUser, addedStaff) => {
    const userAlreadyAdded = addedStaff.find(user => currentUser.username === user.username)
    if (userAlreadyAdded) {
      return addedStaff
    }
    // If current user hasn't added themselves, then add them to the list.
    const { success, exist = [], missing = [], notVerified = [] } = await userService.getUsers(currentUser.token, [
      currentUser.username,
    ])

    if (!success) {
      throw new Error(
        `Could not retrieve user details for '${currentUser.username}', missing: '${Boolean(
          missing.length
        )}', not verified: '${Boolean(notVerified.length)}'`
      )
    }

    return [...addedStaff, ...exist]
  }

  const save = async (reportId, reportSubmittedDate, overdueDate, currentUser) => {
    const involvedStaff = await getDraftInvolvedStaff(reportId)

    const staffToCreateStatmentsFor = await getStaffRequiringStatements(currentUser, involvedStaff)

    const staff = staffToCreateStatmentsFor.map(user => ({
      staffId: user.staffId,
      userId: user.username,
      name: user.name,
      email: user.email,
    }))

    const firstReminderDate = moment(reportSubmittedDate).add(1, 'day')
    await statementsClient.createStatements(reportId, firstReminderDate.toDate(), overdueDate.toDate(), staff)
    return staff
  }

  const getDuplicates = usernames => {
    const seen = []
    const duplicates = []
    usernames.forEach((username, i) => {
      if (seen.includes(username)) {
        duplicates.push({ username, i })
      }
      seen.push(username)
    })

    return duplicates
  }

  const buildErrors = (staffMembers, errorBuilder) =>
    staffMembers.map(staff => ({
      text: errorBuilder(staff.username),
      href: `#involvedStaff[${staff.i}][username]`,
      i: staff.i,
    }))

  return {
    getInvolvedStaff,
    removeMissingDraftInvolvedStaff,
    getDraftInvolvedStaff,
    save,
    lookup,
  }
}
