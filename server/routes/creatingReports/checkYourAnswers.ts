import { Request, Response } from 'express'
import LocationService from '../../services/locationService'
import NomisMappingService from '../../services/nomisMappingService'
import OffenderService from '../../services/offenderService'
import DraftReportService from '../../services/drafts/draftReportService'
import { properCaseFullName } from '../../utils/utils'
import reportSummary from '../../services/reportSummary'
import AuthService from '../../services/authService'

export default class CheckAnswerRoutes {
  constructor(
    private readonly draftReportService: DraftReportService,
    private readonly offenderService: OffenderService,
    private readonly authService: AuthService,
    private readonly locationService: LocationService,
    private readonly nomisMappingService: NomisMappingService
  ) {}

  public view = async (req: Request, res: Response): Promise<void> => {
    const token = await this.authService.getSystemClientToken(res.locals.user.username)
    const { bookingId } = req.params
    const {
      id,
      form = {},
      incidentDate,
      agencyId: prisonId,
    } = await this.draftReportService.getCurrentDraft(req.user.username, parseInt(bookingId, 10))

    // At this point the reportStatus may be 'incomplete' (because of the validation rules) if only the nomis locationId is present.
    // This scenario would occur where a user is already at /check-your-answers when the new code to use incidentLocationId is deployed
    // To pass validation we need the equivalent dpsLocationId persisted to the db as incidentLocationId.
    // The following 'if-block' does that.

    if (form.incidentDetails?.locationId && !form.incidentDetails?.incidentLocationId) {
      const { dpsLocationId } = await this.nomisMappingService.getDpsLocationDetailsHavingCorrespondingNomisLocationId(
        token,
        form.incidentDetails.locationId
      )

      form.incidentDetails.incidentLocationId = dpsLocationId

      await this.draftReportService.updateLocationId(id, incidentDate, form)
    }

    const { complete } = this.draftReportService.getReportStatus(form)

    if (!complete) {
      // User should not be on this page if form is not complete.
      return res.redirect(`/`)
    }

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

    const summary = reportSummary(form, offenderDetail, prison, locationDescription, involvedStaff, incidentDate)

    return res.render('pages/check-your-answers', { data: { summary, offenderDetail }, bookingId })
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
