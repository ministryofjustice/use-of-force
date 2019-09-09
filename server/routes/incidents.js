const { ReportStatus } = require('../config/types')
const { links } = require('../config.js')

module.exports = function CreateReportRoutes({ reportService, offenderService }) {
  const getOffenderNames = (token, incidents) => {
    const offenderNos = incidents.map(incident => incident.offenderNo)
    return offenderService.getOffenderNames(token, offenderNos)
  }

  const toReport = namesByOffenderNumber => incident => ({
    id: incident.id,
    bookingId: incident.bookingId,
    incidentdate: incident.incidentDate,
    staffMemberName: incident.reporterName,
    offenderName: namesByOffenderNumber[incident.offenderNo],
  })

  return {
    redirectToHomePage: async (req, res) => {
      res.redirect('/my-statements')
    },

    viewReportSent: async (req, res) => {
      res.render('pages/report-sent', { data: res.locals.formObject, reportId: req.params.reportId, links })
    },

    viewMyReports: async (req, res) => {
      const awaiting = await reportService.getReports(req.user.username, ReportStatus.IN_PROGRESS)
      const completed = await reportService.getReports(req.user.username, ReportStatus.SUBMITTED)

      const namesByOffenderNumber = await getOffenderNames(res.locals.user.token, [...awaiting, ...completed])
      const awaitingReports = awaiting.map(toReport(namesByOffenderNumber))
      const completedReports = completed.map(toReport(namesByOffenderNumber))

      res.render('pages/my-reports', {
        awaitingReports,
        completedReports,
        selectedTab: 'my-reports',
      })
    },
  }
}
