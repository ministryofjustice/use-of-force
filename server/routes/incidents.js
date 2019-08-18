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

module.exports = function Index({ authenticationMiddleware, incidentService, offenderService }) {
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
    date: moment(incident.incident_date).format('DD/MM/YYYY - HH:mm'),
    staffMemberName: incident.reporter_name,
    offenderName: namesByOffenderNumber[incident.offender_no],
  })

  router.get(
    '/incidents/',
    asyncMiddleware(async (req, res) => {
      const awaiting = await incidentService.getStatementsForUser(req.user.username, StatementStatus.PENDING)
      const completed = await incidentService.getStatementsForUser(req.user.username, StatementStatus.SUBMITTED)

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
    '/incidents/:incidentId/statement',
    asyncMiddleware(async (req, res) => {
      const { incidentId } = req.params

      const errors = req.flash('errors')
      const statement = await incidentService.getStatement(req.user.username, incidentId, StatementStatus.PENDING)
      const offenderDetail = await offenderService.getOffenderDetails(res.locals.user.token, statement.bookingId)
      const { displayName, offenderNo } = offenderDetail

      res.render('pages/statement/provide', {
        errors,
        data: {
          incidentId,
          displayName,
          offenderNo,
          ...statement,
          months: moment.months().map((month, i) => ({ value: i, label: month })),
        },
      })
    })
  )

  router.post(
    '/incidents/:incidentId/statement',
    asyncMiddleware(async (req, res) => {
      const { incidentId } = req.params

      const saveAndContinue = req.body.submit === 'save-and-continue'

      const { fields, validate: validationEnabled } = formConfig
      const validate = validationEnabled && saveAndContinue

      const { extractedFields: statement, errors } = formProcessing.processInput({ validate, fields }, req.body)

      const isValid = isNilOrEmpty(errors)

      // Always persist to prevent loss of work and avoiding issues with storing large content in cookie session state
      await incidentService.saveStatement(req.user.username, incidentId, statement)

      if (!isValid) {
        req.flash('errors', errors)
        req.flash('userInput', statement)
        return res.redirect(`/incidents/${incidentId}/statement`)
      }

      const location = saveAndContinue ? `/incidents/${incidentId}/statement/confirm` : `/incidents/`

      return res.redirect(location)
    })
  )

  router.get(
    '/incidents/:incidentId/statement/confirm',
    asyncMiddleware(async (req, res) => {
      const { incidentId } = req.params

      const statement = await incidentService.getStatement(req.user.username, incidentId, StatementStatus.PENDING)
      const offenderDetail = await offenderService.getOffenderDetails(res.locals.user.token, statement.bookingId)
      const { displayName, offenderNo } = offenderDetail
      const errors = req.flash('errors')
      res.render('pages/statement/confirm', {
        errors,
        data: {
          incidentId,
          displayName,
          offenderNo,
          ...statement,
          lastTrainingMonth: moment.months(statement.lastTrainingMonth),
        },
      })
    })
  )

  router.post(
    '/incidents/:incidentId/statement/confirm',
    asyncMiddleware(async (req, res) => {
      const { incidentId } = req.params
      const { confirmed } = req.body
      if (!confirmed) {
        req.flash('errors', [
          {
            text: 'Confirm you agree to send your statement',
            href: '#confirm',
          },
        ])
        return res.redirect(`/incidents/${incidentId}/statement/confirm`)
      }
      await incidentService.submitStatement(req.user.username, incidentId)

      const location = `/incidents/${incidentId}/statement/submitted`

      return res.redirect(location)
    })
  )

  router.get(
    '/incidents/:incidentId/statement/submitted',
    asyncMiddleware(async (req, res) => {
      res.render('pages/statement/submitted', {
        data: {},
      })
    })
  )

  router.get(
    '/incidents/:incidentId/statement/review',
    asyncMiddleware(async (req, res) => {
      const { incidentId } = req.params

      const statement = await incidentService.getStatement(req.user.username, incidentId, StatementStatus.SUBMITTED)
      const offenderDetail = await offenderService.getOffenderDetails(res.locals.user.token, statement.bookingId)
      const { displayName, offenderNo } = offenderDetail
      res.render('pages/statement/review', {
        data: {
          incidentId,
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
