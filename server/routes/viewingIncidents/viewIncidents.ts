import { RequestHandler } from 'express'
import type AuthService from 'server/services/authService'
import ReportEditService from '../../services/reportEditService'
import type ReportService from '../../services/reportService'
import type ReportDataBuilder from '../../services/reportDetailBuilder'
import type ReviewService from '../../services/reviewService'
import logger from '../../../log'

export default class ViewIncidentsRoutes {
  constructor(
    private readonly reportService: ReportService,
    private readonly reportEditService: ReportEditService,
    private readonly reportDetailBuilder: ReportDataBuilder,
    private readonly reviewService: ReviewService,
    private readonly authService: AuthService
  ) {}

  viewIncident: RequestHandler = async (req, res) => {
    const { incidentId } = req.params
    const { tab } = req.query
    const { isReviewer, isCoordinator, username } = res.locals.user
    const report = await this.reviewService.getReport(parseInt(incidentId, 10))
    const reportEdits = await this.reportService.getReportEdits(parseInt(incidentId, 10))
    const reportEditViewData = await this.reportEditService.mapEditDataToViewOutput(reportEdits, req.user)
    const hasReportBeenEdited = reportEdits?.length > 0
    const reportData = await this.reportDetailBuilder.build(username, report)
    const { offenderDetail } = reportData

    const systemToken = await this.authService.getSystemClientToken(username)
    const allStatements = await this.reviewService.getStatements(systemToken, parseInt(incidentId, 10))
    const submittedStatements = allStatements.filter(stmnt => stmnt.isSubmitted)

    if (tab === 'report') {
      const lastEdit = hasReportBeenEdited ? reportEdits.at(-1) : null
      const newReportOwners = reportEdits?.filter(edit => edit.reportOwnerChanged)
      const hasReportOwnerChanged = newReportOwners?.length > 0
      const reportOwner = newReportOwners?.at(-1)
      const accessingFromYourReportTab = req.query['your-report']
      const isUsersOwnReport = username === report.username
      const isReviewerOrCoodinator = isReviewer || isCoordinator
      const reportSectionText = req.flash('edit-success-message')[0]?.reportSection.text
      // eslint-disable-next-line no-unneeded-ternary
      const displaySuccessBanner = reportSectionText ? true : false

      if ((accessingFromYourReportTab && isUsersOwnReport) || (!accessingFromYourReportTab && isReviewerOrCoodinator)) {
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
          displaySuccessBanner,
          reportSectionText,
        }
        return res.render('pages/viewIncident/incident.njk', { data: dataForReport, statements: submittedStatements })
      }

      logger.info(`${username} attempted to access report ${incidentId} even though they are not the reporter`)
      return res.render('pages/userError.njk', { message: `You are not the reporter for report ${incidentId}` })
    }

    if (tab === 'statements') {
      const dataForStatements = {
        ...reportData,
        tab: 'statements',
        incidentId,
        hasReportBeenEdited,
        isReviewer,
        isCoordinator,
        offenderDetail,
        allStatements,
        statements: submittedStatements,
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
        reportEditViewData,
        ...reportData,
        statements: submittedStatements,
      }
      return res.render('pages/viewIncident/incident.njk', { data: dataForEditHistory })
    }

    return res.redirect(`/${incidentId}/view-incident?tab=report`)
  }
}
