const express = require('express')
const flash = require('connect-flash')
const bodyParser = require('body-parser')
const asyncMiddleware = require('../middleware/asyncMiddleware')
const { coordinatorOnly, reviewerOrCoordinatorOnly } = require('../middleware/roleCheck')

const CreateIncidentRoutes = require('./incidents')
const CreateStatementRoutes = require('./statements')
const CreateReportRoutes = require('./createReport')
const CreateCheckYourAnswerRoutes = require('./checkYourAnswers')
const CreateReportUseOfForceRoutes = require('./reportUseOfForce')
const CreateCoordinatorRoutes = require('./coordinator')

module.exports = function Index({
  authenticationMiddleware,
  statementService,
  offenderService,
  reportService,
  involvedStaffService,
  reviewService,
  systemToken,
}) {
  const router = express.Router()

  const incidents = CreateIncidentRoutes({
    reportService,
    involvedStaffService,
    offenderService,
    reviewService,
    systemToken,
  })

  const statements = CreateStatementRoutes({ statementService, offenderService, systemToken })

  const createReport = CreateReportRoutes({
    reportService,
    offenderService,
    involvedStaffService,
    systemToken,
  })

  const checkYourAnswers = CreateCheckYourAnswerRoutes({
    reportService,
    offenderService,
    involvedStaffService,
    systemToken,
  })

  const reportUseOfForce = CreateReportUseOfForceRoutes({ reportService, offenderService, systemToken })

  const coordinator = CreateCoordinatorRoutes({
    reportService,
    involvedStaffService,
    systemToken,
    offenderService,
    reviewService,
  })

  const userRoutes = () => {
    const get = (path, handler) => router.get(path, asyncMiddleware(handler))
    const post = (path, handler) => router.post(path, asyncMiddleware(handler))

    const reportPath = formName => `/report/:bookingId/${formName}`

    get(reportPath('report-use-of-force'), reportUseOfForce.view)

    get(reportPath('incident-details'), createReport.viewIncidentDetails({ edit: false }))
    post(reportPath('incident-details'), createReport.submit('incidentDetails'))
    get(reportPath('edit-incident-details'), createReport.viewIncidentDetails({ edit: true }))
    post(reportPath('edit-incident-details'), createReport.submitEdit('incidentDetails'))

    get(reportPath('username-does-not-exist'), createReport.viewUsernameDoesNotExist)
    post(reportPath('username-does-not-exist'), createReport.submitUsernameDoesNotExist)

    get(reportPath('email-not-verified'), createReport.viewUnverifiedEmails)

    get(reportPath('use-of-force-details'), createReport.view('useOfForceDetails'))
    post(reportPath('use-of-force-details'), createReport.submit('useOfForceDetails'))
    get(reportPath('edit-use-of-force-details'), createReport.viewEdit('useOfForceDetails'))
    post(reportPath('edit-use-of-force-details'), createReport.submitEdit('useOfForceDetails'))

    get(reportPath('relocation-and-injuries'), createReport.view('relocationAndInjuries'))
    post(reportPath('relocation-and-injuries'), createReport.submit('relocationAndInjuries'))
    get(reportPath('edit-relocation-and-injuries'), createReport.viewEdit('relocationAndInjuries'))
    post(reportPath('edit-relocation-and-injuries'), createReport.submitEdit('relocationAndInjuries'))

    get(reportPath('evidence'), createReport.view('evidence'))
    post(reportPath('evidence'), createReport.submit('evidence'))
    get(reportPath('edit-evidence'), createReport.viewEdit('evidence'))
    post(reportPath('edit-evidence'), createReport.submitEdit('evidence'))

    get(reportPath('check-your-answers'), checkYourAnswers.view)
    post(reportPath('check-your-answers'), checkYourAnswers.submit)
    get(`${reportPath('cancel-edit')}/:formName`, createReport.cancelEdit)

    get('/:reportId/report-sent', incidents.viewReportSent)

    get('/', incidents.redirectToHomePage)
    get('/your-reports', incidents.viewYourReports)
    get('/:reportId/your-report', incidents.viewYourReport)

    get('/your-statements', statements.viewYourStatements)
    get('/:reportId/write-your-statement', statements.viewWriteYourStatement)
    post('/:reportId/write-your-statement', statements.submitWriteYourStatement)
    get('/:reportId/check-your-statement', statements.viewCheckYourStatement)
    post('/:reportId/check-your-statement', statements.submitCheckYourStatement)
    get('/:reportId/statement-submitted', statements.viewStatementSubmitted)
    get('/:reportId/your-statement', statements.viewYourStatement)
    get('/:reportId/add-comment-to-statement', statements.viewAddCommentToStatement)
    post('/:reportId/add-comment-to-statement', statements.saveAdditionalComment)
  }

  const reviewerRoutes = () => {
    const get = (path, handler) => router.get(path, reviewerOrCoordinatorOnly, asyncMiddleware(handler))

    get('/all-incidents', incidents.viewAllIncidents)
    get('/:reportId/view-report', incidents.reviewReport)
    get('/:reportId/view-statements', incidents.reviewStatements)
    get('/:statementId/view-statement', incidents.reviewStatement)
  }

  const coordinatorRoutes = () => {
    const get = (path, handler) => router.get(path, coordinatorOnly, asyncMiddleware(handler))
    const post = (path, handler) => router.post(path, coordinatorOnly, asyncMiddleware(handler))

    get('/coordinator/report/:reportId/confirm-delete', coordinator.confirmDeleteReport)
    post('/coordinator/report/:reportId/delete', coordinator.deleteReport)

    get('/coordinator/report/:reportId/add-staff', coordinator.viewAddInvolvedStaff)
    post('/coordinator/report/:reportId/add-staff', coordinator.submitAddInvolvedStaff)
    get('/coordinator/report/:reportId/add-staff/result/:result', coordinator.viewAddInvolvedStaffResult)

    get('/coordinator/report/:reportId/statement/:statementId/confirm-delete', coordinator.confirmDeleteStatement)
    post('/coordinator/report/:reportId/statement/:statementId/delete', coordinator.deleteStatement)
  }

  router.use(authenticationMiddleware())
  router.use(bodyParser.urlencoded({ extended: false }))
  router.use(flash())

  router.use((req, res, next) => {
    if (typeof req.csrfToken === 'function') {
      res.locals.csrfToken = req.csrfToken()
    }
    next()
  })

  userRoutes()
  reviewerRoutes()
  coordinatorRoutes()

  return router
}
