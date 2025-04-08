import { dataAccess } from '../data'
import OffenderService from './offenderService'
import PrisonerSearchService from './prisonerSearchService'

import ReportService from './reportService'
import UpdateDraftReportService from './drafts/updateDraftReportService'
import SubmitDraftReportService from './drafts/submitDraftReportService'
import DraftReportService from './drafts/draftReportService'

import LocationService from './locationService'
import NomisMappingService from './nomisMappingService'
import ReportDetailBuilder from './reportDetailBuilder'
import ReviewService from './reviewService'
import StatementService from './statementService'
import { InvolvedStaffService } from './involvedStaffService'
import UserService from './userService'

import EventPublisher from './eventPublisher'

import * as db from '../data/dataAccess/db'
import createSignInService from '../authentication/signInService'

import notificationServiceDefault from './notificationService'
import { DraftInvolvedStaffService } from './drafts/draftInvolvedStaffService'
import FeComponentsService from './feComponentsService'

const {
  authClientBuilder,
  draftReportClient,
  incidentClient,
  prisonClientBuilder,
  locationClientBuilder,
  nomisMappingClientBuilder,
  feComponentsClientBuilder,
  prisonerSearchClientBuilder,
  statementsClient,
  systemToken,
  telemetryClient,
  reportLogClient,
} = dataAccess

const eventPublisher = EventPublisher(telemetryClient)
const userService = new UserService(prisonClientBuilder, authClientBuilder)
const notificationService = notificationServiceDefault.notificationServiceFactory(eventPublisher)
const involvedStaffService = new InvolvedStaffService(
  incidentClient,
  statementsClient,
  userService,
  db.inTransaction,
  notificationService,
)
const offenderService = new OffenderService(prisonClientBuilder)
const locationService = new LocationService(prisonClientBuilder, locationClientBuilder)
const nomisMappingService = new NomisMappingService(nomisMappingClientBuilder)
const reportService = new ReportService(
  incidentClient,
  offenderService,
  locationService,
  reportLogClient,
  db.inTransaction,
  systemToken,
)

const submitDraftReportService = new SubmitDraftReportService(
  draftReportClient,
  statementsClient,
  notificationService,
  db.inTransaction,
)

const updateDraftReportService = new UpdateDraftReportService(
  draftReportClient,
  incidentClient,
  reportLogClient,
  db.inTransaction,
  prisonClientBuilder,
  systemToken,
)
const draftInvolvedStaffService = new DraftInvolvedStaffService(
  authClientBuilder,
  prisonClientBuilder,
  draftReportClient,
  userService,
)

const draftReportService = new DraftReportService(
  draftReportClient,
  draftInvolvedStaffService,
  updateDraftReportService,
  submitDraftReportService,
  userService,
  locationService,
  systemToken,
)

const statementService = new StatementService(statementsClient, incidentClient, db.inTransaction)
const reviewService = new ReviewService(
  statementsClient,
  incidentClient,
  authClientBuilder,
  offenderService,
  systemToken,
)
const prisonerSearchService = new PrisonerSearchService(prisonerSearchClientBuilder, prisonClientBuilder, systemToken)
const reportDetailBuilder = new ReportDetailBuilder(
  involvedStaffService,
  locationService,
  offenderService,
  nomisMappingService,
  systemToken,
)
const feComponentsService = new FeComponentsService(feComponentsClientBuilder)

export const services = {
  involvedStaffService,
  offenderService,
  reportService,
  signInService: createSignInService(),
  statementService,
  userService,
  prisonerSearchService,
  reviewService,
  systemToken,
  locationService,
  nomisMappingService,
  reportDetailBuilder,
  draftReportService,
  feComponentsService,
}

export type Services = typeof services

export {
  InvolvedStaffService,
  DraftReportService,
  ReportService,
  LocationService,
  NomisMappingService,
  StatementService,
  ReviewService,
  OffenderService,
  PrisonerSearchService,
  ReportDetailBuilder,
  UserService,
  FeComponentsService,
}
