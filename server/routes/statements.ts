import moment from 'moment'
import { isNilOrEmpty } from '../utils/utils'
import { complete } from '../config/forms/statementForm'
import { processInput } from '../services/validation'
import { StatementStatus } from '../config/types'
import StatementService from '../services/statementService'
import { OffenderService, SystemToken } from '../types/uof'

export default function CreateReportRoutes(
  statementService: StatementService,
  offenderService: OffenderService,
  systemToken: SystemToken
) {
  const getOffenderNames = (token, incidents) => {
    const offenderNos = incidents.map(incident => incident.offenderNo)
    return offenderService.getOffenderNames(token, offenderNos)
  }

  const toStatement = namesByOffenderNumber => (incident: StatementSummary) => ({
    id: incident.id,
    incidentdate: incident.incidentDate,
    staffMemberName: incident.reporterName,
    inProgress: incident.inProgress,
    offenderName: namesByOffenderNumber[incident.offenderNo],
    offenderNo: incident.offenderNo,
    status: incident.status,
    isOverdue: incident.isOverdue,
  })

  return {
    viewYourStatements: async (req, res) => {
      const results = await statementService.getStatements(req.user.username)

      const namesByOffenderNumber = await getOffenderNames(await systemToken(res.locals.user.username), results)
      const statements = results.map(toStatement(namesByOffenderNumber))

      res.render('pages/your-statements', {
        statements,
        selectedTab: 'your-statements',
      })
    },

    viewStatementSubmitted: async (req, res) => {
      res.render('pages/statement/statement-submitted', {
        data: {},
      })
    },

    viewWriteYourStatement: async (req, res) => {
      const { reportId } = req.params

      const errors = req.flash('errors')
      const statement = await statementService.getStatementForUser(req.user.username, reportId, StatementStatus.PENDING)
      const offenderDetail = await offenderService.getOffenderDetails(
        await systemToken(res.locals.user.username),
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
    },

    submitWriteYourStatement: async (req, res) => {
      const { reportId } = req.params

      const saveAndContinue = req.body.submitType === 'save-and-continue'

      const { extractedFields: statement, errors } = processInput({
        validationSpec: complete,
        input: req.body,
      })

      const isValid = isNilOrEmpty(errors)

      // Always persist to prevent loss of work
      await statementService.save(req.user.username, reportId, statement)

      if (saveAndContinue && !isValid) {
        req.flash('errors', errors)
        return res.redirect(`/${reportId}/write-your-statement`)
      }

      const location = saveAndContinue ? `/${reportId}/check-your-statement` : `/your-statements`

      return res.redirect(location)
    },

    viewCheckYourStatement: async (req, res) => {
      const { reportId } = req.params

      const statement = await statementService.getStatementForUser(req.user.username, reportId, StatementStatus.PENDING)
      const offenderDetail = await offenderService.getOffenderDetails(
        await systemToken(res.locals.user.username),
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
    },

    submitCheckYourStatement: async (req, res) => {
      const { reportId } = req.params

      const errors = await statementService.validateSavedStatement(req.user.username, reportId)

      if (!isNilOrEmpty(errors)) {
        req.flash('errors', errors)
        return res.redirect(`/${reportId}/write-your-statement`)
      }

      await statementService.submitStatement(req.user.username, reportId)

      const location = `/${reportId}/statement-submitted`

      return res.redirect(location)
    },

    viewYourStatement: async (req, res) => {
      const { reportId } = req.params
      const statement = await statementService.getStatementForUser(
        req.user.username,
        reportId,
        StatementStatus.SUBMITTED
      )

      const offenderDetail = await offenderService.getOffenderDetails(
        await systemToken(res.locals.user.username),
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
    },

    viewAddCommentToStatement: async (req, res) => {
      const { reportId } = req.params
      const statement = await statementService.getStatementForUser(
        req.user.username,
        reportId,
        StatementStatus.SUBMITTED
      )
      const offenderDetail = await offenderService.getOffenderDetails(
        await systemToken(res.locals.user.username),
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
    },

    saveAdditionalComment: async (req, res) => {
      const { reportId } = req.params
      const statement = await statementService.getStatementForUser(
        req.user.username,
        reportId,
        StatementStatus.SUBMITTED
      )
      if (req.body.additionalComment && req.body.additionalComment.trim().length) {
        await statementService.saveAdditionalComment(statement.id, req.body.additionalComment)
      }
      return res.redirect(`/your-statements`)
    },
  }
}
