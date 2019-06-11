const express = require('express')
const log = require('bunyan-request-logger')()
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

const healthcheck = require('./services/healthcheck')
const createFormRouter = require('./routes/form')
const createTasklistRouter = require('./routes/tasklist')
const logger = require('../log.js')
const nunjucksSetup = require('./utils/nunjucksSetup')
const auth = require('./authentication/auth')
const config = require('../server/config')

const { authenticationMiddleware } = auth
const version = moment.now().toString()
const production = process.env.NODE_ENV === 'production'
const testMode = process.env.NODE_ENV === 'test'

module.exports = function createApp({ signInService, formService }) {
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
    '../node_modules/govuk-frontend/assets',
    '../node_modules/govuk-frontend',
  ].forEach(dir => {
    app.use('/assets', express.static(path.join(__dirname, dir), cacheControl))
  })
  ;['../node_modules/govuk_frontend_toolkit/images'].forEach(dir => {
    app.use('/assets/images/icons', express.static(path.join(__dirname, dir), cacheControl))
  })

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

  // token refresh
  app.use(async (req, res, next) => {
    if (req.user) {
      const timeToRefresh = new Date() > req.user.refreshTime
      if (timeToRefresh) {
        req.session.returnTo = req.originalUrl
        return res.redirect('/login')
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

  const authLogoutUrl = `${config.nomis.authExternalUrl}/logout?client_id=${config.nomis.apiClientId}&redirect_uri=${config.domain}`

  app.get('/autherror', (req, res) => {
    res.status(401)
    return res.render('autherror', {
      authURL: authLogoutUrl,
    })
  })

  app.get('/login', passport.authenticate('oauth2'))

  app.get(
    '/login/callback',
    passport.authenticate('oauth2', { successReturnToOrRedirect: '/', failureRedirect: '/autherror' })
  )

  app.use('/logout', (req, res) => {
    if (req.user) {
      req.logout()
    }
    res.redirect(authLogoutUrl)
  })

  app.get('/', (req, res) => res.render('pages/index'))
  app.use('/tasklist/', createTasklistRouter({ formService, authenticationMiddleware }))
  app.use('/form/', createFormRouter({ formService, authenticationMiddleware }))

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
