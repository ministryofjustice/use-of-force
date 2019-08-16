const express = require('express')
const moment = require('moment')
const flash = require('connect-flash')
const { isNilOrEmpty } = require('../utils/utils')
const asyncMiddleware = require('../middleware/asyncMiddleware')
const statementConfig = require('../config/statement')
const formProcessing = require('../services/formProcessing')

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
      const awaitingIncidents = await incidentService.getIncidentsForUser(req.user.username, 'PENDING')
      const completedIncidents = await incidentService.getIncidentsForUser(req.user.username, 'SUBMITTED')

      const namesByOffenderNumber = await getOffenderNames(res.locals.user.token, [
        ...awaitingIncidents,
        ...completedIncidents,
      ])
      const awaitingStatements = awaitingIncidents.map(toStatement(namesByOffenderNumber))
      const completedStatements = completedIncidents.map(toStatement(namesByOffenderNumber))

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

      // TODO retrieve statement/errors from flash to re-render on validation error
      const statement = await incidentService.getStatement(req.user.username, incidentId)
      const offenderDetail = await offenderService.getOffenderDetails(res.locals.user.token, statement.bookingId)
      const { displayName, offenderNo } = offenderDetail

      res.render('pages/statement/provide', {
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

  router.get(
    '/incidents/:incidentId/statement/confirm',
    asyncMiddleware(async (req, res) => {
      const { incidentId } = req.params

      const statement = await incidentService.getStatement(req.user.username, incidentId)
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

  router.get(
    '/incidents/:incidentId/statement/review',
    asyncMiddleware(async (req, res) => {
      const { incidentId } = req.params

      const statement = await incidentService.getStatement(req.user.username, incidentId)
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

  router.post(
    '/incidents/:incidentId/statement/confirm',
    asyncMiddleware(async (req, res) => {
      const { incidentId } = req.params
      const { confirmed } = req.body
      if (!confirmed) {
        req.flash('errors', [
          {
            text: 'Check that you agree before sending',
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

  router.post(
    '/incidents/:incidentId/statement',
    asyncMiddleware(async (req, res) => {
      const { incidentId } = req.params

      const formPageConfig = formConfig

      const { extractedFields: statement, errors } = formProcessing.processInput(formPageConfig, req.body)

      if (!isNilOrEmpty(errors)) {
        req.flash('errors', errors)
        req.flash('userInput', statement)
        return res.redirect(`/incidents/${incidentId}/statement`)
      }

      await incidentService.saveStatement(req.user.username, incidentId, statement)

      const location =
        req.body.submit === 'save-and-continue' ? `/incidents/${incidentId}/statement/confirm` : `/incidents/`

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

  return router
}
