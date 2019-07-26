const express = require('express')
const moment = require('moment')
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

  router.get(
    '/incidents/',
    asyncMiddleware(async (req, res) => {
      const incidents = await incidentService.getIncidentsForUser(req.user.username, 'SUBMITTED')
      const namesByOffenderNumber = await getOffenderNames(res.locals.user.token, incidents)
      const incidentsToDo = incidents.map(incident => ({
        id: incident.id,
        date: moment(incident.incident_date).format('DD/MM/YYYY - HH:mm'),
        staffMemberName: incident.reporter_name,
        offenderName: namesByOffenderNumber[incident.offender_no],
      }))

      res.render('pages/incidents', {
        incidentsToDo,
      })
    })
  )

  router.get(
    '/incidents/:incidentId/statement',
    asyncMiddleware(async (req, res) => {
      const { incidentId } = req.params
      res.render('pages/statement/provide', {
        data: { incidentId },
      })
    })
  )

  router.post(
    '/incidents/:incidentId/statement',
    asyncMiddleware(async (req, res) => {
      const { incidentId } = req.params
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
