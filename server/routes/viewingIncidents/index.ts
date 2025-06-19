import express, { Router } from 'express'
import asyncMiddleware from '../../middleware/asyncMiddleware'
import ViewIncidentRoutes from './viewIncidents'
import type { Services } from '../../services'
import config from '../../config'

export default function viewingIncidentRoutes(services: Services): Router {
  const { reportService, reportDetailBuilder, reviewService, authService } = services
  const router = express.Router()
  const incidents = new ViewIncidentRoutes(reportService, reportDetailBuilder, reviewService, authService)
  const get = (path, handler) => router.get(path, asyncMiddleware(handler))

  if (config.featureFlagReportEditingEnabled) {
    get('/:incidentId/view-incident', incidents.viewIncident)
  }

  return router
}
