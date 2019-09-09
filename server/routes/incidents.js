const moment = require('moment')
const { isNilOrEmpty } = require('../utils/utils')
const statementConfig = require('../config/statement')
const formProcessing = require('../services/formProcessing')
const { ReportStatus, StatementStatus } = require('../config/types')
const { links } = require('../config.js')

const formConfig = {
  ...statementConfig,
}

module.exports = function CreateReportRoutes({ statementService, reportService, offenderService }) {
  const getOffenderNames = (token, incidents) => {
    const offenderNos = incidents.map(incident => incident.offenderNo)
    return offenderService.getOffenderNames(token, offenderNos)
  }

  const toStatement = namesByOffenderNumber => incident => ({
    id: incident.id,
    incidentdate: incident.incidentDate,
    staffMemberName: incident.reporterName,
    offenderName: namesByOffenderNumber[incident.offenderNo],
  })

  const toReport = namesByOffenderNumber => incident => ({
    id: incident.id,
    bookingId: incident.bookingId,
    incidentdate: incident.incidentDate,
    staffMemberName: incident.reporterName,
    offenderName: namesByOffenderNumber[incident.offenderNo],
  })

  return {
    redirectToHomePage: async (req, res) => {
      res.redirect('/my-statements')
    },

    viewReportSent: async (req, res) => {
      res.render('pages/report-sent', { data: res.locals.formObject, reportId: req.params.reportId, links })
    },

    viewMyStatements: async (req, res) => {
      const awaiting = await statementService.getStatements(req.user.username, StatementStatus.PENDING)
      const completed = await statementService.getStatements(req.user.username, StatementStatus.SUBMITTED)

      const namesByOffenderNumber = await getOffenderNames(res.locals.user.token, [...awaiting, ...completed])
      const awaitingStatements = awaiting.map(toStatement(namesByOffenderNumber))
      const completedStatements = completed.map(toStatement(namesByOffenderNumber))

      res.render('pages/my-statements', {
        awaitingStatements,
        completedStatements,
        selectedTab: 'my-statements',
      })
    },

    viewMyReports: async (req, res) => {
      const awaiting = await reportService.getReports(req.user.username, ReportStatus.IN_PROGRESS)
      const completed = await reportService.getReports(req.user.username, ReportStatus.SUBMITTED)

      const namesByOffenderNumber = await getOffenderNames(res.locals.user.token, [...awaiting, ...completed])
      const awaitingReports = awaiting.map(toReport(namesByOffenderNumber))
      const completedReports = completed.map(toReport(namesByOffenderNumber))

      res.render('pages/my-reports', {
        awaitingReports,
        completedReports,
        selectedTab: 'my-reports',
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
      const statement = await statementService.getStatement(req.user.username, reportId, StatementStatus.PENDING)
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
      })
    },

    submitWriteYourStatement: async (req, res) => {
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
        return res.redirect(`/${reportId}/write-your-statement`)
      }

      const location = saveAndContinue ? `/${reportId}/check-your-statement` : `/`

      return res.redirect(location)
    },

    viewCheckYourStatement: async (req, res) => {
      const { reportId } = req.params

      const statement = await statementService.getStatement(req.user.username, reportId, StatementStatus.PENDING)
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
      const statement = await statementService.getStatement(req.user.username, reportId, StatementStatus.SUBMITTED)

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

    saveAdditionalComment: async (req, res) => {
      const { reportId } = req.params
      const statement = await statementService.getStatement(req.user.username, reportId, StatementStatus.SUBMITTED)
      if (req.body.additionalComment && req.body.additionalComment.trim().length) {
        await statementService.saveAdditionalComment(statement.id, req.body.additionalComment)
      }
      return res.redirect(`/`)
    },

    viewAddCommentToStatement: async (req, res) => {
      const { reportId } = req.params
      const statement = await statementService.getStatement(req.user.username, reportId, StatementStatus.SUBMITTED)
      const offenderDetail = await offenderService.getOffenderDetails(res.locals.user.token, statement.bookingId)
      const { displayName, offenderNo } = offenderDetail

      if (req.body.additionalComment && req.body.additionalComment.trim().length) {
        await statementService.saveAdditionalComment(statement.id, req.body.additionalComment)
      }
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
  }
}
