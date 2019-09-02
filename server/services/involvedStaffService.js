module.exports = function createReportService({ incidentClient, userService }) {
  const get = reportId => {
    return incidentClient.getInvolvedStaff(reportId)
  }

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

    if (success) {
      const involvedStaff = exist
        .sort(({ i }, { i: j }) => i - j)
        .map(user => {
          const { name, email, staffId, username } = user
          return { name, email, staffId, username }
        })
      return {
        additionalFields: { involvedStaff },
        additionalErrors: [],
      }
    }

    return { additionalFields: {}, additionalErrors: getAdditionalErrors(missing, notVerified) }
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

  const save = async (reportId, currentUser) => {
    const involvedStaff = await get(reportId)

    const staffToCreateStatmentsFor = await getStaffRequiringStatements(currentUser, involvedStaff)

    const staff = staffToCreateStatmentsFor.map(user => ({
      staffId: user.staffId,
      userId: user.username,
      name: user.name,
      email: user.email,
    }))

    await incidentClient.createStatements(reportId, staff)
    return staff
  }

  const getAdditionalErrors = (missing, notVerified) => {
    const missingErrors = buildErrors(
      missing,
      username => `User with name '${username}' does not have a new nomis account`
    )

    const notVerifiedErrors = buildErrors(
      notVerified,
      username => `User with name '${username}' has not verified their email address`
    )

    return [...missingErrors, ...notVerifiedErrors].sort(({ i }, { i: j }) => i - j).map(({ i, ...error }) => error)
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
    get,
    save,
    lookup,
  }
}
