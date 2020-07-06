import moment from 'moment'
import { Request, Response } from 'express'
import { removeKeysWithEmptyValues, parseDate } from '../utils/utils'
import { OffenderService, SystemToken } from '../types/uof'
import ReportDataBuilder from '../services/reportDetailBuilder'
import ReviewService from '../services/reviewService'

interface Params {
  offenderService: OffenderService
  reportDetailBuilder: ReportDataBuilder
  reviewService: ReviewService
  systemToken: SystemToken
}

export = function CreateReviewRoutes({ offenderService, reportDetailBuilder, reviewService, systemToken }: Params) {
  const getOffenderNames = (token, incidents): Promise<{ [offenderNo: string]: string }> => {
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
    viewAllIncidents: async (req: Request, res: Response): Promise<void> => {
      const { prisonNumber, reporter, dateFrom, dateTo } = req.query
      const query = removeKeysWithEmptyValues({
        prisonNumber,
        reporter,
        dateFrom: dateFrom ? parseDate(dateFrom, 'D MMM YYYY') : null,
        dateTo: dateTo ? parseDate(dateTo, 'D MMM YYYY') : null,
      })

      const { awaiting, completed } = await reviewService.getReports(res.locals.user.activeCaseLoadId, query)

      const namesByOffenderNumber = await getOffenderNames(await systemToken(res.locals.user.username), [
        ...awaiting,
        ...completed,
      ])
      const awaitingReports = awaiting.map(toReport(namesByOffenderNumber))
      const completedReports = completed.map(toReport(namesByOffenderNumber))

      return res.render('pages/all-incidents', {
        awaitingReports,
        completedReports,
        query,
        selectedTab: 'all-incidents',
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

      const data = { incidentId: reportId, reporterName, submittedDate, offenderDetail, statements }
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