/* eslint-disable */

const express = require('express')
const bodyParser = require('body-parser')
const cookieSession = require('cookie-session')
const path = require('path')
const db = require('../../../server/data/dataAccess/db')
const nunjucksSetup = require('../../utils/nunjucksSetup')
const errorHandler = require('../../errorHandler')
const allRoutes = require('../index')
const { authenticationMiddleware } = require('./mockAuthentication')

const user = {
  firstName: 'first',
  lastName: 'last',
  userId: 'id',
  token: 'token',
  username: 'user1',
  displayName: 'First Last',
  isReviewer: false,
  activeCaseLoadId: 'MDI',
}

const reviewerUser = {
  firstName: 'first',
  lastName: 'last',
  userId: 'id',
  token: 'token',
  username: 'user1',
  displayName: 'First Last',
  isReviewer: true,
  activeCaseLoadId: 'LEI',
}

const appSetup = (route, userSupplier = () => user) => {
  const app = express()

  const mockTransactionalClient = { query: jest.fn(), release: jest.fn() }
  db.pool.connect = jest.fn()
  db.pool.connect.mockResolvedValue(mockTransactionalClient)

  app.set('view engine', 'html')

  nunjucksSetup(app, path)

  app.use((req, res, next) => {
    req.user = userSupplier()
    res.locals = {}
    res.locals.user = req.user
    next()
  })
  app.use(cookieSession({ keys: [''] }))
  app.use(bodyParser.json())
  app.use(bodyParser.urlencoded({ extended: false }))
  app.use('/', route)
  app.use(errorHandler)

  return app
}

const appWithAllRoutes = (overrides = {}, userSupplier = () => user) => {
  const route = allRoutes({
    authenticationMiddleware,
    statementService: {},
    offenderService: {},
    reportService: {},
    involvedStaffService: {},
    reviewService: {},
    systemToken: username => `${username}-token`,
    ...overrides,
  })
  return appSetup(route, userSupplier)
}

module.exports = { appSetup, appWithAllRoutes, user, reviewerUser }
