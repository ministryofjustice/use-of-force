import { buildAppInsightsClient } from './utils/azure-appinsights'
import PrisonerSearchClient from './data/prisonerSearchClient'
import IncidentClient from './data/incidentClient'
import StatementsClient from './data/statementsClient'
import OffenderService from './services/offenderService'
import createReportingService from './services/reportingService'
import PrisonSearchService from './services/prisonerSearchService'
import ReportService from './services/reportService'
import LocationService from './services/locationService'
import ReportDetailBuilder from './services/reportDetailBuilder'
import ReviewService from './services/reviewService'
import StatementService from './services/statementService'
import { InvolvedStaffService } from './services/involvedStaffService'

import createApp from './app'

import elite2ClientBuilder from './data/elite2ClientBuilder'

import { authClientBuilder, systemToken } from './data/authClientBuilder'

const db = require('./data/dataAccess/db')

const reportingClient = require('./data/reportingClient')

const incidentClient = new IncidentClient(db.query, db.inTransaction)
const statementsClient = new StatementsClient(db.query)

const createSignInService = require('./authentication/signInService')

const createHeatmapBuilder = require('./services/heatmapBuilder').default
const createUserService = require('./services/userService')

const { notificationServiceFactory } = require('./services/notificationService')
const eventPublisher = require('./services/eventPublisher')(buildAppInsightsClient())

// inject service dependencies

const heatmapBuilder = createHeatmapBuilder(elite2ClientBuilder)
const userService = createUserService(elite2ClientBuilder, authClientBuilder)
const involvedStaffService = new InvolvedStaffService(
  incidentClient,
  statementsClient,
  userService,
  db.inTransaction,
  db.query
)
const notificationService = notificationServiceFactory(eventPublisher)
const offenderService = new OffenderService(elite2ClientBuilder)
const reportService = new ReportService(
  incidentClient,
  elite2ClientBuilder,
  involvedStaffService,
  notificationService,
  offenderService,
  db.inTransaction,
  systemToken
)

const statementService = new StatementService(statementsClient, incidentClient, db.inTransaction)
const reviewService = new ReviewService(
  statementsClient,
  incidentClient,
  authClientBuilder,
  offenderService,
  systemToken
)
const reportingService = createReportingService(reportingClient, offenderService, heatmapBuilder)
const prisonerSearchService = new PrisonSearchService(PrisonerSearchClient, elite2ClientBuilder, systemToken)
const locationService = new LocationService(elite2ClientBuilder)
const reportDetailBuilder = new ReportDetailBuilder({
  involvedStaffService,
  locationService,
  offenderService,
  systemToken,
})

const app = createApp({
  involvedStaffService,
  offenderService,
  reportService,
  signInService: createSignInService(),
  statementService,
  userService,
  prisonerSearchService,
  reviewService,
  reportingService,
  systemToken,
  locationService,
  reportDetailBuilder,
})

module.exports = app
