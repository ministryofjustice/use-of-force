const express = require('express')
const asyncMiddleware = require('../middleware/asyncMiddleware')

module.exports = function Index({ authenticationMiddleware, formService }) {
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

  router.get(
    '/incidents/',
    asyncMiddleware(async (req, res) => {
      // TODO: retrieve correct values here
      const incidents = await formService.getIncidentsForUser(req.user.username, 'SUBMITTED')
      const incidentsToDo = incidents.map(incident => ({
        id: incident.id,
        date: incident.start_date,
        staffMemberName: incident.user_id,
        offenderName: incident.booking_id,
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
