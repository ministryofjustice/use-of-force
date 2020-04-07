const { isNilOrEmpty } = require('../utils/utils')
const { links } = require('../config.js')

module.exports = function ReportUseOfForceRoutes({ reportService, offenderService, systemToken }) {
  return {
    view: async (req, res) => {
      const { bookingId } = req.params
      const { id: formId, form = {} } = await reportService.getCurrentDraft(req.user.username, bookingId)
      const status = reportService.getReportStatus(form)
      const { displayName, offenderNo, dateOfBirth } = await offenderService.getOffenderDetails(
        isNilOrEmpty(formId) ? res.locals.user.token : await systemToken(res.locals.user.username),
        bookingId
      )
      res.render('pages/report-use-of-force', {
        data: { ...res.locals.formObject, displayName, offenderNo, dateOfBirth },
        bookingId: req.params.bookingId,
        status,
        links,
      })
    },
  }
}
