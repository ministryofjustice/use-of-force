import { SystemToken } from '../../types/uof'
import type DraftReportService from '../../services/drafts/draftReportService'
import type OffenderService from '../../services/offenderService'

export default class ReportUseOfForceRoutes {
  constructor(
    private readonly systemToken: SystemToken,
    private readonly draftReportService: DraftReportService,
    private readonly offenderService: OffenderService
  ) {}

  public view = async (req, res) => {
    const { bookingId } = req.params
    const { form = {} } = await this.draftReportService.getCurrentDraft(req.user.username, bookingId)
    const status = this.draftReportService.getReportStatus(form)
    const offenderDetail = await this.offenderService.getOffenderDetails(
      await this.systemToken(res.locals.user.username),
      bookingId
    )
    const { displayName, offenderNo, dateOfBirth } = offenderDetail
    res.render('pages/report-use-of-force', {
      data: { ...res.locals.formObject, offenderDetail, displayName, offenderNo, dateOfBirth },
      bookingId: req.params.bookingId,
      status,
    })
  }
}
