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

  async getPrisonerDetails(nomisId: string, token: string): Promise<PrisonerSearchApiPrisoner> {
    return PrisonerSearchClient.restClient(token).get({
      path: `/prisoner/${nomisId}`,
    }) as Promise<PrisonerSearchApiPrisoner>
  }

  // eslint-disable-next-line
  async search(form: SearchForm, token: string): Promise<any> {
    const { prisonNumber, firstName, lastName, agencyId } = form
    const prisonId = agencyId
    const data = {
      prisonerIdentifier: prisonNumber,
      ...(firstName && { firstName }),
      ...(lastName && { lastName }),
      ...(prisonId && { prisonId }),
      includeAliases: false,
    }
    return PrisonerSearchClient.restClient(token).post({
      path: `/prisoner-search/match`,
      data,
    })
  }
}
