import moment from 'moment'
import { Request, Response } from 'express'
import { removeKeysWithEmptyValues, parseDate } from '../../utils/utils'
import type ReportDataBuilder from '../../services/reportDetailBuilder'
import { ReportStatus } from '../../config/types'
import type { OffenderService, ReviewService } from '../../services'
import { SystemToken } from '../../types/uof'

export default class ReviewerRoutes {
  constructor(
    private readonly offenderService: OffenderService,
    private readonly reportDetailBuilder: ReportDataBuilder,
    private readonly reviewService: ReviewService,
    private readonly systemToken: SystemToken
  ) {}

  viewNotCompletedIncidents = async (req: Request, res: Response): Promise<void> => {
    const reports = await this.reviewService.getIncompleteReports(
      res.locals.user.username,
      res.locals.user.activeCaseLoadId
    )
    return res.render('pages/not-completed-incidents', {
      reports,
      selectedTab: 'not-completed',
    })
  }

  viewCompletedIncidents = async (req: Request, res: Response): Promise<void> => {
    const { prisonerName, prisonNumber, reporter, dateFrom, dateTo } = req.query
    const page = parseInt(req.query.page as string, 10) || 1

    const query = removeKeysWithEmptyValues({
      prisonerName,
      prisonNumber,
      reporter,
      dateFrom: dateFrom ? parseDate(dateFrom, 'DD/MM/YYYY') : null,
      dateTo: dateTo ? parseDate(dateTo, 'DD/MM/YYYY')?.endOf('day') : null,
    })

    const { items: reports, metaData: pageData } = await this.reviewService.getCompletedReports(
      res.locals.user.username,
      res.locals.user.activeCaseLoadId,
      query,
      page
    )
    return res.render('pages/completed-incidents', {
      reports,
      pageData,
      query,
      rawQuery: req.query,
      selectedTab: 'completed',
    })
  }

  reviewReport = async (req: Request, res: Response): Promise<void> => {
    const { reportId } = req.params

    const report = await this.reviewService.getReport(parseInt(reportId, 10))

    const data = await this.reportDetailBuilder.build(res.locals.user.username, report)

    return res.render('pages/reviewer/view-report', { data })
  }

  reviewStatements = async (req: Request, res: Response): Promise<void> => {
    const { reportId } = req.params
    const report = await this.reviewService.getReport(parseInt(reportId, 10))

    const { bookingId, reporterName, submittedDate } = report
    const offenderDetail = await this.offenderService.getOffenderDetails(
      await this.systemToken(res.locals.user.username),
      bookingId
    )

    const statements = await this.reviewService.getStatements(
      await this.systemToken(res.locals.user.username),
      parseInt(reportId, 10)
    )
    const tab = report.status === ReportStatus.SUBMITTED.value ? '/not-completed-incidents' : '/completed-incidents'

    const reportDataForPrint = await this.reportDetailBuilder.build(res.locals.user.username, report)

    return res.render('pages/reviewer/view-statements', {
      data: { incidentId: reportId, reporterName, submittedDate, offenderDetail, statements, tab },
      reportDataForPrint,
      statements: statements.filter(stmnt => stmnt.isSubmitted),
    })
  }

  reviewStatement = async (req: Request, res: Response): Promise<void> => {
    const { statementId } = req.params

    const statement = await this.reviewService.getStatement(
      await this.systemToken(res.locals.user.username),
      parseInt(statementId, 10)
    )

    const offenderDetail = await this.offenderService.getOffenderDetails(
      await this.systemToken(res.locals.user.username),
      statement.bookingId
    )
    const { displayName, offenderNo } = offenderDetail

    return res.render('pages/reviewer/view-statement', {
      data: {
        displayName,
        offenderNo,
        ...statement,
        lastTrainingMonth: moment.months(statement.lastTrainingMonth),
      },
    })
  }
}
