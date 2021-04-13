import express, { Router } from 'express'

import asyncMiddleware from '../../middleware/asyncMiddleware'
import { coordinatorOnly, reviewerOrCoordinatorOnly } from '../../middleware/roleCheck'

import ReviewRoutes from './reviewer'
import CoordinatorRoutes from './coordinator'

import { Services } from '../../services'

export default function Index(services: Services): Router {
  const {
    offenderService,
    reportService,
    involvedStaffService,
    reviewService,
    systemToken,
    reportDetailBuilder,
    userService,
    statementService,
  } = services

  const router = express.Router()

  {
    const reviewer = new ReviewRoutes(offenderService, reportDetailBuilder, reviewService, systemToken)

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
      systemToken,
      userService,
      statementService
    )
    const get = (path, handler) => router.get(path, coordinatorOnly, asyncMiddleware(handler))
    const post = (path, handler) => router.post(path, coordinatorOnly, asyncMiddleware(handler))

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

    return router
  }
}
