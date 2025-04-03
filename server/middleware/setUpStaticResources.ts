import path from 'path'
import compression from 'compression'
import express, { Router } from 'express'
import noCache from 'nocache'

import config from '../config'

export default function setUpStaticResources(): Router {
  const router = express.Router()

  router.use(compression())

  //  Static Resources Configuration
  const staticResourcesConfig = { maxAge: config.staticResourceCacheDuration, redirect: false }

  Array.of(
    '/dist/assets',
    '/node_modules/govuk-frontend/dist/govuk/assets',
    '/node_modules/govuk-frontend/dist',
    '/node_modules/@ministryofjustice/frontend/moj/assets',
    '/node_modules/@ministryofjustice/frontend',
  ).forEach(dir => {
    router.use('/assets', express.static(path.join(process.cwd(), dir), staticResourcesConfig))
  })

  // Don't cache dynamic resources
  router.use(noCache())
  router.use('/favicon.ico', express.static(path.join(process.cwd(), `/assets/images/favicon.ico`), staticResourcesConfig))
  
  router.use(
      '/assets/images/icons',
      express.static(path.join(process.cwd(), `/node_modules/govuk_frontend_toolkit/images`), staticResourcesConfig)
    )

  return router
}
