const express = require('express')
const flash = require('connect-flash')
const bodyParser = require('body-parser')
const asyncMiddleware = require('../middleware/asyncMiddleware')
const IncidentRoutes = require('./incidents')
const NewIncidentRoutes = require('./newIncident')
const CheckYourAnswerRoutes = require('./checkAnswers')

module.exports = function Index({
  authenticationMiddleware,
  statementService,
  offenderService,
  reportService,
  involvedStaffService,
}) {
  const router = express.Router()

  const incidents = IncidentRoutes({ statementService, offenderService })

  const newIncidents = NewIncidentRoutes({
    reportService,
    offenderService,
    involvedStaffService,
  })

  const checkYourAnswers = CheckYourAnswerRoutes({ reportService, offenderService, involvedStaffService })

  router.use(authenticationMiddleware())
  router.use(bodyParser.urlencoded({ extended: false }))
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

  router.get('/form/incident/newIncident/:bookingId', asyncMiddleware(newIncidents.viewNewIncident))
  router.get('/form/:section/:form/:bookingId', asyncMiddleware(newIncidents.viewReportForm))
  router.post('/form/:section/:form/:bookingId', asyncMiddleware(newIncidents.updateReportForm))

  router.get('/check-answers/:bookingId', asyncMiddleware(checkYourAnswers.viewCheckYourAnswers))
  router.post('/check-answers/:bookingId', asyncMiddleware(checkYourAnswers.submit))

  return router
}
