import { Request, Response } from 'express'
import LocationService from '../../services/locationService'
import OffenderService from '../../services/offenderService'
import DraftReportService from '../../services/drafts/draftReportService'
import { SystemToken } from '../../types/uof'
import { properCaseFullName } from '../../utils/utils'
import reportSummary from '../../services/reportSummary'

export default class CheckAnswerRoutes {
  constructor(
    private readonly draftReportService: DraftReportService,
    private readonly offenderService: OffenderService,
    private readonly systemToken: SystemToken,
    private readonly locationService: LocationService
  ) {}

  public view = async (req: Request, res: Response): Promise<void> => {
    const { bookingId } = req.params
    const {
      form = {},
      incidentDate,
      agencyId: prisonId,
    } = await this.draftReportService.getCurrentDraft(req.user.username, parseInt(bookingId, 10))
    const { complete } = this.draftReportService.getReportStatus(form)

    if (!complete) {
      // User should not be on this page if form is not complete.
      return res.redirect(`/`)
    }

    const token = await this.systemToken(res.locals.user.username)

    const offenderDetail = await this.offenderService.getOffenderDetails(token, parseInt(bookingId, 10))

    const locationDescription = await this.locationService.getLocation(token, form.incidentDetails.incidentLocationId)

    const draftInvolvedStaff = await this.draftReportService.getInvolvedStaff(
      token,
      req.user.username,
      parseInt(bookingId, 10)
    )

    const involvedStaff = draftInvolvedStaff.map(staff => ({
      name: properCaseFullName(staff.name),
      username: staff.username,
    }))

    const prison = await this.locationService.getPrisonById(token, prisonId)

    const data = reportSummary(form, offenderDetail, prison, locationDescription, involvedStaff, incidentDate)

    return res.render('pages/check-your-answers', { data, bookingId })
  }

  public submit = async (req: Request, res: Response): Promise<void> => {
    const { bookingId } = req.params

    if (!(await this.draftReportService.isDraftComplete(req.user.username, parseInt(bookingId, 10)))) {
      throw new Error('Report is not complete')
    }

    const reportId = await this.draftReportService.submit(res.locals.user, parseInt(bookingId, 10))
    const location = reportId ? `/${reportId}/report-sent` : `/`
    return res.redirect(location)
  }

  public viewReportSent = (req: Request, res: Response): void => {
    return res.render('pages/report-sent', { data: res.locals.formObject, reportId: req.params.reportId })
  }
}
