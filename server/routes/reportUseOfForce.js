module.exports = function ReportUseOfForceRoutes({ reportService, offenderService }) {
  return {
    view: async (req, res) => {
      const { bookingId } = req.params
      const { displayName, offenderNo, dateOfBirth } = await offenderService.getOffenderDetailsForUser(
        res.locals.user.token,
        bookingId
      )
      const { form = {} } = await reportService.getCurrentDraft(req.user.username, bookingId)
      const status = reportService.getReportStatus(form)

      res.render('pages/report-use-of-force', {
        data: { ...res.locals.formObject, displayName, offenderNo, dateOfBirth },
        bookingId: req.params.bookingId,
        status,
      })
    },
  }
}
