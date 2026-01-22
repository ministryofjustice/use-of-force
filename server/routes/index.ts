import express, { Handler, Router } from 'express'
import flash from 'connect-flash'

import creatingReportsRoutes from './creatingReports'
import maintainingReportsRoutes from './maintainingReports'
import viewingReportsRoutes from './viewingReports'
import viewingIncidentRoutes from './viewingIncidents'
import apiRoutes from './api'

import type { Services } from '../services'

export default function Index(authenticationMiddleware: Handler, services: Services): Router {
  const router = express.Router()

  router.use(express.urlencoded({ extended: false }))
  router.use(flash())

  router.use(authenticationMiddleware)
  router.use(creatingReportsRoutes(services))
  router.use(maintainingReportsRoutes(services))
  router.use(viewingReportsRoutes(services))
  router.use(viewingIncidentRoutes(services))

  router.use('/api/', apiRoutes(authenticationMiddleware, services))
  return router
}
