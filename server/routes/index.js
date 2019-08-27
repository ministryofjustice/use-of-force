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

  const reportPath = formName => `/report/:bookingId/${formName}`

  const get = (path, handler) => router.get(path, asyncMiddleware(handler))
  const post = (path, handler) => router.post(path, asyncMiddleware(handler))

  get(reportPath('report-use-of-force'), tasklist.viewTasklist)

  get(reportPath('incident-details'), newIncidents.viewNewIncident)
  post(reportPath('incident-details'), newIncidents.updateForm('newIncident'))
  get(reportPath('use-of-force-details'), newIncidents.viewForm('details'))
  post(reportPath('use-of-force-details'), newIncidents.updateForm('details'))
  get(reportPath('relocation-and-injuries'), newIncidents.viewForm('relocationAndInjuries'))
  post(reportPath('relocation-and-injuries'), newIncidents.updateForm('relocationAndInjuries'))
  get(reportPath('evidence'), newIncidents.viewForm('evidence'))
  post(reportPath('evidence'), newIncidents.updateForm('evidence'))

  get(reportPath('check-your-answers'), checkYourAnswers.viewCheckYourAnswers)
  post(reportPath('check-your-answers'), checkYourAnswers.submit)

  get('/:reportId/report-sent', incidents.viewReportCreated)

  get('/', incidents.viewIncidents)
  get('/:reportId/write-your-statement', incidents.viewStatementEntry)
  post('/:reportId/write-your-statement', incidents.enterStatement)
  get('/:reportId/check-your-statement', incidents.viewConfirmation)
  post('/:reportId/check-your-statement', incidents.confirmStatement)
  get('/:reportId/statement-submitted', incidents.viewSubmitted)
  get('/:reportId/your-statement', incidents.reviewStatement)

  return router
}
