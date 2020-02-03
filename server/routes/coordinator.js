const httpError = require('http-errors')

module.exports = function Index({ reportService, involvedStaffService, systemToken }) {
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
      res.render('pages/coordinator/confirm-deletion.html', { reportId: req.params.reportId })
    },

    deleteReport: async (req, res) => {
      if (!res.locals.user.isCoordinator) {
        throw httpError(401, 'Not authorised to access this resource')
      }

      const { reportId } = req.params

      await reportService.deleteReport(res.locals.user.username, reportId)
      res.redirect('/')
    },
  }
}
