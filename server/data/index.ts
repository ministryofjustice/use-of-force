import { buildAppInsightsClient } from '../utils/azure-appinsights'
import createRestClientBuilder, { RestClient, ClientOptions } from './restClient'

import ReportLogClient from './reportLogClient'
import PrisonerSearchClient from './prisonerSearchClient'
import IncidentClient from './incidentClient'
import DraftReportClient from './draftReportClient'
import StatementsClient from './statementsClient'

import PrisonClient from './prisonClient'
import config from '../config'

import { AuthClient, systemTokenBuilder } from './authClient'
import * as db from './dataAccess/db'
import TokenStore from './tokenStore'
import { createRedisClient } from './redisClient'

const reportLogClient = new ReportLogClient()
const incidentClient = new IncidentClient(db.query, db.inTransaction, reportLogClient)
const draftReportClient = new DraftReportClient(db.query, reportLogClient)
const statementsClient = new StatementsClient(db.query)
const telemetryClient = buildAppInsightsClient()

type RestClientBuilder<T> = (token: string) => T

export default function restClientBuilder<T>(
  name: string,
  options: ClientOptions,
  constructor: new (client: RestClient) => T
): RestClientBuilder<T> {
  const restClient = createRestClientBuilder(name, options)
  return token => new constructor(restClient(token))
}

export const dataAccess = {
  statementsClient,
  incidentClient,
  telemetryClient,
  draftReportClient,
  reportLogClient,
  systemToken: systemTokenBuilder(new TokenStore(createRedisClient({ legacyMode: false }))),
  authClientBuilder: ((token: string) => new AuthClient(token)) as RestClientBuilder<AuthClient>,
  prisonClientBuilder: restClientBuilder<PrisonClient>('prisonApi', config.apis.prison, PrisonClient),
  prisonerSearchClientBuilder: restClientBuilder('prisonerSearchApi', config.apis.prisonerSearch, PrisonerSearchClient),
}

export type DataAccess = typeof dataAccess

export {
  StatementsClient,
  RestClientBuilder,
  IncidentClient,
  PrisonClient,
  PrisonerSearchClient,
  AuthClient,
  DraftReportClient,
  reportLogClient,
}
