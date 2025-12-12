import express, { Router } from 'express'
import asyncMiddleware from '../../middleware/asyncMiddleware'
import { coordinatorOnly, reviewerOrCoordinatorOnly } from '../../middleware/roleCheck'

import ReviewRoutes from './reviewer'
import CoordinatorRoutes from './coordinator'
import config from '../../config'

import { Services } from '../../services'

export default function Index(services: Services): Router {
  const {
    offenderService,
    reportService,
    involvedStaffService,
    reviewService,
    reportDetailBuilder,
    userService,
    statementService,
    authService,
    locationService,
    reportEditService,
  } = services

  const router = express.Router()

  {
    const reviewer = new ReviewRoutes(offenderService, reportDetailBuilder, reviewService, authService)

    const get = (path, handler) => router.get(path, reviewerOrCoordinatorOnly, asyncMiddleware(handler))

    get('/completed-incidents', reviewer.viewCompletedIncidents)
    get('/not-completed-incidents', reviewer.viewNotCompletedIncidents)
    get('/:reportId/view-report', reviewer.reviewReport)
    get('/:reportId/view-statements', reviewer.reviewStatements)
    get('/:statementId/view-statement', reviewer.reviewStatement)
  }

  {
    const coordinator = new CoordinatorRoutes(
      reportService,
      involvedStaffService,
      reviewService,
      offenderService,
      userService,
      statementService,
      authService,
      locationService,
      reportDetailBuilder,
      reportEditService
    )
    const get = (path, handler) => router.get(path, coordinatorOnly, asyncMiddleware(handler))
    const post = (path, handler) => router.post(path, coordinatorOnly, asyncMiddleware(handler))

    if (config.featureFlagReportEditingEnabled) {
      get('/:reportId/edit-report', coordinator.viewEditReport)
      get('/:reportId/delete-incident', coordinator.viewDeleteIncident)
      post('/:reportId/delete-incident', coordinator.submitDeleteIncident)
      get('/:reportId/reason-for-deleting-report', coordinator.viewReasonForDeletingIncident)
      post('/:reportId/reason-for-deleting-report', coordinator.submitReasonForDeletingIncident)
      get('/:reportId/delete-incident-success', coordinator.viewDeleteIncidentSuccess)
      get('/:reportId/edit-report/incident-details', coordinator.viewEditIncidentDetails)
      post('/:reportId/edit-report/incident-details', coordinator.submitEditIncidentDetails)
      get('/:reportId/edit-report/why-was-uof-applied', coordinator.viewEditWhyWasUOFApplied)
      post('/:reportId/edit-report/why-was-uof-applied', coordinator.submitEditWhyWasUOFApplied)
      get('/:reportId/edit-report/what-was-the-primary-reason-of-uof', coordinator.viewEditPrimaryReasonForUof)
      post('/:reportId/edit-report/what-was-the-primary-reason-of-uof', coordinator.submitEditPrimaryReasonForUof)
      get('/:reportId/edit-report/use-of-force-details', coordinator.viewEditUseOfForceDetails)
      post('/:reportId/edit-report/use-of-force-details', coordinator.submitEditUseOfForceDetails)
      get('/:reportId/edit-report/relocation-and-injuries', coordinator.viewEditRelocationAndInjuries)
      post('/:reportId/edit-report/relocation-and-injuries', coordinator.submitEditRelocationAndInjuries)
      get('/:reportId/edit-report/evidence', coordinator.viewEditEvidence)
      post('/:reportId/edit-report/evidence', coordinator.submitEditEvidence)
      get('/:reportId/edit-report/prison', coordinator.viewEditPrison)
      post('/:reportId/edit-report/prison', coordinator.submitEditPrison)
      get('/:reportId/edit-report/reason-for-change', coordinator.viewReasonForChange)
      post('/:reportId/edit-report/reason-for-change', coordinator.submitReasonForChange)
      get('/:reportId/edit-report/staff-involved', coordinator.viewInvolvedStaff)
      get('/:reportId/edit-report/staff-involved-search', coordinator.viewInvolvedStaffSearch)
      post('/:reportId/edit-report/staff-involved-search', coordinator.submitInvolvedStaffSearch)
      get('/:reportId/edit-report/staff-involved-search/no-results', coordinator.viewNoResultsFoundInvolvedStaffSearch)
      get('/:reportId/edit-report/add-new-staff-involved/:username', coordinator.editViewAddNewInvolvedStaffMember)
      post('/:reportId/edit-report/add-new-staff-involved/:username', coordinator.submitAddNewInvolvedStaffMember)
      get('/:reportId/statement/:statementId/confirm-delete/:username', coordinator.confirmDeleteStatement)
      post('/:reportId/statement/:statementId/confirm-delete/:username', coordinator.submitDeleteStatement)
    }

    get('/coordinator/report/:reportId/confirm-delete', coordinator.confirmDeleteReport)
    post('/coordinator/report/:reportId/delete', coordinator.deleteReport)

    get('/coordinator/report/:reportId/add-staff', coordinator.viewAddInvolvedStaff)
    post('/coordinator/report/:reportId/add-staff', coordinator.submitAddInvolvedStaff)
    get('/coordinator/report/:reportId/add-staff/result/:result', coordinator.viewAddInvolvedStaffResult)

    get('/coordinator/report/:reportId/statement/:statementId/confirm-delete', coordinator.confirmDeleteStatement)
    post('/coordinator/report/:reportId/statement/:statementId/delete', coordinator.deleteStatement)

    get('/coordinator/report/:reportId/statement/:statementId/view-removal-request', coordinator.viewRemovalRequest)
    post('/coordinator/report/:reportId/statement/:statementId/view-removal-request', coordinator.submitRemovalRequest)

    get(
      '/coordinator/report/:reportId/statement/:statementId/staff-member-not-removed',
      coordinator.viewStaffMemberNotRemoved
    )
  }

  return router
}
