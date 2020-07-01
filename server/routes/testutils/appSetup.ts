import express from 'express'
import bodyParser from 'body-parser'
import cookieSession from 'cookie-session'
import path from 'path'

import allRoutes from '../index'
import * as db from '../../data/dataAccess/db'
import nunjucksSetup from '../../utils/nunjucksSetup'
import errorHandler from '../../errorHandler'

import { authenticationMiddleware } from './mockAuthentication'

export const user = {
  firstName: 'first',
  lastName: 'last',
  userId: 'id',
  token: 'token',
  username: 'user1',
  displayName: 'First Last',
  isReviewer: false,
  activeCaseLoadId: 'MDI',
}

export const reviewerUser = {
  firstName: 'first',
  lastName: 'last',
  userId: 'id',
  token: 'token',
  username: 'user1',
  displayName: 'First Last',
  isReviewer: true,
  isCoordinator: false,
  activeCaseLoadId: 'LEI',
}

export const coordinatorUser = {
  firstName: 'first',
  lastName: 'last',
  userId: 'id',
  token: 'token',
  username: 'user1',
  displayName: 'First Last',
  isReviewer: true,
  isCoordinator: true,
  activeCaseLoadId: 'LEI',
}

export const appSetup = (route, userSupplier = (): any => user) => {
  const app = express()

  const mockTransactionalClient = { query: jest.fn(), release: jest.fn() }
  db.pool.connect = jest.fn().mockResolvedValue(mockTransactionalClient)

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

export const appWithAllRoutes = (overrides = {}, userSupplier = () => user) => {
  const route = allRoutes({
    authenticationMiddleware,
    statementService: {},
    offenderService: {},
    reportService: {},
    involvedStaffService: {},
    reviewService: {},
    prisonerSearchService: {},
    systemToken: username => `${username}-system-token`,
    locationService: {},
    reportDetailBuilder: {},
    ...overrides,
  })
  return appSetup(route, userSupplier)
}
