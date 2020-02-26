const { properCaseFullName } = require('../utils/utils')
const reportSummary = require('./model/reportSummary')

module.exports = function CheckAnswerRoutes({ reportService, offenderService, involvedStaffService, systemToken }) {
  const currentUserIfNotPresent = (involvedStaff, currentUser) =>
    involvedStaff.find(staff => staff.username === currentUser.username)
      ? []
      : [[`${currentUser.displayName} - ${currentUser.username}`]]

  return {
    view: async (req, res) => {
      const { bookingId } = req.params

      const { id, form = {}, incidentDate } = await reportService.getCurrentDraft(req.user.username, bookingId)

      const { complete } = reportService.getReportStatus(form)

      if (!complete) {
        // User should not be on this page if form is not complete.
        return res.redirect(`/`)
      }

      const offenderDetail = await offenderService.getOffenderDetails(
        await systemToken(res.locals.user.username),
        parseInt(bookingId, 10)
      )

      const { description: locationDescription = '' } = await offenderService.getLocation(
        await systemToken(res.locals.user.username),
        form.incidentDetails.locationId
      )

      const involvedStaff = await involvedStaffService.getDraftInvolvedStaff(id)

      const involvedStaffNames = [
        ...currentUserIfNotPresent(involvedStaff, res.locals.user),
        ...involvedStaff.map(staff => [`${properCaseFullName(staff.name)} - ${staff.username}`]),
      ]

      const data = reportSummary(form, offenderDetail, locationDescription, involvedStaffNames, incidentDate)

      return res.render('pages/check-your-answers', { data, bookingId })
    },

    submit: async (req, res) => {
      const { bookingId } = req.params

      if (!reportService.isDraftComplete(req.user.username, bookingId)) {
        throw new Error('Report is not complete')
      }

      const reportId = await reportService.submit(res.locals.user, bookingId)
      const location = reportId ? `/${reportId}/report-sent` : `/`
      return res.redirect(location)
    },
  }
}
