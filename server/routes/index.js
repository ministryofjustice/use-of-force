const express = require('express')
const flash = require('connect-flash')
const bodyParser = require('body-parser')
const asyncMiddleware = require('../middleware/asyncMiddleware')
const IncidentRoutes = require('./incidents')
const NewIncidentRoutes = require('./newIncident')
const CheckYourAnswerRoutes = require('./checkAnswers')
const TasklistRoutes = require('./tasklist')

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

  const tasklist = TasklistRoutes({ reportService, offenderService })

  router.use(authenticationMiddleware())
  router.use(bodyParser.urlencoded({ extended: false }))
  router.use(flash())

  router.use((req, res, next) => {
    if (typeof req.csrfToken === 'function') {
      res.locals.csrfToken = req.csrfToken()
    }
    next()
  })

  router.get('/tasklist/:bookingId', asyncMiddleware(tasklist.viewTasklist))

  const formPath = formName => `/report/:bookingId/${formName}`

  router.get(formPath('incident-details'), asyncMiddleware(newIncidents.viewNewIncident))
  router.post(formPath('incident-details'), asyncMiddleware(newIncidents.updateForm('newIncident')))
  router.get(formPath('use-of-force-details'), asyncMiddleware(newIncidents.viewForm('details')))
  router.post(formPath('use-of-force-details'), asyncMiddleware(newIncidents.updateForm('details')))
  router.get(formPath('relocation-and-injuries'), asyncMiddleware(newIncidents.viewForm('relocationAndInjuries')))
  router.post(formPath('relocation-and-injuries'), asyncMiddleware(newIncidents.updateForm('relocationAndInjuries')))
  router.get(formPath('evidence'), asyncMiddleware(newIncidents.viewForm('evidence')))
  router.post(formPath('evidence'), asyncMiddleware(newIncidents.updateForm('evidence')))

  router.get('/check-answers/:bookingId', asyncMiddleware(checkYourAnswers.viewCheckYourAnswers))
  router.post('/check-answers/:bookingId', asyncMiddleware(checkYourAnswers.submit))

  router.get('/submitted/:reportId', asyncMiddleware(incidents.viewReportCreated))

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
