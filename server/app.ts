import express, { Express, RequestHandler, Response } from 'express'
import bunyanRequestLogger from 'bunyan-request-logger'
import addRequestId from 'express-request-id'
import helmet from 'helmet'
import noCache from 'nocache'
import csurf from 'csurf'
import path from 'path'
import moment from 'moment'
import compression from 'compression'
import passport from 'passport'
import bodyParser from 'body-parser'
import crypto from 'crypto'
import createError from 'http-errors'
import redis from 'redis'
import session from 'express-session'
import ConnectRedis from 'connect-redis'

import createRouter from './routes'
import nunjucksSetup from './utils/nunjucksSetup'
import { Services } from './services'
import loggingSerialiser from './loggingSerialiser'

import tokenVerifierFactory from './authentication/tokenverifier/tokenVerifierFactory'
import healthcheckFactory from './services/healthcheck'
import createApiRouter from './routes/api'

import logger from '../log'
import { authenticationMiddlewareFactory, initialisePassportStrategy } from './authentication/auth'
import populateCurrentUser from './middleware/populateCurrentUser'
import authorisationMiddleware from './middleware/authorisationMiddleware'
import errorHandler from './errorHandler'

import config from './config'

const authenticationMiddleware: RequestHandler = authenticationMiddlewareFactory(
  tokenVerifierFactory(config.apis.tokenVerification)
)

const version = moment.now().toString()
const production = process.env.NODE_ENV === 'production'
const testMode = process.env.NODE_ENV === 'test'

export default function createApp(services: Services): Express {
  const app = express()

  initialisePassportStrategy(services.signInService)

  app.set('json spaces', 2)

  // Configure Express for running behind proxies
  // https://expressjs.com/en/guide/behind-proxies.html
  app.set('trust proxy', true)

  // View Engine Configuration
  app.set('view engine', 'html')

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
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          // Hash allows inline script pulled in from https://github.com/alphagov/govuk-frontend/blob/master/src/govuk/template.njk
          scriptSrc: [
            "'self'",
            (req, res: Response) => `'nonce-${res.locals.cspNonce}'`,
            'code.jquery.com',
            "'sha256-+6WnXIl4mbFTCARd8N3COQmT3bJJmo32N8q8ZSQAIcU='",
          ],
          imgSrc: ["'self'", 'www.googletagmanager.com', 'www.google-analytics.com'],
          connectSrc: ["'self'", 'www.googletagmanager.com', 'www.google-analytics.com'],
          styleSrc: ["'self'", 'code.jquery.com'],
          fontSrc: ["'self'"],
        },
      },
    })
  )

  const client = redis.createClient({
    port: config.redis.port,
    password: config.redis.password,
    host: config.redis.host,
    tls: config.redis.tls_enabled === 'true' ? {} : false,
  })

  app.use(addRequestId())

  const RedisStore = ConnectRedis(session)
  app.use(
    session({
      store: new RedisStore({ client }),
      cookie: { secure: config.https, sameSite: 'lax', maxAge: config.session.expiryMinutes * 60 * 1000 },
      secret: config.session.secret,
      resave: false, // redis implements touch so shouldn't need this
      saveUninitialized: false,
      rolling: true,
    })
  )

  app.use(passport.initialize())
  app.use(passport.session())

  // Request Processing Configuration
  app.use(bodyParser.json())
  app.use(bodyParser.urlencoded({ extended: true }))

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
  const cacheControl = { maxAge: config.staticResourceCacheDuration * 1000 }

  ;[
    '/assets',
    '/assets/stylesheets',
    '/assets/js',
    `/node_modules/govuk-frontend/govuk/assets`,
    `/node_modules/govuk-frontend`,
    `/node_modules/@ministryofjustice/frontend/`,
  ].forEach(dir => {
    app.use('/assets', express.static(path.join(process.cwd(), dir), cacheControl))
  })
  ;[`/node_modules/govuk_frontend_toolkit/images`].forEach(dir => {
    app.use('/assets/images/icons', express.static(path.join(process.cwd(), dir), cacheControl))
  })

  app.use(bunyanRequestLogger({ name: 'Use of force http', serializers: loggingSerialiser }).requestLogger())

  const healthcheck = healthcheckFactory(
    config.apis.oauth2.url,
    config.apis.elite2.url,
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

  // Don't cache dynamic resources
  app.use(noCache())

  // CSRF protection
  if (!testMode) {
    app.use(csurf())
  }

  // JWT token refresh
  app.use(async (req, res, next) => {
    if (req.user && req.originalUrl !== '/logout') {
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
          return res.redirect('/logout')
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

  app.get('/login/callback', (req, res, next) =>
    passport.authenticate('oauth2', {
      successReturnToOrRedirect: req.session.returnTo || '/',
      failureRedirect: '/autherror',
    })(req, res, next)
  )

  app.use('/logout', (req, res) => {
    if (req.user) {
      req.logout()
      req.session.destroy()
    }
    res.redirect(authLogoutUrl)
  })

  const currentUserInContext = populateCurrentUser(services.userService)
  app.use(currentUserInContext)

  app.use(authorisationMiddleware)

  app.use('/', createRouter(authenticationMiddleware, services))
  app.use('/api/', createApiRouter(authenticationMiddleware, services))

  app.use((req, res, next) => {
    next(createError(404, 'Not found'))
  })

  app.use(errorHandler(process.env.NODE_ENV === 'production'))

  return app
}
