import express, { Express, RequestHandler, Response, Request } from 'express'
import { v4 as uuidv4 } from 'uuid'
import helmet from 'helmet'
import noCache from 'nocache'
import path from 'path'
import moment from 'moment'
import compression from 'compression'
import passport from 'passport'
import crypto from 'crypto'
import createError from 'http-errors'
import session from 'express-session'
import ConnectRedis from 'connect-redis'
import setUpCsrf from './middleware/setUpCsrf'
import { createRedisClient } from './data/redisClient'

import createRouter from './routes'
import nunjucksSetup from './utils/nunjucksSetup'
import { Services } from './services'

import tokenVerifierFactory from './authentication/tokenverifier/tokenVerifierFactory'
import healthcheckFactory from './services/healthcheck'

import logger from '../log'
import { authenticationMiddlewareFactory, initialisePassportStrategy } from './authentication/auth'
import populateCurrentUser from './middleware/populateCurrentUser'
import authorisationMiddleware from './middleware/authorisationMiddleware'
import errorHandler from './errorHandler'

import config from './config'
import unauthenticatedRoutes from './routes/unauthenticated'
import asyncMiddleware from './middleware/asyncMiddleware'
import getFrontendComponents from './middleware/feComponentsMiddleware'
import setUpEnvironmentName from './middleware/setUpEnvironmentName'
import setUpWebSession from './middleware/setUpWebSession'

const authenticationMiddleware: RequestHandler = authenticationMiddlewareFactory(
  tokenVerifierFactory(config.apis.tokenVerification)
)

const version = moment.now().toString()
const production = process.env.NODE_ENV === 'production'

export default function createApp(services: Services): Express {
  const app = express()
  console.log('Hello')

  initialisePassportStrategy(services.signInService)

  app.set('json spaces', 2)

  // Configure Express for running behind proxies
  // https://expressjs.com/en/guide/behind-proxies.html
  app.set('trust proxy', true)

  // View Engine Configuration
  app.set('view engine', 'html')

  setUpEnvironmentName(app)

  nunjucksSetup(app)

  // Server Configuration
  app.set('port', process.env.PORT || 3000)

  // Secure code best practice - see:
  // 1. https://expressjs.com/en/advanced/best-practice-security.html,
  // 2. https://www.npmjs.com/package/helmet
  app.use((req, res, next) => {
    res.locals.cspNonce = crypto.randomBytes(16).toString('base64')
    next()
  })

  const scriptSrc = [
    "'self'",
    'code.jquery.com',
    "'sha256-+6WnXIl4mbFTCARd8N3COQmT3bJJmo32N8q8ZSQAIcU='",
    (_req: Request, res: Response) => `'nonce-${res.locals.cspNonce}'`,
  ]
  const styleSrc = ["'self'", 'code.jquery.com', (_req: Request, res: Response) => `'nonce-${res.locals.cspNonce}'`]
  const imgSrc = ["'self'", 'data:', 'www.googletagmanager.com', 'www.google-analytics.com', 'https://code.jquery.com']
  const fontSrc = ["'self'"]
  const connectSrc = [
    "'self'",
    'www.googletagmanager.com',
    'www.google-analytics.com',
    'region1.google-analytics.com',
    'region1.analytics.google.com',
    'stats.g.doubleclick.net',
  ]

  if (config.apis.frontendComponents.url) {
    scriptSrc.push(config.apis.frontendComponents.url)
    styleSrc.push(config.apis.frontendComponents.url)
    imgSrc.push(config.apis.frontendComponents.url)
    fontSrc.push(config.apis.frontendComponents.url)
  }

  app.use(
    helmet({
      crossOriginEmbedderPolicy: false,
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          // Hash allows inline script pulled in from https://github.com/alphagov/govuk-frontend/blob/master/src/govuk/template.njk
          scriptSrc,
          imgSrc,
          connectSrc,
          styleSrc,
          fontSrc,
        },
      },
    })
  )
  app.use(setUpWebSession())
  app.use(passport.initialize())
  app.use(passport.session())

  // Request Processing Configuration
  app.use(express.json())
  app.use(express.urlencoded({ extended: true }))

  // Resource Delivery Configuration
  app.use(compression())

  // Cachebusting version string
  if (production) {
    // Version only changes on reboot
    app.locals.version = version
  } else {
    // Version changes every request
    app.use((req, res, next) => {
      res.locals.version = moment.now().toString()
      return next()
    })
  }

  //  Static Resources Configuration
  const cacheControl = { maxAge: config.staticResourceCacheDuration }

  ;[
    '/assets',
    '/assets/stylesheets',
    '/assets/js',
    `/node_modules/govuk-frontend/govuk/assets`,
    `/node_modules/govuk-frontend/dist`,
    `/node_modules/@ministryofjustice/frontend/`,
  ].forEach(dir => {
    app.use('/assets', express.static(path.join(process.cwd(), dir), cacheControl))
  })
  app.use('/favicon.ico', express.static(path.join(process.cwd(), `/assets/images/favicon.ico`), cacheControl))

  app.use(
    '/assets/images/icons',
    express.static(path.join(process.cwd(), `/node_modules/govuk_frontend_toolkit/images`), cacheControl)
  )

  const healthcheck = healthcheckFactory(
    config.apis.oauth2.url,
    config.apis.prison.url,
    config.apis.tokenVerification.url
  )

  // Express Routing Configuration
  app.get('/health', (req, res, next) => {
    healthcheck((err, result) => {
      if (err) {
        return next(err)
      }
      if (!result.healthy) {
        res.status(503)
      }
      res.json(result)
      return result
    })
  })

  // GovUK Template Configuration
  app.locals.asset_path = '/assets/'

  function addTemplateVariables(req, res, next) {
    res.locals.user = req.user
    next()
  }

  app.use(addTemplateVariables)

  function addreturnURL(req, res, next) {
    const returnUrl = `${req.protocol}://${req.get('host')}${req.originalUrl}`
    res.locals.returnUrl = returnUrl
    next()
  }

  app.use(addreturnURL)

  // Don't cache dynamic resources
  app.use(noCache())

  // CSRF protection
  app.use(setUpCsrf())

  // JWT token refresh
  app.use(async (req, res, next) => {
    if (req.user && req.originalUrl !== '/sign-out') {
      const timeToRefresh = new Date() > req.user.refreshTime
      if (timeToRefresh) {
        try {
          const newToken = await services.signInService.getRefreshedToken(req.user)
          req.user.token = newToken.token
          req.user.refreshToken = newToken.refreshToken
          logger.info(`existing refreshTime in the past by ${new Date().getTime() - req.user.refreshTime}`)
          logger.info(
            `updating time by ${newToken.refreshTime - req.user.refreshTime} from ${req.user.refreshTime} to ${
              newToken.refreshTime
            }`
          )
          req.user.refreshTime = newToken.refreshTime
        } catch (error) {
          logger.error(`Token refresh error: ${req.user.username}`, error.stack)
          return res.redirect('/sign-out')
        }
      }
    }
    return next()
  })

  // Update a value in the cookie so that the set-cookie will be sent.
  // Only changes every minute so that it's not sent with every request.
  app.use((req, res, next) => {
    req.session.nowInMinutes = Math.floor(Date.now() / 60e3)
    next()
  })

  const authLogoutUrl = `${config.apis.oauth2.externalUrl}/logout?client_id=${config.apis.oauth2.apiClientId}&redirect_uri=${config.domain}`

  app.get('/autherror', (req, res) => {
    res.status(401)
    return res.render('autherror', {
      authURL: authLogoutUrl,
    })
  })

  app.get('/login', passport.authenticate('oauth2'))

  app.get(
    '/login/callback',
    asyncMiddleware((req, res, next) =>
      passport.authenticate('oauth2', {
        successReturnToOrRedirect: req.session.returnTo || '/',
        failureRedirect: '/autherror',
      })(req, res, next)
    )
  )

  app.use(
    '/sign-out',
    asyncMiddleware((req, res) => {
      if (req.user) {
        req.logout(() => req.session.destroy())
      }
      res.redirect(authLogoutUrl)
    })
  )

  app.use(populateCurrentUser(services.userService))

  app.use(unauthenticatedRoutes(services))
  app.use(authorisationMiddleware)

  app.get('*', getFrontendComponents(services.feComponentsService))
  app.use(createRouter(authenticationMiddleware, services))

  app.use(errorHandler(process.env.NODE_ENV === 'production'))

  return app
}
