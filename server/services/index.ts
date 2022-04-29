import { dataAccess } from '../data'
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

import EventPublisher from './eventPublisher'

import * as db from '../data/dataAccess/db'
import createSignInService from '../authentication/signInService'

import { notificationServiceFactory } from './notificationService'
import { DraftInvolvedStaffService } from './drafts/draftInvolvedStaffService'

const {
  authClientBuilder,
  draftReportClient,
  incidentClient,
  prisonClientBuilder,
  prisonerSearchClientBuilder,
  statementsClient,
  systemToken,
  telemetryClient,
  reportLogClient,
} = dataAccess

const eventPublisher = EventPublisher(telemetryClient)
const userService = new UserService(prisonClientBuilder, authClientBuilder)
const notificationService = notificationServiceFactory(eventPublisher)
const involvedStaffService = new InvolvedStaffService(
  incidentClient,
  statementsClient,
  userService,
  db.inTransaction,
  notificationService
)
const offenderService = new OffenderService(prisonClientBuilder)
const locationService = new LocationService(prisonClientBuilder)
const reportService = new ReportService(
  incidentClient,
  offenderService,
  locationService,
  reportLogClient,
  db.inTransaction,
  systemToken
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
  prisonClientBuilder,
  systemToken
)
const draftInvolvedStaffService = new DraftInvolvedStaffService(
  authClientBuilder,
  prisonClientBuilder,
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
const reportingService = new ReportingService(offenderService)
const prisonerSearchService = new PrisonerSearchService(prisonerSearchClientBuilder, prisonClientBuilder, systemToken)
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
  UserService,
}
