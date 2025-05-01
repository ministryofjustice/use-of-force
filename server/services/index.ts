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

import { notificationServiceFactory } from './notificationService'
import { DraftInvolvedStaffService } from './drafts/draftInvolvedStaffService'
import FeComponentsService from './feComponentsService'
import AuthService from './authService'

const {
  hmppsAuthClient,
  hmppsManageUsersApiClient,
  draftReportClient,
  incidentClient,
  prisonApiClient,
  locationsApiClient,
  nomisMappingClientBuilder,
  feComponentsClient,
  prisonerSearchApiClient,
  statementsClient,
  telemetryClient,
  reportLogClient,
} = dataAccess

const eventPublisher = EventPublisher(telemetryClient)
const authService = new AuthService(hmppsAuthClient)
const userService = new UserService(hmppsManageUsersApiClient, prisonApiClient)
const notificationService = notificationServiceFactory(eventPublisher)
const involvedStaffService = new InvolvedStaffService(
  incidentClient,
  statementsClient,
  userService,
  db.inTransaction,
  notificationService
)
const offenderService = new OffenderService(prisonApiClient)
const locationService = new LocationService(prisonApiClient, locationsApiClient)
const nomisMappingService = new NomisMappingService(nomisMappingClientBuilder)
const reportService = new ReportService(
  incidentClient,
  offenderService,
  locationService,
  reportLogClient,
  db.inTransaction,
  authService.getSystemClientToken
)

const submitDraftReportService = new SubmitDraftReportService(
  draftReportClient,
  statementsClient,
  notificationService,
  db.inTransaction
)

const updateDraftReportService = new UpdateDraftReportService(
  draftReportClient,
  incidentClient,
  reportLogClient,
  db.inTransaction,
  prisonApiClient,
  authService.getSystemClientToken
)
const draftInvolvedStaffService = new DraftInvolvedStaffService(
  hmppsManageUsersApiClient,
  prisonApiClient,
  draftReportClient,
  userService
)

const draftReportService = new DraftReportService(
  draftReportClient,
  draftInvolvedStaffService,
  updateDraftReportService,
  submitDraftReportService,
  userService,
  locationService,
  authService.getSystemClientToken
)

const statementService = new StatementService(statementsClient, incidentClient, db.inTransaction)
const reviewService = new ReviewService(
  statementsClient,
  incidentClient,
  hmppsManageUsersApiClient,
  offenderService,
  authService.getSystemClientToken
)
const prisonerSearchService = new PrisonerSearchService(
  prisonerSearchApiClient,
  prisonApiClient,
  authService.getSystemClientToken
)
const reportDetailBuilder = new ReportDetailBuilder(
  involvedStaffService,
  locationService,
  offenderService,
  nomisMappingService,
  authService.getSystemClientToken
)
const feComponentsService = new FeComponentsService(feComponentsClient)

export const services = {
  involvedStaffService,
  offenderService,
  reportService,
  signInService: createSignInService(),
  statementService,
  userService,
  prisonerSearchService,
  reviewService,
  systemToken: authService.getSystemClientToken,
  locationService,
  nomisMappingService,
  reportDetailBuilder,
  draftReportService,
  feComponentsService,
  authService,
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
  AuthService,
}
