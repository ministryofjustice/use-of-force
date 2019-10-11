const moment = require('moment')
const { isNilOrEmpty } = require('../utils/utils')
const statementForm = require('../config/forms/statementForm')
const formProcessing = require('../services/formProcessing')
const { links } = require('../config.js')
const { StatementStatus } = require('../config/types')

module.exports = function CreateReportRoutes({ statementService, offenderService }) {
  const getOffenderNames = (token, incidents) => {
    const offenderNos = incidents.map(incident => incident.offenderNo)
    return offenderService.getOffenderNames(token, offenderNos)
  }

  const toStatement = namesByOffenderNumber => incident => ({
    id: incident.id,
    incidentdate: incident.incidentDate,
    staffMemberName: incident.reporterName,
    inProgress: incident.inProgress,
    offenderName: namesByOffenderNumber[incident.offenderNo],
  })

  return {
    viewYourStatements: async (req, res) => {
      const awaiting = await statementService.getStatements(req.user.username, StatementStatus.PENDING)
      const completed = await statementService.getStatements(req.user.username, StatementStatus.SUBMITTED)

      const namesByOffenderNumber = await getOffenderNames(res.locals.user.token, [...awaiting, ...completed])
      const awaitingStatements = awaiting.map(toStatement(namesByOffenderNumber))
      const completedStatements = completed.map(toStatement(namesByOffenderNumber))

      res.render('pages/your-statements', {
        awaitingStatements,
        completedStatements,
        selectedTab: 'your-statements',
        links,
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
      const offenderDetail = await offenderService.getOffenderDetails(res.locals.user.token, statement.bookingId)
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

      const saveAndContinue = req.body.submit === 'save-and-continue'

      const validate = saveAndContinue

      /**
       * Here, processInput returns the form (which is always statementForm) as extractedFields.
       * Seems unnecessary.
       * I'm fairly sure that grouping the fields into EXTRACTED (extractedFields)
       * and PAYLOAD (payloadFields) is mixing concerns.  The
       * EXTRACTED/PAYLOAD partition is a persistence concern and better handled there (in the Repository interface).
       */
      const { extractedFields: statement, errors } = formProcessing.processInput({
        validate,
        formConfig: statementForm,
        input: req.body,
      })

      const isValid = isNilOrEmpty(errors)

      // Always persist to prevent loss of work and avoiding issues with storing large content in cookie session state
      await statementService.save(req.user.username, reportId, statement)

      if (!isValid) {
        req.flash('errors', errors)
        return res.redirect(`/${reportId}/write-your-statement`)
      }

      const location = saveAndContinue ? `/${reportId}/check-your-statement` : `/`

      return res.redirect(location)
    },

    viewCheckYourStatement: async (req, res) => {
      const { reportId } = req.params

      const statement = await statementService.getStatementForUser(req.user.username, reportId, StatementStatus.PENDING)
      const offenderDetail = await offenderService.getOffenderDetails(res.locals.user.token, statement.bookingId)
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

      const offenderDetail = await offenderService.getOffenderDetails(res.locals.user.token, statement.bookingId)
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
      const offenderDetail = await offenderService.getOffenderDetails(res.locals.user.token, statement.bookingId)
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
