import type { RequestHandler } from 'express'
import { paths } from '../../config/incident'
import type { OffenderService, ReportService, ReviewService } from '../../services'
import type { SystemToken } from '../../types/uof'

export default class AdminRoutes {
  constructor(
    private readonly reportService: ReportService,
    private readonly reviewService: ReviewService,
    private readonly offenderService: OffenderService,
    private readonly systemToken: SystemToken,
  ) {}

  viewEditReport: RequestHandler = async (req, res) =>
    res.redirect(paths.editForm(Number(req.params.reportId), 'evidence'))

  viewEditForm: RequestHandler = async (req, res) => {
    const { reportId, formName } = req.params

    const report = await this.reviewService.getReport(Number(reportId))
    const { bookingId, reporterName, submittedDate, form } = report

    const offenderDetail = await this.offenderService.getOffenderDetails(
      await this.systemToken(res.locals.user.username),
      bookingId,
    )

    return res.render('pages/admin/edit-form.njk', {
      errors: req.flash('errors'),
      data: {
        incidentId: reportId,
        reporterName,
        submittedDate,
        offenderDetail,
        selectedFormName: formName,
        formSections: Object.keys(form),
        form: JSON.stringify(form[formName], null, 4),
      },
    })
  }

  submitEditForm: RequestHandler = async (req, res) => {
    const { reportId, formName } = req.params
    const { form } = req.body

    try {
      const updatedSection = JSON.parse(form)
      await this.reportService.update(res.locals.user, parseInt(reportId, 10), formName, updatedSection)

      return res.redirect(paths.editForm(Number(reportId), formName))
    } catch (e) {
      req.flash('errors', {
        text: e.message,
        href: '#form',
      })
      return res.redirect(req.originalUrl)
    }
  }
}
