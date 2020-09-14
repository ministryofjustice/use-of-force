const { properCaseFullName } = require('../utils/utils')
const reportSummary = require('./model/reportSummary')

module.exports = function CheckAnswerRoutes({
  draftReportService,
  offenderService,
  involvedStaffService,
  systemToken,
  locationService,
}) {
  const currentUserIfNotPresent = (involvedStaff, currentUser) =>
    involvedStaff.find(staff => staff.username === currentUser.username)
      ? []
      : [{ name: currentUser.displayName, username: currentUser.username }]

  return {
    view: async (req, res) => {
      const { bookingId } = req.params
      const { id, form = {}, incidentDate, agencyId: prisonId } = await draftReportService.getCurrentDraft(
        req.user.username,
        bookingId
      )
      const { complete } = draftReportService.getReportStatus(form)

      if (!complete) {
        // User should not be on this page if form is not complete.
        return res.redirect(`/`)
      }

      const offenderDetail = await offenderService.getOffenderDetails(
        await systemToken(res.locals.user.username),
        parseInt(bookingId, 10)
      )

      const { description: locationDescription = '' } = await locationService.getLocation(
        await systemToken(res.locals.user.username),
        form.incidentDetails.locationId
      )

      const draftInvolvedStaff = await involvedStaffService.getDraftInvolvedStaff(id)

      const involvedStaff = [
        ...currentUserIfNotPresent(draftInvolvedStaff, res.locals.user),
        ...draftInvolvedStaff.map(staff => ({ name: properCaseFullName(staff.name), username: staff.username })),
      ]

      const prison = await locationService.getPrisonById(await systemToken(res.locals.user.username), prisonId)

      const data = reportSummary(form, offenderDetail, prison, locationDescription, involvedStaff, incidentDate)

      return res.render('pages/check-your-answers', { data, bookingId })
    },

    submit: async (req, res) => {
      const { bookingId } = req.params

      if (!draftReportService.isDraftComplete(req.user.username, bookingId)) {
        throw new Error('Report is not complete')
      }

      const reportId = await draftReportService.submit(res.locals.user, bookingId)
      const location = reportId ? `/${reportId}/report-sent` : `/`
      return res.redirect(location)
    },
  }
}
