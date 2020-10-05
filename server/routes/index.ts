import express, { Handler, Router } from 'express'
import flash from 'connect-flash'
import bodyParser from 'body-parser'
import asyncMiddleware from '../middleware/asyncMiddleware'
import { coordinatorOnly, reviewerOrCoordinatorOnly } from '../middleware/roleCheck'

import IncidentRoutes from './incidents'
import ReviewRoutes from './reviewer'
import StatementRoutes from './statements'
import CreateReportRoutes from './createReport'
import IncidentDetailsRoutes from './incidentDetails'
import AddInvolvedStaffRoutes from './addInvolvedStaff'

import SearchForPrisonerRoutes from './searchForPrisoner'
import CheckYourAnswerRoutes from './checkYourAnswers'
import ReportUseOfForceRoutes from './reportUseOfForce'
import CoordinatorRoutes from './coordinator'
import ChangePrisonRoutes from './changePrison'
import { Services } from '../services'

export default function Index(
  authenticationMiddleware: Handler,
  {
    statementService,
    offenderService,
    prisonerSearchService,
    reportService,
    draftReportService,
    involvedStaffService,
    reviewService,
    systemToken,
    locationService,
    reportDetailBuilder,
  }: Services
): Router {
  const router = express.Router()

  const incidents = IncidentRoutes(reportService, reportDetailBuilder)

  const reviewer = ReviewRoutes({
    reviewService,
    offenderService,
    reportDetailBuilder,
    systemToken,
  })

  const statements = StatementRoutes(statementService, offenderService, systemToken)

  const createReport = new CreateReportRoutes(draftReportService)

  const incidentDetails = new IncidentDetailsRoutes(draftReportService, offenderService, systemToken, locationService)

  const addInvolvedStaff = new AddInvolvedStaffRoutes(draftReportService, systemToken)

  const checkYourAnswers = new CheckYourAnswerRoutes(draftReportService, offenderService, systemToken, locationService)

  const reportUseOfForce = ReportUseOfForceRoutes({ draftReportService, offenderService, systemToken })

  const coordinator = CoordinatorRoutes({
    reportService,
    involvedStaffService,
    systemToken,
    offenderService,
    reviewService,
  })

  const searchForPrisoner = SearchForPrisonerRoutes({ prisonerSearchService })
  const changePrison = new ChangePrisonRoutes(locationService, draftReportService, systemToken)

  const userRoutes = () => {
    const get = (path, handler) => router.get(path, asyncMiddleware(handler))
    const post = (path, handler) => router.post(path, asyncMiddleware(handler))

    const reportPath = (formName): string => `/report/:bookingId/${formName}`

    get(reportPath('report-use-of-force'), reportUseOfForce.view)

    get(reportPath('incident-details'), incidentDetails.view)
    post(reportPath('incident-details'), incidentDetails.submit)

    get(reportPath('staff-involved'), addInvolvedStaff.viewStaffInvolved)
    post(reportPath('staff-involved'), addInvolvedStaff.submitStaffInvolved)
    get(reportPath('delete-staff-member/:username'), addInvolvedStaff.viewDeleteStaffMember)
    post(reportPath('delete-staff-member/:username'), addInvolvedStaff.submitDeleteStaffMember)
    get(reportPath('staff-member-name'), addInvolvedStaff.viewStaffMemberName)
    post(reportPath('staff-member-name'), addInvolvedStaff.submitStaffMemberName)
    get(reportPath('select-staff-member'), addInvolvedStaff.viewSelectStaffMember)
    post(reportPath('select-staff-member'), addInvolvedStaff.submitSelectStaffMember)
    get(reportPath('staff-member-not-found'), addInvolvedStaff.viewStaffMemberNotFound)

    get(reportPath('change-prison'), changePrison.viewPrisons)
    post(reportPath('change-prison'), changePrison.submit)

    get(reportPath('use-of-force-details'), createReport.view('useOfForceDetails'))
    post(reportPath('use-of-force-details'), createReport.submit('useOfForceDetails'))

    get(reportPath('relocation-and-injuries'), createReport.view('relocationAndInjuries'))
    post(reportPath('relocation-and-injuries'), createReport.submit('relocationAndInjuries'))

    get(reportPath('evidence'), createReport.view('evidence'))
    post(reportPath('evidence'), createReport.submit('evidence'))

    get(reportPath('check-your-answers'), checkYourAnswers.view)
    post(reportPath('check-your-answers'), checkYourAnswers.submit)

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

    get('/completed-incidents', reviewer.viewCompletedIncidents)
    get('/not-completed-incidents', reviewer.viewNotCompletedIncidents)
    get('/:reportId/view-report', reviewer.reviewReport)
    get('/:reportId/view-statements', reviewer.reviewStatements)
    get('/:statementId/view-statement', reviewer.reviewStatement)
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

  router.use(authenticationMiddleware)
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
