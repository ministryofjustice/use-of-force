import type { RequestHandler } from 'express'
import { paths } from '../../config/incident'
import ReportService from '../../services/reportService'
import OffenderService from '../../services/offenderService'
import ReviewService from '../../services/reviewService'
import AuthService from '../../services/authService'

export default class AdminRoutes {
  constructor(
    private readonly reportService: ReportService,
    private readonly reviewService: ReviewService,
    private readonly offenderService: OffenderService,
    private readonly authService: AuthService
  ) {}

  viewEditReport: RequestHandler = async (req, res) =>
    res.redirect(paths.editForm(Number(req.params.reportId), 'evidence'))

  viewEditForm: RequestHandler = async (req, res) => {
    const { reportId, formName } = req.params

    const report = await this.reviewService.getReport(Number(reportId))
    const { bookingId, reporterName, submittedDate, form } = report

    const offenderDetail = await this.offenderService.getOffenderDetails(bookingId, res.locals.user.username)

    return res.render('pages/admin/edit-form.html', {
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
