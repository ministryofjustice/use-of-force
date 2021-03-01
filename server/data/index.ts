import { buildAppInsightsClient } from '../utils/azure-appinsights'
import createRestClientBuilder, { RestClient, ClientOptions } from './restClient'

import PrisonerSearchClient from './prisonerSearchClient'
import IncidentClient from './incidentClient'
import ReportingClient from './reportingClient'
import DraftReportClient from './draftReportClient'
import StatementsClient from './statementsClient'

import PrisonClient from './prisonClient'
import config from '../config'

import { AuthClient, systemToken } from './authClient'
import * as db from './dataAccess/db'

const incidentClient = new IncidentClient(db.query, db.inTransaction)
const reportingClient = new ReportingClient(db.query)
const draftReportClient = new DraftReportClient(db.query, db.inTransaction)
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
  reportingClient,
  telemetryClient,
  draftReportClient,
  systemToken,
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
}
