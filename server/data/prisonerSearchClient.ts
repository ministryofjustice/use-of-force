import { PrisonerSearchApiPrisoner } from '../types/prisonerSearchApi/prisonerSearchTypes'
import BaseApiClient from './baseApiClient'
import config from '../config'

export type SearchForm = {
  prisonNumber?: string
  firstName?: string
  lastName?: string
  agencyId?: string
}

export default class PrisonerSearchClient extends BaseApiClient {
  protected static config() {
    return config.apis.prisonerSearch
  }

  async getPrisonerDetails(identifier: string, token: string): Promise<PrisonerSearchApiPrisoner> {
    return PrisonerSearchClient.restClient(token).get({
      path: `/prisoner/${identifier}`,
    }) as Promise<PrisonerSearchApiPrisoner>
  }

  async search(form: SearchForm, token: string): Promise<any> {
    return PrisonerSearchClient.restClient(token).post({
      path: `/prisoner-search/match-prisoners`,
      data: {
        prisonerIdentifier: form.prisonNumber,
        firstName: form.firstName,
        lastName: form.lastName,
        prisonIds: [form.agencyId],
        includeAliases: false,
      },
    })
  }
}
