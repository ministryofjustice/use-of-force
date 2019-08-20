const express = require('express')
const loggingSerialiser = require('./loggingSerialiser') // eslint-disable-line
const log = require('bunyan-request-logger')({ name: 'Use of force http', serializers: loggingSerialiser })
const addRequestId = require('express-request-id')()
const helmet = require('helmet')
const csurf = require('csurf')
const path = require('path')
const moment = require('moment')
const compression = require('compression')
const passport = require('passport')
const bodyParser = require('body-parser')
const cookieSession = require('cookie-session')
const sassMiddleware = require('node-sass-middleware')
const { createNamespace } = require('cls-hooked')

const healthcheckFactory = require('./services/healthcheck')
const createNewIncidentRouter = require('./routes/newIncident')
const createCheckAnswersRouter = require('./routes/checkAnswers')
const createSubmittedRouter = require('./routes/submitted')
const createTasklistRouter = require('./routes/tasklist')
const createApiRouter = require('./routes/api')
const createIncidentsRouter = require('./routes/incidents')

const logger = require('../log.js')
const nunjucksSetup = require('./utils/nunjucksSetup')
const auth = require('./authentication/auth')
const populateCurrentUser = require('./middleware/populateCurrentUser')

const config = require('../server/config')

const { authenticationMiddleware } = auth
const version = moment.now().toString()
const production = process.env.NODE_ENV === 'production'
const testMode = process.env.NODE_ENV === 'test'

module.exports = function createApp({
  reportService,
  involvedStaffService,
  offenderService,
  signInService,
  statementService,
  userService,
}) {
  const app = express()

  auth.init(signInService)

  app.set('json spaces', 2)

  // Configure Express for running behind proxies
  // https://expressjs.com/en/guide/behind-proxies.html
  app.set('trust proxy', true)

  // View Engine Configuration
  app.set('view engine', 'html')

  nunjucksSetup(app, path)

  // Server Configuration
  app.set('port', process.env.PORT || 3000)

  // Secure code best practice - see:
  // 1. https://expressjs.com/en/advanced/best-practice-security.html,
  // 2. https://www.npmjs.com/package/helmet
  app.use(helmet())
  // Setup thread-locals for services under main routers (must occur before requestLogger)
  const ns = createNamespace('request.scope')

  app.use(async (req, res, next) => {
    ns.bindEmitter(req)
    ns.bindEmitter(res)
    return ns.run(() => next())
  })
  app.use(addRequestId)

  app.use(
    cookieSession({
      name: 'session',
      keys: [config.sessionSecret],
      maxAge: 60 * 60 * 1000,
      secure: config.https,
      httpOnly: true,
      signed: true,
      overwrite: true,
      sameSite: 'lax',
    })
  )

  app.use(passport.initialize())
  app.use(passport.session())

  // Request Processing Configuration
  app.use(bodyParser.json())
  app.use(bodyParser.urlencoded({ extended: true }))

  app.use(log.requestLogger())

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

  if (!production) {
    app.use(
      '/assets',
      sassMiddleware({
        src: path.join(__dirname, '../assets/sass'),
        dest: path.join(__dirname, '../assets/stylesheets'),
        debug: true,
        outputStyle: 'compressed',
        prefix: '/stylesheets/',
        includePaths: ['node_modules/govuk-frontend'],
      })
    )
  }

  //  Static Resources Configuration
  const cacheControl = { maxAge: config.staticResourceCacheDuration * 1000 }

  ;[
    '../assets',
    '../assets/stylesheets',
    '../assets/js',
    '../node_modules/govuk-frontend/govuk/assets',
    '../node_modules/govuk-frontend',
  ].forEach(dir => {
    app.use('/assets', express.static(path.join(__dirname, dir), cacheControl))
  })
  ;['../node_modules/govuk_frontend_toolkit/images'].forEach(dir => {
    app.use('/assets/images/icons', express.static(path.join(__dirname, dir), cacheControl))
  })
  ;['../node_modules/jquery/dist/jquery.min.js'].forEach(dir => {
    app.use('/assets/js/jquery.min.js', express.static(path.join(__dirname, dir), cacheControl))
  })

  const healthcheck = healthcheckFactory(config.apis.oauth2.url, config.apis.elite2.url)

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
  app.use(helmet.noCache())

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
          const newToken = await signInService.getRefreshedToken(req.user)
          req.user.token = newToken.token
          req.user.refreshToken = newToken.refreshToken
          logger.info(`existing refreshTime in the past by ${new Date() - req.user.refreshTime}`)
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
    }
    res.redirect(authLogoutUrl)
  })
  // Setup user thread-local
  app.use(async (req, res, next) => {
    if (req.user && req.user.username) {
      ns.set('user', req.user.username)
    }
    return next()
  })

  const currentUserInContext = populateCurrentUser(userService)
  app.use(currentUserInContext)

  app.use('/', createIncidentsRouter({ authenticationMiddleware, statementService, offenderService }))
  app.use('/check-answers/', createCheckAnswersRouter({ authenticationMiddleware, reportService, offenderService }))
  app.use('/submitted/', createSubmittedRouter({ authenticationMiddleware }))
  app.use(
    '/form/',
    createNewIncidentRouter({
      authenticationMiddleware,
      reportService,
      offenderService,
      userService,
      involvedStaffService,
    })
  )
  app.use('/api/', createApiRouter({ authenticationMiddleware, offenderService }))
  app.use('/tasklist/', createTasklistRouter({ authenticationMiddleware, reportService, offenderService }))

  app.use((req, res, next) => {
    next(new Error('Not found'))
  })

  app.use(renderErrors)

  return app
}

// eslint-disable-next-line no-unused-vars
function renderErrors(error, req, res) {
  logger.error(error)

  // code to handle unknown errors

  res.locals.error = error
  res.locals.stack = production ? null : error.stack
  res.locals.message = production ? 'Something went wrong. The error has been logged. Please try again' : error.message

  res.status(error.status || 500)

  res.render('pages/error')
}
