import express, { Router } from 'express'
import asyncMiddleware from '../../middleware/asyncMiddleware'
import { adminOnly, coordinatorOnly, reviewerOrCoordinatorOnly } from '../../middleware/roleCheck'

import ReviewRoutes from './reviewer'
import CoordinatorRoutes from './coordinator'
import AdminRoutes from './admin'
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
      reportDetailBuilder
    )
    const get = (path, handler) => router.get(path, coordinatorOnly, asyncMiddleware(handler))
    const post = (path, handler) => router.post(path, coordinatorOnly, asyncMiddleware(handler))

    if (config.featureFlagReportEditingEnabled) {
      get('/:reportId/edit-report', coordinator.viewEditReport)
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

  {
    const admin = new AdminRoutes(reportService, reviewService, offenderService, authService)
    const get = (path, handler) => router.get(path, adminOnly, asyncMiddleware(handler))
    const post = (path, handler) => router.post(path, adminOnly, asyncMiddleware(handler))

    get('/:reportId/edit-report', admin.viewEditReport)
    get('/:reportId/edit-report/:formName', admin.viewEditForm)
    post('/:reportId/edit-report/:formName', admin.submitEditForm)
  }

  return router
}
