import express, { Handler, Router } from 'express'
import flash from 'connect-flash'

import creatingReportsRoutes from './creatingReports'
import maintainingReportsRoutes from './maintainingReports'
import viewingReportsRoutes from './viewingReports'
import apiRoutes from './api'
import csrf from '../middleware/csrfMiddleware'

import type { Services } from '../services'

export default function Index(authenticationMiddleware: Handler, services: Services): Router {
  const router = express.Router()

  router.use(express.urlencoded({ extended: false }))
  router.use(flash())

  router.use(authenticationMiddleware)

  router.use(csrf())

  router.use(creatingReportsRoutes(services))
  router.use(maintainingReportsRoutes(services))
  router.use(viewingReportsRoutes(services))

  router.use('/api/', apiRoutes(authenticationMiddleware, services))
  return router
}
