import { Request, Response, RequestHandler } from 'express'
import moment from 'moment'
import type DraftReportService from '../../services/drafts/draftReportService'
import type OffenderService from '../../services/offenderService'
import { SystemToken } from '../../types/uof'

export default class ReportMayAlreadyExistRoutes {
  constructor(
    private readonly systemToken: SystemToken,
    private readonly draftReportService: DraftReportService,
    private readonly offenderService: OffenderService
  ) {}

  public view: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    const { bookingId } = req.params
    const token = await this.systemToken(res.locals.user.username)
    const { displayName: offenderName } = await this.offenderService.getOffenderDetails(token, parseInt(bookingId, 10))

    const { id: formId, incidentDate } = await this.draftReportService.getCurrentDraft(
      req.user.username,
      Number(bookingId)
    )

    if (!formId) {
      return res.redirect(`/report/${bookingId}/report-has-been-deleted`)
    }

    const reports = await this.draftReportService.getPotentialDuplicates(
      parseInt(bookingId, 10),
      moment(incidentDate),
      token
    )

    const data = {
      offenderName,
      reports,
      bookingId,
      errors: req.flash('errors'),
    }

    return res.render('formPages/incident/report-may-already-exist', data)
  }

  public submit: RequestHandler = async (req: Request, res: Response) => {
    const { cancelReport } = req.body
    const { bookingId } = req.params
    const { submission } = req.query

    if (!cancelReport) {
      req.flash('errors', {
        text: 'Select yes if this incident has already been reported',
        href: '#cancel-report-yes',
      })
      return res.redirect(req.originalUrl)
    }

    if (cancelReport === 'true') {
      await this.draftReportService.deleteReport(res.locals.user.username, Number(bookingId))

      return res.redirect(`/report/${bookingId}/report-cancelled`)
    }
    const nextPath = submission === 'save-and-continue' ? 'staff-involved' : 'report-use-of-force'

    return res.redirect(`/report/${bookingId}/${nextPath}`)
  }
}
