import type { Request, RequestHandler } from 'express'
import { AddStaffResult, InvolvedStaffService } from '../../services/involvedStaffService'
import { firstItem } from '../../utils/utils'
import { paths } from '../../config/incident'
import { ReportStatus } from '../../config/types'
import ReportService from '../../services/reportService'
import ReviewService from '../../services/reviewService'
import OffenderService from '../../services/offenderService'
import UserService from '../../services/userService'
import StatementService from '../../services/statementService'
import AuthService from '../../services/authService'
import type ReportDataBuilder from '../../services/reportDetailBuilder'

const extractReportId = (req: Request): number => parseInt(req.params.reportId, 10)

export default class CoordinatorRoutes {
  constructor(
    private readonly reportService: ReportService,
    private readonly involvedStaffService: InvolvedStaffService,
    private readonly reviewService: ReviewService,
    private readonly offenderService: OffenderService,
    private readonly userService: UserService,
    private readonly statementService: StatementService,
    private readonly authService: AuthService,
    private readonly reportDetailBuilder: ReportDataBuilder
  ) {}

  viewEditReport: RequestHandler = async (req, res) => {
    const { reportId } = req.params
    const { user } = res.locals
    const systemToken = await this.authService.getSystemClientToken(user.username)
    const report = await this.reviewService.getReport(parseInt(reportId, 10))
    const data = await this.reportDetailBuilder.build(res.locals.user.username, report)
    const reportEdits = await this.reviewService.getReportEdits(parseInt(reportId, 10))
    const hasReportBeenEdited = reportEdits?.length > 0
    const lastEdit = hasReportBeenEdited ? reportEdits.at(-1) : null
    const newReportOwners = reportEdits?.filter(edit => edit.reportOwnerChanged)
    const hasReportOwnerChanged = newReportOwners?.length > 0
    const reportOwner = newReportOwners?.at(-1)
    data.bookingId = null
    const dataWithEdits = { ...data, hasReportBeenEdited, lastEdit, hasReportOwnerChanged, reportOwner }
    const statements = await this.reviewService.getStatements(systemToken, parseInt(reportId, 10))
    const submittedStatements = statements.filter(stmnt => stmnt.isSubmitted)

    return res.render('pages/coordinator/edit-report.njk', {
      data: dataWithEdits,
      user,
      statements: submittedStatements,
    })
  }

  viewRemovalRequest: RequestHandler = async (req, res) => {
    const { reportId, statementId } = req.params
    const token = await this.authService.getSystemClientToken(res.locals.user.username)
    const [{ name, userId, email }, removalRequest] = await Promise.all([
      this.involvedStaffService.loadInvolvedStaff(parseInt(reportId, 10), parseInt(statementId, 10)),
      this.involvedStaffService.getInvolvedStaffRemovalRequest(parseInt(statementId, 10)),
    ])
    const location = await this.userService.getUserLocation(token, userId)
    const data = {
      name,
      userId,
      location,
      email,
      removalReason: removalRequest.removalRequestedReason,
    }
    const errors = req.flash('errors')

    if (!removalRequest.isRemovalRequested) {
      return res.redirect(paths.viewStatements(parseInt(reportId, 10)))
    }
    return res.render('pages/coordinator/view-removal-request.html', { data, errors })
  }

  submitRemovalRequest: RequestHandler = async (req, res) => {
    const { reportId, statementId } = req.params
    const { confirm } = req.body

    if (!confirm) {
      req.flash('errors', [
        { href: '#confirm', text: 'Select yes if you want to remove this person from the incident' },
      ])
      return res.redirect(paths.viewRemovalRequest(reportId, statementId))
    }

    if (confirm === 'no') {
      await this.statementService.refuseRequest(parseInt(statementId, 10))
      return res.redirect(paths.staffMemberNotRemoved(reportId, statementId))
    }

    return res.redirect(paths.confirmStatementDelete(reportId, statementId, true))
  }

  viewStaffMemberNotRemoved: RequestHandler = async (req, res) => {
    const { reportId, statementId } = req.params
    const staffMember = await this.involvedStaffService.loadInvolvedStaff(
      parseInt(reportId, 10),
      parseInt(statementId, 10)
    )

    const data = { name: staffMember.name, email: staffMember.email, reportId }

    return res.render('pages/coordinator/staff-member-not-removed.html', { data })
  }

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
      return res.redirect(paths.addInvolvedStaff(reportId))
    }

    const result = await this.involvedStaffService.addInvolvedStaff(
      await this.authService.getSystemClientToken(res.locals.user.username),
      reportId,
      username
    )

    req.flash('username', username.toUpperCase())
    return res.redirect(paths.addInvolvedStaffResult(reportId, result))
  }

  viewAddInvolvedStaffResult: RequestHandler = async (req, res) => {
    const reportId = extractReportId(req)
    const result = req.params.result as AddStaffResult
    const username = firstItem(req.flash('username'))

    const knownResult = Object.values(AddStaffResult).some(knownValue => knownValue === result)

    if (!username || !knownResult || result === AddStaffResult.SUCCESS) {
      return res.redirect(paths.viewReport(reportId))
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
    const offenderDetail = await this.offenderService.getOffenderDetails(bookingId, res.locals.user.username)
    const data = { incidentId: reportId, reporterName, submittedDate, offenderDetail }

    res.render('pages/coordinator/confirm-report-deletion.html', { errors, data })
  }

  deleteReport: RequestHandler = async (req, res) => {
    const reportId = extractReportId(req)
    const { confirm } = req.body

    if (!confirm) {
      req.flash('errors', [{ href: '#confirm', text: 'Select yes if you want to delete this report' }])
      return res.redirect(paths.confirmReportDelete(reportId))
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
    const { removalRequest } = req.query

    const staffMember = await this.involvedStaffService.loadInvolvedStaff(reportId, parseInt(statementId, 10))

    const errors = req.flash('errors')

    const data = { reportId, statementId, displayName: staffMember.name, removalRequest }

    res.render('pages/coordinator/confirm-statement-deletion.html', { errors, data })
  }

  deleteStatement: RequestHandler = async (req, res) => {
    const reportId = extractReportId(req)
    const { statementId } = req.params
    const { confirm, removalRequest } = req.body

    if (!confirm) {
      req.flash('errors', [{ href: '#confirm', text: 'Select yes if you want to delete this statement' }])
      return removalRequest
        ? res.redirect(paths.confirmStatementDelete(reportId, statementId, true))
        : res.redirect(paths.confirmStatementDelete(reportId, statementId, false))
    }

    if (confirm === 'yes') {
      await this.involvedStaffService.removeInvolvedStaff(reportId, parseInt(statementId, 10))
    }

    const location = removalRequest ? paths.viewStatements(reportId) : paths.viewReport(reportId)
    return res.redirect(location)
  }
}
