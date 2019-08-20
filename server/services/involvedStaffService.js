module.exports = function createReportService({ userService }) {
  async function getInvolvedStaff(currentUser, usernames) {
    const duplicates = getDuplicates(usernames)
    if (duplicates.length) {
      return {
        additionalFields: {},
        additionalErrors: buildErrors(duplicates, username => `User with name '${username}' has already been added`),
      }
    }

    if (!usernames.length) {
      return {
        additionalFields: { involvedStaff: await involvedStaffWithCurrentUser(currentUser, []) },
        additionalErrors: [],
      }
    }

    const { exist = [], missing = [], notVerified = [], success } = await userService.getUsers(
      currentUser.token,
      usernames
    )

    if (success) {
      return {
        additionalFields: { involvedStaff: await involvedStaffWithCurrentUser(currentUser, exist) },
        additionalErrors: [],
      }
    }

    return { additionalFields: {}, additionalErrors: getAdditionalErrors(missing, notVerified) }
  }

  const involvedStaffWithCurrentUser = async (currentUser, staff) => {
    const involvedStaff = staff.sort(({ i }, { i: j }) => i - j)

    if (involvedStaff.find(user => currentUser.username === user.username)) {
      return involvedStaff
    }

    // If user hasn't added themselves, then add them to the list.
    const { exist, success, missing, notVerified } = await userService.getUsers(currentUser.token, [
      currentUser.username,
    ])

    if (!success) {
      throw new Error(
        `Could not retrieve user details for ${currentUser.username}, missing: '${missing}', not verified; ${notVerified}`
      )
    }
    return [...involvedStaff, ...exist]
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
    getInvolvedStaff,
  }
}
