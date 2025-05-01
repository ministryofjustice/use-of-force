import express, { Express, RequestHandler } from 'express'
import cookieSession from 'cookie-session'
import createError from 'http-errors'

import authenticatedRoutes from '../index'
import * as db from '../../data/dataAccess/db'
import nunjucksSetup from '../../utils/nunjucksSetup'
import errorHandler from '../../errorHandler'

import { authenticationMiddleware } from './mockAuthentication'
import {
  type Services,
  type StatementService,
  type OffenderService,
  type ReportService,
  type ReportDetailBuilder,
  type ReviewService,
  type InvolvedStaffService,
  type DraftReportService,
  type LocationService,
  type PrisonerSearchService,
  type FeComponentsService,
  NomisMappingService,
  AuthService,
} from '../../services'
import UserService from '../../services/userService'
import unauthenticatedRoutes from '../unauthenticated'

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
  isAdmin: false,
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
  isAdmin: false,
  activeCaseLoadId: 'LEI',
}

export const adminUser = {
  firstName: 'first',
  lastName: 'last',
  userId: 'id',
  token: 'token',
  username: 'user1',
  displayName: 'First Last',
  isReviewer: false,
  isCoordinator: false,
  isAdmin: true,
  activeCaseLoadId: 'LEI',
}

const appSetup = (
  authenticated: RequestHandler,
  unauthenticated: RequestHandler,
  userSupplier,
  isProduction,
  flash
): Express => {
  const app = express()

  const mockTransactionalClient = { query: jest.fn(), release: jest.fn() }
  db.pool.connect = jest.fn().mockResolvedValue(mockTransactionalClient)

  app.set('view engine', 'html')

  nunjucksSetup(app)

  app.use((req, res, next) => {
    req.user = userSupplier()
    req.flash = flash
    res.locals = {}
    res.locals.user = req.user
    next()
  })
  app.use(cookieSession({ keys: [''] }))
  app.use(express.json())
  app.use(express.urlencoded({ extended: false }))
  app.use(unauthenticated)
  app.use(authenticated)
  app.use((req, res, next) => {
    next(createError(404, 'Not found'))
  })
  app.use(errorHandler(isProduction))

  return app
}

export const appWithAllRoutes = (
  overrides: Partial<Services> = {},
  userSupplier = () => user,
  isProduction?: boolean,
  flash = jest.fn().mockReturnValue([])
): Express => {
  const services = {
    statementService: {} as StatementService,
    offenderService: {} as OffenderService,
    reportService: {} as ReportService,
    involvedStaffService: {} as InvolvedStaffService,
    reviewService: {} as ReviewService,
    prisonerSearchService: {} as PrisonerSearchService,
    systemToken: async username => `${username}-system-token`,
    locationService: {} as LocationService,
    nomisMappingService: {} as NomisMappingService,
    reportDetailBuilder: {} as ReportDetailBuilder,
    draftReportService: {} as DraftReportService,
    userService: {} as UserService,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    signInService: {} as any,
    feComponentsService: {} as FeComponentsService,
    authService: {} as AuthService,
    ...overrides,
  }
  const authenticated = authenticatedRoutes(authenticationMiddleware, services)
  const unauthenticated = unauthenticatedRoutes(services)
  return appSetup(authenticated, unauthenticated, userSupplier, isProduction, flash)
}
