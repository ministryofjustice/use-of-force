module.exports = function ReportUseOfForceRoutes({ draftReportService, offenderService, systemToken }) {
  return {
    view: async (req, res) => {
      const { bookingId } = req.params
      const { form = {} } = await draftReportService.getCurrentDraft(req.user.username, bookingId)
      const status = draftReportService.getReportStatus(form)
      const { displayName, offenderNo, dateOfBirth } = await offenderService.getOffenderDetails(
        await systemToken(res.locals.user.username),
        bookingId
      )
      res.render('pages/report-use-of-force', {
        data: { ...res.locals.formObject, displayName, offenderNo, dateOfBirth },
        bookingId: req.params.bookingId,
        status,
      })
    },
  }
}
