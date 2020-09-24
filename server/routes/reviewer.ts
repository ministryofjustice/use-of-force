import moment from 'moment'
import { Request, Response } from 'express'
import { removeKeysWithEmptyValues, parseDate } from '../utils/utils'
import { SystemToken } from '../types/uof'
import ReportDataBuilder from '../services/reportDetailBuilder'
import ReviewService from '../services/reviewService'
import { ReportStatus } from '../config/types'
import OffenderService from '../services/offenderService'

interface Params {
  offenderService: OffenderService
  reportDetailBuilder: ReportDataBuilder
  reviewService: ReviewService
  systemToken: SystemToken
}

export = function CreateReviewRoutes({ offenderService, reportDetailBuilder, reviewService, systemToken }: Params) {
  return {
    viewNotCompletedIncidents: async (req: Request, res: Response): Promise<void> => {
      const reports = await reviewService.getIncompleteReports(
        res.locals.user.username,
        res.locals.user.activeCaseLoadId
      )
      return res.render('pages/not-completed-incidents', {
        reports,
        selectedTab: 'not-completed',
      })
    },

    viewCompletedIncidents: async (req: Request, res: Response): Promise<void> => {
      const { prisonerName, prisonNumber, reporter, dateFrom, dateTo } = req.query
      const page = parseInt(req.query.page as string, 10) || 1

      const query = removeKeysWithEmptyValues({
        prisonerName,
        prisonNumber,
        reporter,
        dateFrom: dateFrom ? parseDate(dateFrom, 'D MMM YYYY') : null,
        dateTo: dateTo ? parseDate(dateTo, 'D MMM YYYY') : null,
      })

      const { items: reports, metaData: pageData } = await reviewService.getCompletedReports(
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
    },

    reviewReport: async (req: Request, res: Response): Promise<void> => {
      const { reportId } = req.params

      const report = await reviewService.getReport(parseInt(reportId, 10))

      const data = await reportDetailBuilder.build(res.locals.user.username, report)

      return res.render('pages/reviewer/view-report', { data })
    },

    reviewStatements: async (req: Request, res: Response): Promise<void> => {
      const { reportId } = req.params
      const report = await reviewService.getReport(parseInt(reportId, 10))

      const { bookingId, reporterName, submittedDate } = report
      const offenderDetail = await offenderService.getOffenderDetails(
        await systemToken(res.locals.user.username),
        bookingId
      )

      const statements = await reviewService.getStatements(
        await systemToken(res.locals.user.username),
        parseInt(reportId, 10)
      )
      const tab = report.status === ReportStatus.SUBMITTED.value ? '/not-completed-incidents' : '/completed-incidents'

      const data = { incidentId: reportId, reporterName, submittedDate, offenderDetail, statements, tab }

      const reportDataForPrint = await reportDetailBuilder.build(res.locals.user.username, report)

      const statementsWithNarrative = await Promise.all(
        statements.map(statement => reviewService.getStatement(statement.id))
      ).then(stmnts => stmnts.filter(stmnt => stmnt.statement))

      return res.render('pages/reviewer/view-statements', {
        data,
        reportDataForPrint,
        statements: statementsWithNarrative,
      })
    },

    reviewStatement: async (req: Request, res: Response): Promise<void> => {
      const { statementId } = req.params

      const statement = await reviewService.getStatement(parseInt(statementId, 10))

      const offenderDetail = await offenderService.getOffenderDetails(
        await systemToken(res.locals.user.username),
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
    },
  }
}
