import express, { Router } from 'express'

import {
  monitoringMiddleware,
  endpointHealthComponent,
  EndpointHealthComponentOptions,
} from '@ministryofjustice/hmpps-monitoring'
import type { ApplicationInfo } from '../applicationInfo'
import logger from '../../logger'
import config from '../config'

export default function setUpHealthChecks(applicationInfo: ApplicationInfo): Router {
  const router = express.Router()

  const apiConfig = Object.entries(config.apis).filter(
    ([, options]) =>
      typeof options === 'object' && options !== null && typeof (options as Record<string, unknown>).url === 'string',
  )

  const middleware = monitoringMiddleware({
    applicationInfo,
    healthComponents: apiConfig.map(([name, options]) =>
      endpointHealthComponent(logger, name, options as EndpointHealthComponentOptions),
    ),
  })

  router.get('/health', middleware.health)
  router.get('/info', middleware.info)
  router.get('/ping', middleware.ping)

  return router
}
