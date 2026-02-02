import { RequestHandler, Request } from 'express'
import type AuthService from 'server/services/authService'
import ReportEditService from '../../services/reportEditService'
import type ReportService from '../../services/reportService'
import type ReportDataBuilder from '../../services/reportDetailBuilder'
import type ReviewService from '../../services/reviewService'
import logger from '../../../log'
import config from '../../config'

const extractReportId = (req: Request): number => parseInt(req.params.incidentId, 10)

export default class ViewIncidentsRoutes {
  constructor(
    private readonly reportService: ReportService,
    private readonly reportEditService: ReportEditService,
    private readonly reportDetailBuilder: ReportDataBuilder,
    private readonly reviewService: ReviewService,
    private readonly authService: AuthService
  ) {}

  // handle any session data for this report if user closes browser tab without completing the edit
  deleteAnyPendingEditsForThisReport(req, reportId) {
    if (!req.session.incidentReport || !Array.isArray(req.session.incidentReport)) return
    req.session.incidentReport = req.session.incidentReport.filter(entry => entry.reportId !== reportId)
  }

  viewIncident: RequestHandler = async (req, res) => {
    const incidentId = extractReportId(req)
    this.deleteAnyPendingEditsForThisReport(req, incidentId)
    const { tab } = req.query
    const { isReviewer, isCoordinator, username } = res.locals.user
    const report = await this.reviewService.getReport(incidentId)
    const reportEdits = await this.reportService.getReportEdits(incidentId)
    const reportEditViewData = await this.reportEditService.mapEditDataToViewOutput(reportEdits, req.user)
    const hasReportBeenEdited = reportEdits?.length > 0
    const reportData = await this.reportDetailBuilder.build(username, report)
    const { offenderDetail } = reportData

    const systemToken = await this.authService.getSystemClientToken(username)
    const allStatements = await this.reviewService.getStatements(systemToken, incidentId)
    const submittedStatements = allStatements.filter(stmnt => stmnt.isSubmitted)
    const reportEditOrDeletePermitted = await this.reportEditService.isTodaysDateWithinEditabilityPeriod(incidentId)
    const isUsersOwnReport = username === report.username
    const isReviewerOrCoordinator = isReviewer || isCoordinator

    if (tab === 'report') {
      const lastEdit = hasReportBeenEdited ? reportEdits[0] : null
      const newReportOwners = reportEdits?.filter(edit => edit.reportOwnerChanged)
      const hasReportOwnerChanged = newReportOwners?.length > 0
      const reportOwner = newReportOwners?.at(-1)
      const reportSectionText = req.flash('edit-success-message')[0]?.reportSection.text
      // eslint-disable-next-line no-unneeded-ternary
      const displaySuccessBanner = reportSectionText ? true : false

      if (isUsersOwnReport || isReviewerOrCoordinator) {
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
          reportEditOrDeletePermitted,
          editabilityPeriod: config.maxWeeksFromIncidentDateToSubmitOrEditReport,
        }
        return res.render('pages/viewIncident/incident.njk', { data: dataForReport, statements: submittedStatements })
      }

      logger.info(
        `${username} attempted to access report ${incidentId} even though they are not the reporter or a reviewer/coordinator`
      )
      return res.render('pages/userError.njk', {
        message: `Access denied because you are not the owner of report ${incidentId}`,
      })
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
        reportEditOrDeletePermitted,
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
        reportEditOrDeletePermitted,
      }
      if (isUsersOwnReport || isReviewerOrCoordinator) {
        return res.render('pages/viewIncident/incident.njk', { data: dataForEditHistory })
      }
      logger.info(
        `${username} attempted to access edit history for report ${incidentId} even though they are not the reporter or a reviewer/coordinator`
      )
      return res.render('pages/userError.njk', {
        message: `Access denied because you are not the owner of report ${incidentId}`,
      })
    }

    return res.redirect(`/${incidentId}/view-incident?tab=report`)
  }
}
