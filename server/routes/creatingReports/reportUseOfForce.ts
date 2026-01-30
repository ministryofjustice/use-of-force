import type DraftReportService from '../../services/drafts/draftReportService'
import type OffenderService from '../../services/offenderService'
import AuthService from '../../services/authService'

export default class ReportUseOfForceRoutes {
  constructor(
    private readonly authService: AuthService,
    private readonly draftReportService: DraftReportService,
    private readonly offenderService: OffenderService
  ) {}

  public view = async (req, res) => {
    const { bookingId } = req.params
    const { form = {}, incidentDate } = await this.draftReportService.getCurrentDraft(req.user.username, bookingId)

    let submissionAllowed = true

    if (incidentDate) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      submissionAllowed = this.draftReportService.isIncidentDateWithinSubmissionWindow(new Date(incidentDate))
    }

    const status = this.draftReportService.getReportStatus(form)
    const offenderDetail = await this.offenderService.getOffenderDetails(bookingId, res.locals.user.username)
    const { displayName, offenderNo, dateOfBirth } = offenderDetail
    res.render('pages/report-use-of-force', {
      data: { ...res.locals.formObject, offenderDetail, displayName, offenderNo, dateOfBirth },
      bookingId: Number(req.params.bookingId),
      status,
      // preventReportSubmission: !submissionAllowed,
    })
  }
}
