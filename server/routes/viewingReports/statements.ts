import moment from 'moment'
import { Request, RequestHandler } from 'express'
import { isNilOrEmpty } from '../../utils/utils'
import statementForm from '../../config/forms/statementForm'
import validation from '../../services/validation'
import { StatementStatus } from '../../config/types'
import StatementService from '../../services/statementService'
import { SystemToken } from '../../types/uof'
import OffenderService from '../../services/offenderService'
import { StatementSummary } from '../../data/statementsClientTypes'

const toStatement = namesByOffenderNumber => (incident: StatementSummary) => ({
  id: incident.id,
  incidentdate: incident.incidentDate,
  staffMemberName: incident.reporterName,
  inProgress: incident.inProgress,
  offenderName: namesByOffenderNumber[incident.offenderNo],
  offenderNo: incident.offenderNo,
  status: incident.status,
  isOverdue: incident.isOverdue,
  isRemovalRequested: incident.isRemovalRequested,
})

const extractReportId = (req: Request): number => parseInt(req.params.reportId, 10)

export default class StatementsRoutes {
  constructor(
    private readonly statementService: StatementService,
    private readonly offenderService: OffenderService,
    private readonly systemToken: SystemToken
  ) {}

  private getOffenderNames = (token, incidents) => {
    const offenderNos = incidents.map(incident => incident.offenderNo)
    return this.offenderService.getOffenderNames(token, offenderNos)
  }

  viewYourStatements: RequestHandler = async (req, res) => {
    const page = parseInt(req.query.page as string, 10) || 1
    const { items: results, metaData: pageData } = await this.statementService.getStatements(req.user.username, page)

    const namesByOffenderNumber = await this.getOffenderNames(await this.systemToken(res.locals.user.username), results)
    const statements = results.map(toStatement(namesByOffenderNumber))

    return res.render('pages/your-statements', {
      statements,
      pageData,
      selectedTab: 'your-statements',
    })
  }

  viewStatementSubmitted: RequestHandler = async (req, res) =>
    res.render('pages/statement/statement-submitted', {
      data: {},
    })

  viewWriteYourStatement: RequestHandler = async (req, res) => {
    const reportId = extractReportId(req)

    const errors = req.flash('errors')
    const statement = await this.statementService.getStatementForUser(
      req.user.username,
      reportId,
      StatementStatus.PENDING
    )
    const offenderDetail = await this.offenderService.getOffenderDetails(
      await this.systemToken(res.locals.user.username),
      statement.bookingId
    )
    const { displayName, offenderNo } = offenderDetail

    res.render('pages/statement/write-your-statement', {
      errors,
      data: {
        reportId,
        displayName,
        offenderNo,
        ...statement,
        months: moment.months().map((month, i) => ({ value: i, label: month })),
      },
      pageTitle: 'Your use of force statement',
    })
  }

  submitWriteYourStatement: RequestHandler = async (req, res) => {
    const reportId = extractReportId(req)

    const saveAndContinue = req.body.submitType === 'save-and-continue'

    const { extractedFields: statement, errors } = validation.processInput({
      validationSpec: statementForm.complete,
      input: req.body,
    })

    const isValid = isNilOrEmpty(errors)

    // Always persist to prevent loss of work
    await this.statementService.save(req.user.username, reportId, statement)

    if (saveAndContinue && !isValid) {
      req.flash('errors', errors)
      return res.redirect(`/${reportId}/write-your-statement`)
    }

    const location = saveAndContinue ? `/${reportId}/check-your-statement` : `/your-statements`

    return res.redirect(location)
  }

  viewCheckYourStatement: RequestHandler = async (req, res) => {
    const reportId = extractReportId(req)

    const statement = await this.statementService.getStatementForUser(
      req.user.username,
      reportId,
      StatementStatus.PENDING
    )
    const offenderDetail = await this.offenderService.getOffenderDetails(
      await this.systemToken(res.locals.user.username),
      statement.bookingId
    )
    const { displayName, offenderNo } = offenderDetail
    const errors = req.flash('errors')
    res.render('pages/statement/check-your-statement', {
      errors,
      data: {
        reportId,
        displayName,
        offenderNo,
        ...statement,
        lastTrainingMonth: moment.months(statement.lastTrainingMonth),
      },
    })
  }

  submitCheckYourStatement: RequestHandler = async (req, res) => {
    const reportId = extractReportId(req)

    const errors = await this.statementService.validateSavedStatement(req.user.username, reportId)

    if (!isNilOrEmpty(errors)) {
      req.flash('errors', errors)
      return res.redirect(`/${reportId}/write-your-statement`)
    }

    await this.statementService.submitStatement(req.user.username, reportId)

    const location = `/${reportId}/statement-submitted`

    return res.redirect(location)
  }

  viewYourStatement: RequestHandler = async (req, res) => {
    const reportId = extractReportId(req)

    const statement = await this.statementService.getStatementForUser(
      req.user.username,
      reportId,
      StatementStatus.SUBMITTED
    )

    const offenderDetail = await this.offenderService.getOffenderDetails(
      await this.systemToken(res.locals.user.username),
      statement.bookingId
    )
    const { displayName, offenderNo } = offenderDetail
    res.render('pages/statement/your-statement', {
      data: {
        reportId,
        displayName,
        offenderNo,
        ...statement,
        lastTrainingMonth: moment.months(statement.lastTrainingMonth),
      },
    })
  }

  viewAddCommentToStatement: RequestHandler = async (req, res) => {
    const reportId = extractReportId(req)

    const statement = await this.statementService.getStatementForUser(
      req.user.username,
      reportId,
      StatementStatus.SUBMITTED
    )
    const offenderDetail = await this.offenderService.getOffenderDetails(
      await this.systemToken(res.locals.user.username),
      statement.bookingId
    )
    const { displayName, offenderNo } = offenderDetail

    return res.render('pages/statement/add-comment-to-statement', {
      data: {
        reportId,
        displayName,
        offenderNo,
        ...statement,
        lastTrainingMonth: moment.months(statement.lastTrainingMonth),
      },
    })
  }

  saveAdditionalComment: RequestHandler = async (req, res) => {
    const reportId = extractReportId(req)

    const statement = await this.statementService.getStatementForUser(
      req.user.username,
      reportId,
      StatementStatus.SUBMITTED
    )
    if (req.body.additionalComment && req.body.additionalComment.trim().length) {
      await this.statementService.saveAdditionalComment(statement.id, req.body.additionalComment)
    }
    return res.redirect(`/your-statements`)
  }
}
