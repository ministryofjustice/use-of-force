const express = require('express')
const moment = require('moment')
const { formatTimestampToDateTime } = require('../utils/utils')

const asyncMiddleware = require('../middleware/asyncMiddleware')

module.exports = function Index({ authenticationMiddleware, incidentService, offenderService }) {
  const router = express.Router()

  router.use(authenticationMiddleware())

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

      const { booking_id: bookingId, incident_date: incidentDate } = await incidentService.getIncident(
        req.user.username,
        incidentId
      )
      const offenderDetail = await offenderService.getOffenderDetails(res.locals.user.token, bookingId)
      const { displayName, offenderNo } = offenderDetail

      res.render('pages/statement/provide', {
        data: { incidentId, displayName, offenderNo, incidentDate: formatTimestampToDateTime(incidentDate) },
      })
    })
  )

  router.post(
    '/incidents/:incidentId/statement',
    asyncMiddleware(async (req, res) => {
      const { incidentId } = req.params
      await incidentService.submitStatement(req.user.username, incidentId)
      res.redirect(`/incidents/${incidentId}/statement/submitted`)
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
