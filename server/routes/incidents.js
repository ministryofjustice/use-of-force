const { ReportStatus } = require('../config/types')

module.exports = function CreateIncidentRoutes({ reportService, offenderService, reportDetailBuilder, systemToken }) {
  const getOffenderNames = (token, incidents) => {
    const offenderNos = incidents.map(incident => incident.offenderNo)
    return offenderService.getOffenderNames(token, offenderNos)
  }

  const toReport = namesByOffenderNumber => incident => ({
    id: incident.id,
    bookingId: incident.bookingId,
    incidentdate: incident.incidentDate,
    staffMemberName: incident.reporterName,
    isOverdue: incident.isOverdue,
    offenderName: namesByOffenderNumber[incident.offenderNo],
    offenderNo: incident.offenderNo,
  })

  return {
    redirectToHomePage: async (req, res) => {
      const location = res.locals.user.isReviewer ? '/all-incidents' : '/your-statements'
      res.redirect(location)
    },

    viewReportSent: async (req, res) => {
      res.render('pages/report-sent', { data: res.locals.formObject, reportId: req.params.reportId })
    },

    viewYourReports: async (req, res) => {
      const awaiting = await reportService.getReports(req.user.username, [ReportStatus.IN_PROGRESS])
      const completed = await reportService.getReports(
        req.user.username,
        [ReportStatus.SUBMITTED, ReportStatus.COMPLETE],
        {
          orderByDescDate: true,
        }
      )

      const namesByOffenderNumber = await getOffenderNames(await systemToken(res.locals.user.username), [
        ...awaiting,
        ...completed,
      ])
      const awaitingReports = awaiting.map(toReport(namesByOffenderNumber))
      const completedReports = completed.map(toReport(namesByOffenderNumber))

      res.render('pages/your-reports', {
        awaitingReports,
        completedReports,
        selectedTab: 'your-reports',
      })
    },

    viewYourReport: async (req, res) => {
      const { reportId } = req.params
      const report = await reportService.getReport(req.user.username, reportId)

      const data = await reportDetailBuilder.build(res.locals.user.username, report)

      return res.render('pages/your-report', { data })
    },
  }
}
