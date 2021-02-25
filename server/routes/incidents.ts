import type ReportService from '../services/drafts/draftReportService'
import ReportDataBuilder from '../services/reportDetailBuilder'

export default function CreateIncidentRoutes(reportService: ReportService, reportDetailBuilder: ReportDataBuilder) {
  return {
    redirectToHomePage: async (req, res) => {
      const location = res.locals.user.isReviewer ? '/not-completed-incidents' : '/your-statements'
      res.redirect(location)
    },

    viewReportSent: async (req, res) => {
      res.render('pages/report-sent', { data: res.locals.formObject, reportId: req.params.reportId })
    },

    viewYourReports: async (req, res) => {
      const page = parseInt(req.query.page, 10) || 1
      const { items: reports, metaData: pageData } = await reportService.getReports(req.user.username, page)

      res.render('pages/your-reports', {
        reports,
        pageData,
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
