import express, { Handler, Router } from 'express'
import flash from 'connect-flash'
import bodyParser from 'body-parser'

import creatingReportsRoutes from './creatingReports'
import maintainingReportsRoutes from './maintainingReports'
import viewingReportsRoutes from './viewingReports'
import apiRoutes from './api'

import type { Services } from '../services'

export default function Index(authenticationMiddleware: Handler, services: Services): Router {
  const router = express.Router()

  router.use(authenticationMiddleware)
  router.use(bodyParser.urlencoded({ extended: false }))
  router.use(flash())

  router.use((req, res, next) => {
    if (typeof req.csrfToken === 'function') {
      res.locals.csrfToken = req.csrfToken()
    }
    next()
  })

  router.use(creatingReportsRoutes(services))
  router.use(maintainingReportsRoutes(services))
  router.use(viewingReportsRoutes(services))

  router.use('/api/', apiRoutes(authenticationMiddleware, services))
  return router
}
