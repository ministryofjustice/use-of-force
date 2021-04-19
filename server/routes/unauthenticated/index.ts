import express, { Router } from 'express'
import flash from 'connect-flash'
import asyncMiddleware from '../../middleware/asyncMiddleware'

import type { Services } from '../../services'
import RemovalRequest from './requestRemoval'
import csrf from '../../middleware/csrfMiddleware'

export default function UnauthenticatedRoutes(services: Services): Router {
  const { reportService, statementService, systemToken } = services

  const router = express.Router()

  const removalRequest = new RemovalRequest(reportService, statementService, systemToken)
  router.get('/request-removal/:statementId', flash(), csrf(), asyncMiddleware(removalRequest.view))
  router.post('/request-removal/:statementId', flash(), asyncMiddleware(removalRequest.submit))

  router.get('/removal-requested', removalRequest.viewConfirmation)
  router.get('/already-removed', asyncMiddleware(removalRequest.viewAlreadyRemoved))
  router.get('/removal-already-requested', asyncMiddleware(removalRequest.viewRemovalAlreadyRequested))

  return router
}
