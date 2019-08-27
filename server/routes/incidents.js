const moment = require('moment')
const { isNilOrEmpty } = require('../utils/utils')
const statementConfig = require('../config/statement')
const formProcessing = require('../services/formProcessing')
const { StatementStatus } = require('../config/types')

const formConfig = {
  ...statementConfig,
}

module.exports = function IncidentRoutes({ statementService, offenderService }) {
  const getOffenderNames = (token, incidents) => {
    const offenderNos = incidents.map(incident => incident.offender_no)
    return offenderService.getOffenderNames(token, offenderNos)
  }

  const toStatement = namesByOffenderNumber => incident => ({
    id: incident.id,
    incidentdate: incident.incident_date,
    staffMemberName: incident.reporter_name,
    offenderName: namesByOffenderNumber[incident.offender_no],
  })

  return {
    viewReportCreated: async (req, res) => {
      res.render('pages/submitted', { data: res.locals.formObject, reportId: req.params.reportId })
    },

    redirectToViewIncidents: (req, res) => res.redirect('/incidents'),

    viewIncidents: async (req, res) => {
      const awaiting = await statementService.getStatementsForUser(req.user.username, StatementStatus.PENDING)
      const completed = await statementService.getStatementsForUser(req.user.username, StatementStatus.SUBMITTED)

      const namesByOffenderNumber = await getOffenderNames(res.locals.user.token, [...awaiting, ...completed])
      const awaitingStatements = awaiting.map(toStatement(namesByOffenderNumber))
      const completedStatements = completed.map(toStatement(namesByOffenderNumber))

      res.render('pages/incidents', {
        awaitingStatements,
        completedStatements,
      })
    },

    viewSubmitted: async (req, res) => {
      res.render('pages/statement/submitted', {
        data: {},
      })
    },

    viewStatementEntry: async (req, res) => {
      const { reportId } = req.params

      const errors = req.flash('errors')
      const statement = await statementService.getStatement(req.user.username, reportId, StatementStatus.PENDING)
      const offenderDetail = await offenderService.getOffenderDetails(res.locals.user.token, statement.bookingId)
      const { displayName, offenderNo } = offenderDetail

      res.render('pages/statement/provide', {
        errors,
        data: {
          reportId,
          displayName,
          offenderNo,
          ...statement,
          months: moment.months().map((month, i) => ({ value: i, label: month })),
        },
      })
    },

    enterStatement: async (req, res) => {
      const { reportId } = req.params

      const saveAndContinue = req.body.submit === 'save-and-continue'

      const { fields, validate: validationEnabled } = formConfig
      const validate = validationEnabled && saveAndContinue

      const { extractedFields: statement, errors } = formProcessing.processInput({ validate, fields }, req.body)

      const isValid = isNilOrEmpty(errors)

      // Always persist to prevent loss of work and avoiding issues with storing large content in cookie session state
      await statementService.save(req.user.username, reportId, statement)

      if (!isValid) {
        req.flash('errors', errors)
        return res.redirect(`/incidents/${reportId}/statement`)
      }

      const location = saveAndContinue ? `/incidents/${reportId}/statement/confirm` : `/incidents/`

      return res.redirect(location)
    },

    viewConfirmation: async (req, res) => {
      const { reportId } = req.params

      const statement = await statementService.getStatement(req.user.username, reportId, StatementStatus.PENDING)
      const offenderDetail = await offenderService.getOffenderDetails(res.locals.user.token, statement.bookingId)
      const { displayName, offenderNo } = offenderDetail
      const errors = req.flash('errors')
      res.render('pages/statement/confirm', {
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

    confirmStatement: async (req, res) => {
      const { reportId } = req.params

      const errors = await statementService.validateSavedStatement(req.user.username, reportId)

      if (!isNilOrEmpty(errors)) {
        req.flash('errors', errors)
        return res.redirect(`/incidents/${reportId}/statement`)
      }

      await statementService.submitStatement(req.user.username, reportId)

      const location = `/incidents/${reportId}/statement/submitted`

      return res.redirect(location)
    },

    reviewStatement: async (req, res) => {
      const { reportId } = req.params

      const statement = await statementService.getStatement(req.user.username, reportId, StatementStatus.SUBMITTED)
      const offenderDetail = await offenderService.getOffenderDetails(res.locals.user.token, statement.bookingId)
      const { displayName, offenderNo } = offenderDetail
      res.render('pages/statement/review', {
        data: {
          reportId,
          displayName,
          offenderNo,
          ...statement,
          lastTrainingMonth: moment.months(statement.lastTrainingMonth),
        },
      })
    },
  }
}
