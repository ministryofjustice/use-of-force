const express = require('express')
const flash = require('connect-flash')
const bodyParser = require('body-parser')
const asyncMiddleware = require('../middleware/asyncMiddleware')
const IncidentRoutes = require('./incidents')
const CreateReportRoutes = require('./createReport')
const CheckYourAnswerRoutes = require('./checkYourAnswers')
const ReportUseOfForce = require('./reportUseOfForce')

module.exports = function Index({
  authenticationMiddleware,
  statementService,
  offenderService,
  reportService,
  involvedStaffService,
}) {
  const router = express.Router()

  const incidents = IncidentRoutes({ statementService, offenderService })

  const createReport = CreateReportRoutes({
    reportService,
    offenderService,
    involvedStaffService,
  })

  const checkYourAnswers = CheckYourAnswerRoutes({ reportService, offenderService, involvedStaffService })

  const reportUseOfForce = ReportUseOfForce({ reportService, offenderService })

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

  get(reportPath('report-use-of-force'), reportUseOfForce.view)

  get(reportPath('incident-details'), createReport.viewIncidentDetails)
  post(reportPath('incident-details'), createReport.submit('incidentDetails'))
  get(reportPath('use-of-force-details'), createReport.view('useOfForceDetails'))
  post(reportPath('use-of-force-details'), createReport.submit('useOfForceDetails'))
  get(reportPath('relocation-and-injuries'), createReport.view('relocationAndInjuries'))
  post(reportPath('relocation-and-injuries'), createReport.submit('relocationAndInjuries'))
  get(reportPath('evidence'), createReport.view('evidence'))
  post(reportPath('evidence'), createReport.submit('evidence'))

  get(reportPath('check-your-answers'), checkYourAnswers.view)
  post(reportPath('check-your-answers'), checkYourAnswers.submit)

  get('/:reportId/report-sent', incidents.viewReportSent)

  get('/', incidents.viewIncidents)
  get('/:reportId/write-your-statement', incidents.viewWriteYourStatement)
  post('/:reportId/write-your-statement', incidents.submitWriteYourStatement)
  get('/:reportId/check-your-statement', incidents.viewCheckYourStatement)
  post('/:reportId/check-your-statement', incidents.submitCheckYourStatement)
  get('/:reportId/statement-submitted', incidents.viewStatementSubmitted)
  get('/:reportId/your-statement', incidents.viewYourStatement)

  return router
}
