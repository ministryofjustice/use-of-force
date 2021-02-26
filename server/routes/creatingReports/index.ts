import express, { Router } from 'express'
import asyncMiddleware from '../../middleware/asyncMiddleware'

import CreateReportRoutes from './createReport'
import IncidentDetailsRoutes from './incidentDetails'
import AddInvolvedStaffRoutes from './addInvolvedStaff'
import SearchForPrisonerRoutes from './searchForPrisoner'
import CheckYourAnswerRoutes from './checkYourAnswers'
import ReportUseOfForceRoutes from './reportUseOfForce'
import ChangePrisonRoutes from './changePrison'

import type { Services } from '../../services'

export default function Index({
  offenderService,
  draftReportService,
  systemToken,
  locationService,
  prisonerSearchService,
}: Services): Router {
  const router = express.Router()

  const get = (path, handler) => router.get(path, asyncMiddleware(handler))
  const post = (path, handler) => router.post(path, asyncMiddleware(handler))

  const reportPath = (formName): string => `/report/:bookingId/${formName}`

  const searchForPrisoner = new SearchForPrisonerRoutes(prisonerSearchService)
  get('/search-for-prisoner', searchForPrisoner.view)
  get('/search-for-prisoner-results', searchForPrisoner.showResults)
  post('/search-for-prisoner', searchForPrisoner.submit)

  const reportUseOfForce = ReportUseOfForceRoutes({ draftReportService, offenderService, systemToken })
  get(reportPath('report-use-of-force'), reportUseOfForce.view)

  const incidentDetails = new IncidentDetailsRoutes(draftReportService, offenderService, systemToken, locationService)
  get(reportPath('incident-details'), incidentDetails.view)
  post(reportPath('incident-details'), incidentDetails.submit)

  const addInvolvedStaff = new AddInvolvedStaffRoutes(draftReportService, systemToken)
  get(reportPath('staff-involved'), addInvolvedStaff.viewStaffInvolved)
  post(reportPath('staff-involved'), addInvolvedStaff.submitStaffInvolved)
  get(reportPath('delete-staff-member/:username'), addInvolvedStaff.viewDeleteStaffMember)
  post(reportPath('delete-staff-member/:username'), addInvolvedStaff.submitDeleteStaffMember)
  get(reportPath('staff-member-name'), addInvolvedStaff.viewStaffMemberName)
  post(reportPath('staff-member-name'), addInvolvedStaff.submitStaffMemberName)
  get(reportPath('select-staff-member'), addInvolvedStaff.viewSelectStaffMember)
  post(reportPath('select-staff-member'), addInvolvedStaff.submitSelectStaffMember)
  get(reportPath('staff-member-not-found'), addInvolvedStaff.viewStaffMemberNotFound)

  const changePrison = new ChangePrisonRoutes(locationService, draftReportService, systemToken)
  get(reportPath('change-prison'), changePrison.viewPrisons)
  post(reportPath('change-prison'), changePrison.submit)

  const createReport = new CreateReportRoutes(draftReportService)
  get(reportPath('use-of-force-details'), createReport.view('useOfForceDetails'))
  post(reportPath('use-of-force-details'), createReport.submit('useOfForceDetails'))
  get(reportPath('relocation-and-injuries'), createReport.view('relocationAndInjuries'))
  post(reportPath('relocation-and-injuries'), createReport.submit('relocationAndInjuries'))
  get(reportPath('evidence'), createReport.view('evidence'))
  post(reportPath('evidence'), createReport.submit('evidence'))

  const checkYourAnswers = new CheckYourAnswerRoutes(draftReportService, offenderService, systemToken, locationService)
  get(reportPath('check-your-answers'), checkYourAnswers.view)
  post(reportPath('check-your-answers'), checkYourAnswers.submit)
  get('/:reportId/report-sent', checkYourAnswers.viewReportSent)

  return router
}
