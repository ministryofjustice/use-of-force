import type ReportService from '../services/reportService'
import ReportDataBuilder from '../services/reportDetailBuilder'

export default function CreateIncidentRoutes(reportService: ReportService, reportDetailBuilder: ReportDataBuilder) {
  return {
    redirectToHomePage: async (req, res) => {
      const location = res.locals.user.isReviewer ? '/all-incidents' : '/your-statements'
      res.redirect(location)
    },

    viewReportSent: async (req, res) => {
      res.render('pages/report-sent', { data: res.locals.formObject, reportId: req.params.reportId })
    },

    viewYourReports: async (req, res) => {
      const reports = await reportService.getReports(req.user.username)

      res.render('pages/your-reports', {
        reports,
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
