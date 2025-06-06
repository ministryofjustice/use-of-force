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

export const services = () => {
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
  const prisonerSearchService = new PrisonerSearchService(prisonerSearchApiClient, prisonApiClient, authService)
  const offenderService = new OffenderService(prisonApiClient, authService)

  const locationService = new LocationService(prisonApiClient, locationsApiClient)
  const nomisMappingService = new NomisMappingService(nomisMappingClientBuilder)
  const reportService = new ReportService(
    incidentClient,
    offenderService,
    locationService,
    reportLogClient,
    db.inTransaction,
    authService
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
    authService
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
    authService
  )

  const statementService = new StatementService(statementsClient, incidentClient, db.inTransaction)
  const reviewService = new ReviewService(
    statementsClient,
    incidentClient,
    hmppsManageUsersApiClient,
    offenderService,
    authService
  )
  const reportDetailBuilder = new ReportDetailBuilder(
    involvedStaffService,
    locationService,
    offenderService,
    nomisMappingService,
    authService
  )
  const feComponentsService = new FeComponentsService(feComponentsClient)

  return {
    involvedStaffService,
    offenderService,
    reportService,
    signInService: createSignInService(),
    statementService,
    userService,
    prisonerSearchService,
    reviewService,
    locationService,
    nomisMappingService,
    reportDetailBuilder,
    draftReportService,
    feComponentsService,
    authService,
  }
}

export type Services = ReturnType<typeof services>
