module.exports = function createReportService({ userService }) {
  async function getInvolvedStaff(token, staffUserNames) {
    if (!staffUserNames.length) {
      return { additionalFields: {}, additionalErrors: [] }
    }

    const { exist, missing = [], notVerified = [], success } = await userService.getUsers(token, staffUserNames)

    if (success) {
      const involvedStaff = exist.sort(({ i }, { i: j }) => i - j)
      return { additionalFields: { involvedStaff }, additionalErrors: [] }
    }

    const missingErrors = missing.map(staff => ({
      text: `User with name '${staff.username}' does not have a new nomis account`,
      href: `#involved[${staff.i}][username]`,
      i: staff.i,
    }))

    const notVerifiedErrors = notVerified.map(staff => ({
      text: `User with name '${staff.username}' has not verified their email address`,
      href: `#involved[${staff.i}][username]`,
      i: staff.i,
    }))

    const additionalErrors = [...missingErrors, ...notVerifiedErrors]
      .sort(({ i }, { i: j }) => i - j)
      .map(({ i, ...error }) => error)

    return { additionalFields: {}, additionalErrors }
  }

  return {
    getInvolvedStaff,
  }
}
