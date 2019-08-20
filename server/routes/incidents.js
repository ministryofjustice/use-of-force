const express = require('express')
const moment = require('moment')
const flash = require('connect-flash')
const { isNilOrEmpty } = require('../utils/utils')
const asyncMiddleware = require('../middleware/asyncMiddleware')
const statementConfig = require('../config/statement')
const formProcessing = require('../services/formProcessing')
const { StatementStatus } = require('../config/types')

const formConfig = {
  ...statementConfig,
}

module.exports = function Index({ authenticationMiddleware, statementService, offenderService }) {
  const router = express.Router()

  router.use(authenticationMiddleware())
  router.use(flash())

  router.use((req, res, next) => {
    if (typeof req.csrfToken === 'function') {
      res.locals.csrfToken = req.csrfToken()
    }
    next()
  })

  router.get('/', (req, res) => {
    res.redirect('/incidents')
  })

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

  router.get(
    '/incidents/',
    asyncMiddleware(async (req, res) => {
      const awaiting = await statementService.getStatementsForUser(req.user.username, StatementStatus.PENDING)
      const completed = await statementService.getStatementsForUser(req.user.username, StatementStatus.SUBMITTED)

      const namesByOffenderNumber = await getOffenderNames(res.locals.user.token, [...awaiting, ...completed])
      const awaitingStatements = awaiting.map(toStatement(namesByOffenderNumber))
      const completedStatements = completed.map(toStatement(namesByOffenderNumber))

      res.render('pages/incidents', {
        awaitingStatements,
        completedStatements,
      })
    })
  )

  router.get(
    '/incidents/:reportId/statement',
    asyncMiddleware(async (req, res) => {
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
    })
  )

  router.post(
    '/incidents/:reportId/statement',
    asyncMiddleware(async (req, res) => {
      const { reportId } = req.params

      const saveAndContinue = req.body.submit === 'save-and-continue'

      const { fields, validate: validationEnabled } = formConfig
      const validate = validationEnabled && saveAndContinue

      const { extractedFields: statement, errors } = formProcessing.processInput({ validate, fields }, req.body)

      const isValid = isNilOrEmpty(errors)

      // Always persist to prevent loss of work and avoiding issues with storing large content in cookie session state
      await statementService.saveStatement(req.user.username, reportId, statement)

      if (!isValid) {
        req.flash('errors', errors)
        return res.redirect(`/incidents/${reportId}/statement`)
      }

      const location = saveAndContinue ? `/incidents/${reportId}/statement/confirm` : `/incidents/`

      return res.redirect(location)
    })
  )

  router.get(
    '/incidents/:reportId/statement/confirm',
    asyncMiddleware(async (req, res) => {
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
    })
  )

  router.post(
    '/incidents/:reportId/statement/confirm',
    asyncMiddleware(async (req, res) => {
      const { reportId } = req.params
      const { confirmed } = req.body

      const errors = await statementService.validateSavedStatement(req.user.username, reportId)

      if (!isNilOrEmpty(errors)) {
        req.flash('errors', errors)
        return res.redirect(`/incidents/${reportId}/statement`)
      }

      if (!confirmed) {
        req.flash('errors', [
          {
            text: 'Confirm you agree to send your statement',
            href: '#confirm',
          },
        ])
        return res.redirect(`/incidents/${reportId}/statement/confirm`)
      }
      await statementService.submitStatement(req.user.username, reportId)

      const location = `/incidents/${reportId}/statement/submitted`

      return res.redirect(location)
    })
  )

  router.get(
    '/incidents/:reportId/statement/submitted',
    asyncMiddleware(async (req, res) => {
      res.render('pages/statement/submitted', {
        data: {},
      })
    })
  )

  router.get(
    '/incidents/:reportId/statement/review',
    asyncMiddleware(async (req, res) => {
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
    })
  )

  return router
}
