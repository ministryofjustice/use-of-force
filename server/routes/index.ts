import express from 'express'
import flash from 'connect-flash'
import bodyParser from 'body-parser'
import asyncMiddleware from '../middleware/asyncMiddleware'
import { coordinatorOnly, reviewerOrCoordinatorOnly } from '../middleware/roleCheck'

import CreateIncidentRoutes from './incidents'
import CreateStatementRoutes from './statements'
import CreateReportRoutes from './createReport'
import CreateSearchForPrisonerRoutes from './searchForPrisoner'
import CreateCheckYourAnswerRoutes from './checkYourAnswers'
import CreateReportUseOfForceRoutes from './reportUseOfForce'
import CreateCoordinatorRoutes from './coordinator'
import CreateChangePrisonRoutes from './changePrison'

export default function Index({
  authenticationMiddleware,
  statementService,
  offenderService,
  prisonerSearchService,
  reportService,
  involvedStaffService,
  reviewService,
  systemToken,
  locationService,
}) {
  const router = express.Router()

  const incidents = CreateIncidentRoutes({
    reportService,
    involvedStaffService,
    locationService,
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
    locationService,
  })

  const checkYourAnswers = CreateCheckYourAnswerRoutes({
    reportService,
    offenderService,
    involvedStaffService,
    systemToken,
    locationService,
  })

  const reportUseOfForce = CreateReportUseOfForceRoutes({ reportService, offenderService, systemToken })

  const coordinator = CreateCoordinatorRoutes({
    reportService,
    involvedStaffService,
    systemToken,
    offenderService,
    reviewService,
  })

  const searchForPrisoner = CreateSearchForPrisonerRoutes({ prisonerSearchService })
  const changePrison = CreateChangePrisonRoutes({
    locationService,
    reportService,
    systemToken,
  })

  const userRoutes = () => {
    const get = (path, handler) => router.get(path, asyncMiddleware(handler))
    const post = (path, handler) => router.post(path, asyncMiddleware(handler))

    const reportPath = (formName): string => `/report/:bookingId/${formName}`

    get(reportPath('report-use-of-force'), reportUseOfForce.view)

    get(reportPath('incident-details'), createReport.viewIncidentDetails({ edit: false }))
    post(reportPath('incident-details'), createReport.submit('incidentDetails'))
    get(reportPath('edit-incident-details'), createReport.viewIncidentDetails({ edit: true }))
    post(reportPath('edit-incident-details'), createReport.submitEdit('incidentDetails'))

    get(reportPath('change-prison'), changePrison.viewPrisons({ edit: false }))
    post(reportPath('change-prison'), changePrison.submit)
    get(reportPath('edit-change-prison'), changePrison.viewPrisons({ edit: true }))
    post(reportPath('edit-change-prison'), changePrison.submitEdit)

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

    get('/search-for-prisoner', searchForPrisoner.view)
    get('/search-for-prisoner-results', searchForPrisoner.showResults)
    post('/search-for-prisoner', searchForPrisoner.submit)
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
