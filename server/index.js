import { buildAppInsightsClient } from './utils/azure-appinsights'
import PrisonerSearchClient from './data/prisonerSearchClient'

import createOffenderService from './services/offenderService'
import createReportingService from './services/reportingService'
import PrisonSearchService from './services/prisonerSearchService'
import createLocationService from './services/locationService'
import ReportDetailBuilder from './services/reportDetailBuilder'

import createApp from './app'

import elite2ClientBuilder from './data/elite2ClientBuilder'

import { authClientBuilder, systemToken } from './data/authClientBuilder'

const db = require('./data/dataAccess/db')
const incidentClient = require('./data/incidentClient')
const statementsClient = require('./data/statementsClient')
const reportingClient = require('./data/reportingClient')

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
  systemToken,
})

const statementService = createStatementService({ statementsClient, incidentClient, db })
const reviewService = createReviewService({ statementsClient, incidentClient, authClientBuilder })
const reportingService = createReportingService(reportingClient, offenderService, heatmapBuilder)
const prisonerSearchService = new PrisonSearchService(PrisonerSearchClient, elite2ClientBuilder, systemToken)
const locationService = createLocationService(elite2ClientBuilder, incidentClient)
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
