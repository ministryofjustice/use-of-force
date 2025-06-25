import { RequestHandler } from 'express'
import type AuthService from 'server/services/authService'
import type ReportService from '../../services/reportService'
import type ReportDataBuilder from '../../services/reportDetailBuilder'
import type ReviewService from '../../services/reviewService'
import logger from '../../../log'

export default class ViewIncidentsRoutes {
  constructor(
    private readonly reportService: ReportService,
    private readonly reportDetailBuilder: ReportDataBuilder,
    private readonly reviewService: ReviewService,
    private readonly authService: AuthService
  ) {}

  viewIncident: RequestHandler = async (req, res) => {
    const { incidentId } = req.params
    const { tab } = req.query
    const yourReport = req.query['your-report']
    const { isReviewer, isCoordinator, username } = res.locals.user
    const report = await this.reviewService.getReport(parseInt(incidentId, 10))
    const reportEdits = await this.reportService.getReportEdits(parseInt(incidentId, 10))
    const hasReportBeenEdited = reportEdits?.length > 0
    const reportData = await this.reportDetailBuilder.build(username, report)
    const { offenderDetail } = reportData

    if (tab === 'report') {
      const userIsAccesingOwnReport = yourReport && username === report.username
      if (userIsAccesingOwnReport || isReviewer || isCoordinator) {
        const lastEdit = hasReportBeenEdited ? reportEdits.at(-1) : null
        const newReportOwners = reportEdits?.filter(edit => edit.reportOwnerChanged)
        const hasReportOwnerChanged = newReportOwners?.length > 0
        const reportOwner = newReportOwners?.at(-1)
        const systemToken = await this.authService.getSystemClientToken(username)
        const allStatements = await this.reviewService.getStatements(systemToken, parseInt(incidentId, 10))
        const submittedStatements = allStatements.filter(stmnt => stmnt.isSubmitted)

        const dataForReport = {
          ...reportData,
          hasReportBeenEdited,
          lastEdit,
          hasReportOwnerChanged,
          reportOwner,
          isReviewer,
          isCoordinator,
          incidentId,
          tab: 'report',
        }
        return res.render('pages/viewIncident/incident.njk', { data: dataForReport, statements: submittedStatements })
      }
      logger.info(
        `${username} attempted to access report ${incidentId} even though they are not the reporter (or coordinator/reviewer)`
      )
      return res.render('pages/userError.njk', { message: `You can not access report ${incidentId}` })
    }

    if (tab === 'statements') {
      const dataForStatements = {
        tab: 'statements',
        incidentId,
        hasReportBeenEdited,
        isReviewer,
        isCoordinator,
        offenderDetail,
      }
      return res.render('pages/viewIncident/incident.njk', { data: dataForStatements })
    }

    if (tab === 'edit-history') {
      const dataForEditHistory = {
        tab: 'edit-history',
        incidentId,
        hasReportBeenEdited,
        isReviewer,
        isCoordinator,
        offenderDetail,
      }
      return res.render('pages/viewIncident/incident.njk', { data: dataForEditHistory })
    }

    return res.redirect(`/${incidentId}/view-incident?tab=report`)
  }
}
