const express = require('express')
const flash = require('connect-flash')
const asyncMiddleware = require('../middleware/asyncMiddleware')
const IncidentRoutes = require('./incidents')

module.exports = function Index({ authenticationMiddleware, statementService, offenderService }) {
  const router = express.Router()

  const incidents = IncidentRoutes({ statementService, offenderService })

  router.use(authenticationMiddleware())
  router.use(flash())

  router.use((req, res, next) => {
    if (typeof req.csrfToken === 'function') {
      res.locals.csrfToken = req.csrfToken()
    }
    next()
  })

  router.get('/', incidents.redirectToViewIncidents)
  router.get('/incidents/', asyncMiddleware(incidents.viewIncidents))
  router.get('/incidents/:reportId/statement', asyncMiddleware(incidents.viewStatementEntry))
  router.post('/incidents/:reportId/statement', asyncMiddleware(incidents.enterStatement))
  router.get('/incidents/:reportId/statement/confirm', asyncMiddleware(incidents.viewConfirmation))
  router.post('/incidents/:reportId/statement/confirm', asyncMiddleware(incidents.confirmStatement))
  router.get('/incidents/:reportId/statement/submitted', asyncMiddleware(incidents.viewSubmitted))
  router.get('/incidents/:reportId/statement/review', asyncMiddleware(incidents.reviewStatement))

  return router
}
