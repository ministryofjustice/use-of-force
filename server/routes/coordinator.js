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

    confirmDeleteReport: async (req, res) => {
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
      const data = { incidentId: reportId, reporterName, submittedDate, offenderDetail }

      res.render('pages/coordinator/confirm-report-deletion.html', { errors, data })
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

    confirmDeleteStatement: async (req, res) => {
      if (!res.locals.user.isCoordinator) {
        throw httpError(401, 'Not authorised to access this resource')
      }

      const { reportId, statementId } = req.params

      const staffMember = await involvedStaffService.loadInvolvedStaff(reportId, parseInt(statementId, 10))

      const errors = req.flash('errors')

      const data = { reportId, statementId, displayName: staffMember.name }

      res.render('pages/coordinator/confirm-statement-deletion.html', { errors, data })
    },

    deleteStatement: async (req, res) => {
      if (!res.locals.user.isCoordinator) {
        throw httpError(401, 'Not authorised to access this resource')
      }

      const { reportId, statementId } = req.params
      const { confirm } = req.body

      if (!confirm) {
        req.flash('errors', [{ href: '#confirm', text: 'Select yes if you want to delete this statement' }])
        return res.redirect(`/coordinator/report/${reportId}/statement/${statementId}/confirm-delete`)
      }

      if (confirm === 'yes') {
        await involvedStaffService.removeInvolvedStaff(reportId, statementId)
      }

      return res.redirect(`/${reportId}/view-report`)
    },
  }
}
