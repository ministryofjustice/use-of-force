const { AddStaffResult } = require('../services/involvedStaffService')
const { firstItem } = require('../utils/utils')

module.exports = function Index({ reportService, involvedStaffService, reviewService, offenderService, systemToken }) {
  return {
    viewAddInvolvedStaff: async (req, res) => {
      const { reportId } = req.params

      const errors = req.flash('errors')
      const data = { incidentId: reportId }

      res.render('pages/coordinator/add-involved-staff/add-involved-staff.html', { errors, data })
    },

    submitAddInvolvedStaff: async (req, res) => {
      const {
        params: { reportId },
        body: { username },
      } = req

      if (!username.trim()) {
        req.flash('errors', [{ href: '#username', text: "Enter a staff member's username" }])
        return res.redirect(`/coordinator/report/${reportId}/add-staff`)
      }

      const result = await involvedStaffService.addInvolvedStaff(
        await systemToken(res.locals.user.username),
        reportId,
        username
      )

      req.flash('username', username.toUpperCase())
      return res.redirect(`/coordinator/report/${reportId}/add-staff/result/${result}`)
    },

    viewAddInvolvedStaffResult: async (req, res) => {
      const { reportId, result } = req.params
      const username = firstItem(req.flash('username'))

      const knownResult = Object.values(AddStaffResult).some(knownValue => knownValue === result)

      if (!username || !knownResult || result === AddStaffResult.SUCCESS) {
        return res.redirect(`/${reportId}/view-report`)
      }

      if ([AddStaffResult.SUCCESS_UNVERIFIED, AddStaffResult.ALREADY_EXISTS].includes(result)) {
        const user = await involvedStaffService.loadInvolvedStaffByUsername(reportId, username)
        return res.render(`pages/coordinator/add-involved-staff/${result}.html`, {
          reportId,
          username,
          name: user.name,
        })
      }

      return res.render(`pages/coordinator/add-involved-staff/${result}.html`, { reportId, username })
    },

    confirmDeleteReport: async (req, res) => {
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
      const { reportId } = req.params
      const { confirm } = req.body

      if (!confirm) {
        req.flash('errors', [{ href: '#confirm', text: 'Select yes if you want to delete this report' }])
        return res.redirect(`/coordinator/report/${reportId}/confirm-delete`)
      }

      const report = await reviewService.getReport(reportId)
      const referringPage = report.status === 'SUBMITTED' ? '/not-completed-incidents' : '/completed-incidents'

      if (confirm === 'yes') {
        await reportService.deleteReport(res.locals.user.username, reportId)
      }

      return res.redirect(referringPage)
    },

    confirmDeleteStatement: async (req, res) => {
      const { reportId, statementId } = req.params

      const staffMember = await involvedStaffService.loadInvolvedStaff(reportId, parseInt(statementId, 10))

      const errors = req.flash('errors')

      const data = { reportId, statementId, displayName: staffMember.name }

      res.render('pages/coordinator/confirm-statement-deletion.html', { errors, data })
    },

    deleteStatement: async (req, res) => {
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
