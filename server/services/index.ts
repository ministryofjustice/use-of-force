import { buildAppInsightsClient } from '../utils/azure-appinsights'
import PrisonerSearchClient from '../data/prisonerSearchClient'
import IncidentClient from '../data/incidentClient'
import ReportingClient from '../data/reportingClient'
import DraftReportClient from '../data/draftReportClient'
import StatementsClient from '../data/statementsClient'
import OffenderService from './offenderService'
import ReportingService from './reporting/reportingService'
import PrisonerSearchService from './prisonerSearchService'

import ReportService from './reportService'
import UpdateDraftReportService from './drafts/updateDraftReportService'
import SubmitDraftReportService from './drafts/submitDraftReportService'
import DraftReportService from './drafts/draftReportService'

import LocationService from './locationService'
import ReportDetailBuilder from './reportDetailBuilder'
import ReviewService from './reviewService'
import StatementService from './statementService'
import { InvolvedStaffService } from './involvedStaffService'
import UserService from './userService'

import elite2ClientBuilder from '../data/elite2ClientBuilder'

import { authClientBuilder, systemToken } from '../data/authClientBuilder'
import createHeatmapBuilder from './reporting/heatmapBuilder'
import EventPublisher from './eventPublisher'

import * as db from '../data/dataAccess/db'
import createSignInService from '../authentication/signInService'

import { notificationServiceFactory } from './notificationService'
import { DraftInvolvedStaffService } from './drafts/draftInvolvedStaffService'

const reportingClient = new ReportingClient(db.query)
const incidentClient = new IncidentClient(db.query, db.inTransaction)
const draftReportClient = new DraftReportClient(db.query, db.inTransaction)
const statementsClient = new StatementsClient(db.query)

const eventPublisher = EventPublisher(buildAppInsightsClient())
// inject service dependencies

const heatmapBuilder = createHeatmapBuilder(elite2ClientBuilder)
const userService = new UserService(elite2ClientBuilder, authClientBuilder)
const notificationService = notificationServiceFactory(eventPublisher)
const involvedStaffService = new InvolvedStaffService(incidentClient, statementsClient, userService, db.inTransaction)
const offenderService = new OffenderService(elite2ClientBuilder)
const reportService = new ReportService(incidentClient, offenderService, systemToken)

const submitDraftReportService = new SubmitDraftReportService(
  draftReportClient,
  statementsClient,
  notificationService,
  db.inTransaction
)

const updateDraftReportService = new UpdateDraftReportService(draftReportClient, elite2ClientBuilder, systemToken)
const draftInvolvedStaffService = new DraftInvolvedStaffService(
  authClientBuilder,
  elite2ClientBuilder,
  draftReportClient,
  userService
)

const draftReportService = new DraftReportService(
  draftReportClient,
  draftInvolvedStaffService,
  updateDraftReportService,
  submitDraftReportService,
  userService,
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
const reportingService = new ReportingService(reportingClient, offenderService, heatmapBuilder)
const prisonerSearchService = new PrisonerSearchService(PrisonerSearchClient, elite2ClientBuilder, systemToken)
const locationService = new LocationService(elite2ClientBuilder)
const reportDetailBuilder = new ReportDetailBuilder(involvedStaffService, locationService, offenderService, systemToken)

export const services = {
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
}

export type Services = typeof services

export {
  InvolvedStaffService,
  DraftReportService,
  ReportService,
  ReportingService,
  LocationService,
  StatementService,
  ReviewService,
  OffenderService,
  PrisonerSearchService,
  ReportDetailBuilder,
}
