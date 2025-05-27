import { RequestHandler } from 'express'
import type ReportService from '../../services/reportService'
import type ReportDataBuilder from '../../services/reportDetailBuilder'

export default class IncidentsRoutes {
  constructor(private readonly reportService: ReportService, private readonly reportDetailBuilder: ReportDataBuilder) {}

  redirectToHomePage: RequestHandler = async (req, res): Promise<void> => {
    const location = res.locals.user.isReviewer ? '/not-completed-incidents' : '/your-statements'
    res.redirect(location)
  }

  viewYourReports: RequestHandler = async (req, res): Promise<void> => {
    const page = parseInt(req.query.page as string, 10) || 1
    const { items: reports, metaData: pageData } = await this.reportService.getReports(req.user.username, page)

    res.render('pages/your-reports', {
      reports,
      pageData,
      selectedTab: 'your-reports',
    })
  }

  viewYourReport: RequestHandler = async (req, res) => {
    const { reportId } = req.params
    const report = await this.reportService.getReport(req.user.username, parseInt(reportId, 10))

    const data = await this.reportDetailBuilder.build(res.locals.user.username, report)

    const reportEdits = await this.reportService.getReportEdits(parseInt(reportId, 10))

    const hasReportBeenEdited = reportEdits?.length > 0

    const lastEdit = hasReportBeenEdited ? reportEdits.at(-1) : null

    const newReportOwners = reportEdits?.filter(edit => edit.reportOwnerChanged)

    const hasReportOwnerChanged = newReportOwners?.length > 0

    const reportOwner = newReportOwners?.at(-1)

    const dataWithEdits = { ...data, hasReportBeenEdited, lastEdit, hasReportOwnerChanged, reportOwner }

    return res.render('pages/your-report', { data: dataWithEdits })
  }
}
