import { buildAppInsightsClient, initialiseAppInsights } from '../utils/azureAppInsights'

import ReportLogClient from './reportLogClient'
import PrisonerSearchClient from './prisonerSearchClient'
import IncidentClient from './incidentClient'
import DraftReportClient from './draftReportClient'
import StatementsClient from './statementsClient'

import PrisonClient from './prisonClient'
import LocationClient from './locationClient'
import NomisMappingClient from './nomisMappingClient'
import FeComponentsClient from './feComponentsClient'
import config from '../config'

import * as db from './dataAccess/db'
import { redisClient } from './redisClient'
import RedisTokenStore from './tokenStore/redisTokenStore'
import HmppsAuthClient from './hmppsAuthClient'
import applicationInfoSupplier from '../applicationInfo'
import ManageUsersApiClient from './manageUsersApiClient'
import InMemoryTokenStore from './tokenStore/inMemoryTokenStore'

const applicationInfo = applicationInfoSupplier()
initialiseAppInsights()
const telemetryClient = buildAppInsightsClient(applicationInfo)

const reportLogClient = new ReportLogClient()
const incidentClient = new IncidentClient(db.query, db.inTransaction, reportLogClient)
const draftReportClient = new DraftReportClient(db.query, reportLogClient)
const statementsClient = new StatementsClient(db.query)

export const dataAccess = {
  applicationInfo,
  statementsClient,
  incidentClient,
  telemetryClient,
  draftReportClient,
  reportLogClient,
  hmppsAuthClient: new HmppsAuthClient(
    config.redis.enabled ? new RedisTokenStore(redisClient) : new InMemoryTokenStore()
  ),
  prisonApiClient: new PrisonClient(),
  locationsApiClient: new LocationClient(),
  nomisMappingClientBuilder: new NomisMappingClient(),
  feComponentsClient: new FeComponentsClient(),
  prisonerSearchApiClient: new PrisonerSearchClient(),
  hmppsManageUsersApiClient: new ManageUsersApiClient(),
  redisClient,
}

export type DataAccess = typeof dataAccess

export {
  StatementsClient,
  IncidentClient,
  PrisonClient,
  LocationClient,
  NomisMappingClient,
  FeComponentsClient,
  PrisonerSearchClient,
  HmppsAuthClient,
  DraftReportClient,
  reportLogClient,
  ManageUsersApiClient,
  redisClient,
}
