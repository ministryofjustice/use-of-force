import { buildAppInsightsClient } from './utils/azure-appinsights'
import PrisonerSearchClient from './data/prisonerSearchClient'

import createOffenderService from './services/offenderService'
import createReportingService from './services/reportingService'
import PrisonSearchService from './services/prisonerSearchService'

import createApp from './app'

const db = require('./data/dataAccess/db')
const incidentClient = require('./data/incidentClient')
const statementsClient = require('./data/statementsClient')
const reportingClient = require('./data/reportingClient')

const elite2ClientBuilder = require('./data/elite2ClientBuilder')
const { authClientBuilder, systemToken } = require('./data/authClientBuilder')

const createSignInService = require('./authentication/signInService')

const createHeatmapBuilder = require('./services/heatmapBuilder').default
const { createInvolvedStaffService } = require('./services/involvedStaffService')
const createReportService = require('./services/reportService')
const createStatementService = require('./services/statementService')
const createUserService = require('./services/userService')
const createReviewService = require('./services/reviewService')

const { notificationServiceFactory } = require('./services/notificationService')
const eventPublisher = require('./services/eventPublisher')(buildAppInsightsClient())

// inject service dependencies

const heatmapBuilder = createHeatmapBuilder(elite2ClientBuilder)
const userService = createUserService(elite2ClientBuilder, authClientBuilder)
const involvedStaffService = createInvolvedStaffService({ incidentClient, statementsClient, userService, db })
const notificationService = notificationServiceFactory(eventPublisher)
const offenderService = createOffenderService(elite2ClientBuilder)
const reportService = createReportService({
  elite2ClientBuilder,
  incidentClient,
  involvedStaffService,
  notificationService,
  db,
})
const statementService = createStatementService({ statementsClient, incidentClient, db })
const reviewService = createReviewService({ statementsClient, incidentClient, authClientBuilder })
const reportingService = createReportingService(reportingClient, offenderService, heatmapBuilder)
const prisonerSearchService = new PrisonSearchService(PrisonerSearchClient, elite2ClientBuilder, systemToken)

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
})

module.exports = app
