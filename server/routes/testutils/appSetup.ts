import express, { Express } from 'express'
import bodyParser from 'body-parser'
import cookieSession from 'cookie-session'
import createError from 'http-errors'

import allRoutes from '../index'
import * as db from '../../data/dataAccess/db'
import nunjucksSetup from '../../utils/nunjucksSetup'
import errorHandler from '../../errorHandler'

import { authenticationMiddleware } from './mockAuthentication'
import type {
  Services,
  StatementService,
  OffenderService,
  ReportService,
  ReportingService,
  ReportDetailBuilder,
  ReviewService,
  InvolvedStaffService,
  DraftReportService,
  LocationService,
  PrisonerSearchService,
} from '../../services'
import UserService from '../../services/userService'

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

export const appSetup = (route, userSupplier = (): any => user, isProduction = false): Express => {
  const app = express()

  const mockTransactionalClient = { query: jest.fn(), release: jest.fn() }
  db.pool.connect = jest.fn().mockResolvedValue(mockTransactionalClient)

  app.set('view engine', 'html')

  nunjucksSetup(app)

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
  app.use((req, res, next) => {
    next(createError(404, 'Not found'))
  })
  app.use(errorHandler(isProduction))

  return app
}

export const appWithAllRoutes = (
  overrides: Partial<Services> = {},
  userSupplier = () => user,
  isProduction?: boolean
): Express => {
  const route = allRoutes(authenticationMiddleware, {
    statementService: {} as StatementService,
    offenderService: {} as OffenderService,
    reportService: {} as ReportService,
    involvedStaffService: {} as InvolvedStaffService,
    reviewService: {} as ReviewService,
    prisonerSearchService: {} as PrisonerSearchService,
    systemToken: async username => `${username}-system-token`,
    locationService: {} as LocationService,
    reportDetailBuilder: {} as ReportDetailBuilder,
    draftReportService: {} as DraftReportService,
    userService: {} as UserService,
    reportingService: {} as ReportingService,
    signInService: {} as any,
    ...overrides,
  })
  return appSetup(route, userSupplier, isProduction)
}
