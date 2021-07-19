import { Request, Response, RequestHandler } from 'express'
import moment from 'moment'
import type LocationService from '../../services/locationService'
import type ReportService from '../../services/reportService'
import type OffenderService from '../../services/offenderService'
import { SystemToken } from '../../types/uof'
import logger from '../../../log'

export default class ReportMayAlreadyExistRoutes {
  constructor(
    private readonly systemToken: SystemToken,
    private readonly reportService: ReportService,
    private readonly locationService: LocationService,
    private readonly offenderService: OffenderService
  ) {}

  public view = async (req: Request, res: Response): Promise<void> => {
    const { bookingId } = req.params
    const token = await this.systemToken(res.locals.user.username)
    const { displayName: offenderName } = await this.offenderService.getOffenderDetails(token, parseInt(bookingId, 10))
    const inProgressReport = await this.reportService.getReportInProgress(parseInt(bookingId, 10))

    if (!inProgressReport) {
      logger.info('User has attempted to access IN_PROGRESS report which is no longer available')
      return res.redirect(`/report/${bookingId}/report-has-been-deleted`)
    }

    const reportsExcludingInProgress = await this.reportService.getReportsByDate(
      parseInt(bookingId, 10),
      inProgressReport.incidentdate
    )

    const reports = await Promise.all(
      reportsExcludingInProgress.map(async r => {
        return {
          reporter: r.reporter,
          date: moment(r.date).format('dddd DD MMM YYYY, HH:mm'),
          location: await this.locationService.getLocation(token, r.form.incidentDetails.locationId),
        }
      })
    )
    const pageData = {
      offenderName,
      reports,
      pageTitle: 'A report for this incident may already exist',
    }
    return res.render('formPages/incident/report-may-already-exist', { pageData, errors: req.flash('errors') })
  }

  public submit: RequestHandler = async (req: Request, res: Response) => {
    const { cancelReport } = req.body
    const { bookingId } = req.params
    const originalSubmissionIntent = req.flash('originalSubmitType')
    req.flash('originalSubmitType', originalSubmissionIntent) // save it in case user navigates back from subsequent page

    if (!cancelReport) {
      req.flash('errors', {
        text: 'Select yes if this incident has already been reported',
        href: '#cancel-report-yes',
      })
      return res.redirect(req.originalUrl)
    }

    if (cancelReport === 'true') {
      const { id: pendingReportId } = await this.reportService.getReportInProgress(parseInt(bookingId, 10))
      await this.reportService.deleteReport(res.locals.user.username, pendingReportId)
      return res.redirect(`/report/${bookingId}/report-cancelled`)
    }
    const nextPath = originalSubmissionIntent[0] === 'save-and-continue' ? 'staff-involved' : 'report-use-of-force'

    return res.redirect(`/report/${bookingId}/${nextPath}`)
  }
}
