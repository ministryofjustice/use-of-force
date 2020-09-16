import { buildAppInsightsClient } from './utils/azure-appinsights'
import PrisonerSearchClient from './data/prisonerSearchClient'
import IncidentClient from './data/incidentClient'
import DraftReportClient from './data/draftReportClient'
import StatementsClient from './data/statementsClient'
import OffenderService from './services/offenderService'
import ReportingService from './services/reportingService'
import PrisonSearchService from './services/prisonerSearchService'

import ReportService from './services/report/reportService'
import UpdateDraftReportService from './services/report/updateDraftReportService'
import SubmitDraftReportService from './services/report/submitDraftReportService'
import DraftReportService from './services/report/draftReportService'

import LocationService from './services/locationService'
import ReportDetailBuilder from './services/reportDetailBuilder'
import ReviewService from './services/reviewService'
import StatementService from './services/statementService'
import { InvolvedStaffService } from './services/involvedStaffService'
import UserService from './services/userService'

import createApp from './app'

import elite2ClientBuilder from './data/elite2ClientBuilder'

import { authClientBuilder, systemToken } from './data/authClientBuilder'

import createHeatmapBuilder from './services/heatmapBuilder'

const db = require('./data/dataAccess/db')

const reportingClient = require('./data/reportingClient')

const incidentClient = new IncidentClient(db.query, db.inTransaction)
const draftReportClient = new DraftReportClient(db.query, db.inTransaction)
const statementsClient = new StatementsClient(db.query)

const createSignInService = require('./authentication/signInService')

const { notificationServiceFactory } = require('./services/notificationService')
const eventPublisher = require('./services/eventPublisher')(buildAppInsightsClient())

// inject service dependencies

const heatmapBuilder = createHeatmapBuilder(elite2ClientBuilder)
const userService = new UserService(elite2ClientBuilder, authClientBuilder)
const involvedStaffService = new InvolvedStaffService(
  draftReportClient,
  incidentClient,
  statementsClient,
  userService,
  db.inTransaction
)
const notificationService = notificationServiceFactory(eventPublisher)
const offenderService = new OffenderService(elite2ClientBuilder)
const reportService = new ReportService(incidentClient, offenderService, systemToken)

const submitDraftReportService = new SubmitDraftReportService(
  draftReportClient,
  involvedStaffService,
  notificationService,
  db.inTransaction
)

const updateDraftReportService = new UpdateDraftReportService(draftReportClient, elite2ClientBuilder, systemToken)

const draftReportService = new DraftReportService(draftReportClient, updateDraftReportService, submitDraftReportService)

const statementService = new StatementService(statementsClient, incidentClient, db.inTransaction)
const reviewService = new ReviewService(
  statementsClient,
  incidentClient,
  authClientBuilder,
  offenderService,
  systemToken
)
const reportingService = new ReportingService(reportingClient, offenderService, heatmapBuilder)
const prisonerSearchService = new PrisonSearchService(PrisonerSearchClient, elite2ClientBuilder, systemToken)
const locationService = new LocationService(elite2ClientBuilder)
const reportDetailBuilder = new ReportDetailBuilder(involvedStaffService, locationService, offenderService, systemToken)

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
  draftReportService,
})

module.exports = app
