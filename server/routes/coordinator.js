const httpError = require('http-errors')

module.exports = function Index({ reportService, involvedStaffService, reviewService, offenderService, systemToken }) {
  /**
   * TODO: integrate this into the app properly once we have designs and time.
   * This is currently a GET to get around CSRF issues and to allow access via a browser using current authenticated session :-/
   */
  return {
    addInvolvedStaff: async (req, res) => {
      if (!res.locals.user.isCoordinator) {
        throw httpError(401, 'Not authorised to access this resource')
      }

      const { reportId, username } = req.params

      await involvedStaffService.addInvolvedStaff(await systemToken(res.locals.user.username), reportId, username)
      res.json({ result: 'ok' })
    },

    deleteConfirm: async (req, res) => {
      if (!res.locals.user.isCoordinator) {
        throw httpError(401, 'Not authorised to access this resource')
      }

      const { reportId } = req.params

      const errors = req.flash('errors')
      const report = await reviewService.getReport(reportId)

      const { bookingId, reporterName, submittedDate } = report
      const offenderDetail = await offenderService.getOffenderDetails(
        await systemToken(res.locals.user.username),
        bookingId
      )
      const data = { reportId, reporterName, submittedDate, offenderDetail }

      res.render('pages/coordinator/confirm-deletion.html', { errors, data })
    },

    deleteReport: async (req, res) => {
      if (!res.locals.user.isCoordinator) {
        throw httpError(401, 'Not authorised to access this resource')
      }

      const { reportId } = req.params
      const { confirm } = req.body

      if (!confirm) {
        req.flash('errors', [{ href: '#confirm', text: 'Select yes if you want to delete this report' }])
        return res.redirect(`/coordinator/report/${reportId}/confirm-delete`)
      }

      if (confirm === 'yes') {
        await reportService.deleteReport(res.locals.user.username, reportId)
      }

      return res.redirect('/')
    },
  }
}
