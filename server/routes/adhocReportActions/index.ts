import express, { Router } from 'express'
import asyncMiddleware from '../../middleware/asyncMiddleware'

import AddhocActionController from './addhocActionController'
import { Services } from '../../services'

export default function adhocReportActionRoutes(services: Services): Router {
  const { nomisMappingService, reportService, systemToken } = services

  const router = express.Router()

  const controller = new AddhocActionController(reportService, nomisMappingService, systemToken)

  router.get('/update-location-id/:fromReportId/:toReportId', controller.updateReport)

  return router
}
