module.exports = function createReportService({ incidentClient, userService }) {
  const get = reportId => {
    return incidentClient.getInvolvedStaff(reportId)
  }

  const update = async (reportId, involvedStaff = []) => {
    await incidentClient.deleteInvolvedStaff(reportId)
    if (involvedStaff.length) {
      const staff = involvedStaff.map(user => ({
        userId: user.username,
        name: user.name,
        email: user.email,
      }))
      await incidentClient.insertInvolvedStaff(reportId, staff)
    }
  }

  async function lookup(token, usernames) {
    if (!usernames.length) {
      return {
        additionalFields: { involvedStaff: [] },
        additionalErrors: [],
      }
    }

    // Could possibly replace this info with a sanitisation step
    const duplicates = getDuplicates(usernames)
    if (duplicates.length) {
      return {
        additionalFields: {},
        additionalErrors: buildErrors(duplicates, username => `User with name '${username}' has already been added`),
      }
    }

    const { exist = [], missing = [], notVerified = [], success } = await userService.getUsers(token, usernames)

    if (success) {
      const involvedStaff = exist.sort(({ i }, { i: j }) => i - j)
      return {
        additionalFields: { involvedStaff },
        additionalErrors: [],
      }
    }

    return { additionalFields: {}, additionalErrors: getAdditionalErrors(missing, notVerified) }
  }

  const addCurrentUser = async (reportId, currentUser) => {
    const involvedStaff = await get(reportId)

    if (involvedStaff.find(user => currentUser.username === user.username)) {
      // user has already been added, so nothing left to do
      return
    }

    // If current user hasn't added themselves, then add them to the list.
    const { exist, success, missing, notVerified } = await userService.getUsers(currentUser.token, [
      currentUser.username,
    ])

    if (!success) {
      throw new Error(
        `Could not retrieve user details for ${currentUser.username}, missing: '${missing}', not verified; ${notVerified}`
      )
    }

    await update(reportId, [...involvedStaff, ...exist])
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
      href: `#involved[${staff.i}][username]`,
      i: staff.i,
    }))

  return {
    get,
    update,
    lookup,
    addCurrentUser,
  }
}
