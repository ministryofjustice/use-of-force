import moment from 'moment'
import { Request, Response } from 'express'
import { removeKeysWithEmptyValues, parseDate } from '../utils/utils'
import { OffenderService, SystemToken } from '../types/uof'
import ReportDataBuilder from '../services/reportDetailBuilder'
import ReviewService from '../services/reviewService'
import { ReportStatus } from '../config/types'

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
      const query = removeKeysWithEmptyValues({
        prisonerName,
        prisonNumber,
        reporter,
        dateFrom: dateFrom ? parseDate(dateFrom, 'D MMM YYYY') : null,
        dateTo: dateTo ? parseDate(dateTo, 'D MMM YYYY') : null,
      })

      const reports = await reviewService.getCompletedReports(
        res.locals.user.username,
        res.locals.user.activeCaseLoadId,
        query
      )
      return res.render('pages/completed-incidents', {
        reports,
        query,
        selectedTab: 'completed',
      })
    },

    reviewReport: async (req: Request, res: Response): Promise<void> => {
      const { reportId } = req.params

      const report = await reviewService.getReport(reportId)

      const data = await reportDetailBuilder.build(res.locals.user.username, report)

      return res.render('pages/reviewer/view-report', { data })
    },

    reviewStatements: async (req: Request, res: Response): Promise<void> => {
      const { reportId } = req.params
      const report = await reviewService.getReport(reportId)

      const { bookingId, reporterName, submittedDate } = report
      const offenderDetail = await offenderService.getOffenderDetails(
        await systemToken(res.locals.user.username),
        bookingId
      )

      const statements = await reviewService.getStatements(await systemToken(res.locals.user.username), reportId)
      const tab = report.status === ReportStatus.SUBMITTED.value ? '/not-completed-incidents' : '/completed-incidents'

      const data = { incidentId: reportId, reporterName, submittedDate, offenderDetail, statements, tab }
      return res.render('pages/reviewer/view-statements', { data })
    },

    reviewStatement: async (req: Request, res: Response): Promise<void> => {
      const { statementId } = req.params

      const statement = await reviewService.getStatement(statementId)

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
