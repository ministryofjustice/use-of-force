import type { Request, RequestHandler } from 'express'
import type { InvolvedStaffService, OffenderService, ReportService, ReviewService } from '../../services'
import type { SystemToken } from '../../types/uof'
import { AddStaffResult } from '../../services/involvedStaffService'
import { firstItem } from '../../utils/utils'
import { ReportStatus } from '../../config/types'

const extractReportId = (req: Request): number => parseInt(req.params.reportId, 10)

export default class CoordinatorRoutes {
  constructor(
    private readonly reportService: ReportService,
    private readonly involvedStaffService: InvolvedStaffService,
    private readonly reviewService: ReviewService,
    private readonly offenderService: OffenderService,
    private readonly systemToken: SystemToken
  ) {}

  viewAddInvolvedStaff: RequestHandler = async (req, res) => {
    const { reportId } = req.params

    const errors = req.flash('errors')
    const data = { incidentId: reportId }

    res.render('pages/coordinator/add-involved-staff/add-involved-staff.html', { errors, data })
  }

  submitAddInvolvedStaff: RequestHandler = async (req, res) => {
    const reportId = extractReportId(req)
    const {
      body: { username },
    } = req

    if (!username.trim()) {
      req.flash('errors', [{ href: '#username', text: "Enter a staff member's username" }])
      return res.redirect(`/coordinator/report/${reportId}/add-staff`)
    }

    const result = await this.involvedStaffService.addInvolvedStaff(
      await this.systemToken(res.locals.user.username),
      reportId,
      username
    )

    req.flash('username', username.toUpperCase())
    return res.redirect(`/coordinator/report/${reportId}/add-staff/result/${result}`)
  }

  viewAddInvolvedStaffResult: RequestHandler = async (req, res) => {
    const reportId = extractReportId(req)
    const result = req.params.result as AddStaffResult
    const username = firstItem(req.flash('username'))

    const knownResult = Object.values(AddStaffResult).some(knownValue => knownValue === result)

    if (!username || !knownResult || result === AddStaffResult.SUCCESS) {
      return res.redirect(`/${reportId}/view-report`)
    }

    if ([AddStaffResult.SUCCESS_UNVERIFIED, AddStaffResult.ALREADY_EXISTS].includes(result)) {
      const user = await this.involvedStaffService.loadInvolvedStaffByUsername(reportId, username)
      return res.render(`pages/coordinator/add-involved-staff/${result}.html`, {
        reportId,
        username,
        name: user.name,
      })
    }

    return res.render(`pages/coordinator/add-involved-staff/${result}.html`, { reportId, username })
  }

  confirmDeleteReport: RequestHandler = async (req, res) => {
    const reportId = extractReportId(req)
    const errors = req.flash('errors')
    const report = await this.reviewService.getReport(reportId)

    const { bookingId, reporterName, submittedDate } = report
    const offenderDetail = await this.offenderService.getOffenderDetails(
      await this.systemToken(res.locals.user.username),
      bookingId
    )
    const data = { incidentId: reportId, reporterName, submittedDate, offenderDetail }

    res.render('pages/coordinator/confirm-report-deletion.html', { errors, data })
  }

  deleteReport: RequestHandler = async (req, res) => {
    const reportId = extractReportId(req)
    const { confirm } = req.body

    if (!confirm) {
      req.flash('errors', [{ href: '#confirm', text: 'Select yes if you want to delete this report' }])
      return res.redirect(`/coordinator/report/${reportId}/confirm-delete`)
    }

    const report = await this.reviewService.getReport(reportId)
    const referringPage =
      report.status === ReportStatus.SUBMITTED.value ? '/not-completed-incidents' : '/completed-incidents'

    if (confirm === 'yes') {
      await this.reportService.deleteReport(res.locals.user.username, reportId)
    }

    return res.redirect(referringPage)
  }

  confirmDeleteStatement: RequestHandler = async (req, res) => {
    const reportId = extractReportId(req)
    const { statementId } = req.params

    const staffMember = await this.involvedStaffService.loadInvolvedStaff(reportId, parseInt(statementId, 10))

    const errors = req.flash('errors')

    const data = { reportId, statementId, displayName: staffMember.name }

    res.render('pages/coordinator/confirm-statement-deletion.html', { errors, data })
  }

  deleteStatement: RequestHandler = async (req, res) => {
    const reportId = extractReportId(req)
    const { statementId } = req.params
    const { confirm } = req.body

    if (!confirm) {
      req.flash('errors', [{ href: '#confirm', text: 'Select yes if you want to delete this statement' }])
      return res.redirect(`/coordinator/report/${reportId}/statement/${statementId}/confirm-delete`)
    }

    if (confirm === 'yes') {
      await this.involvedStaffService.removeInvolvedStaff(reportId, parseInt(statementId, 10))
    }

    return res.redirect(`/${reportId}/view-report`)
  }
}
