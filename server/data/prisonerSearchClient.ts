import { PrisonerSearchApiPrisoner } from '../types/prisonerSearchApi/prisonerSearchTypes'
import BaseApiClient from './baseApiClient'
import config from '../config'

export type PrisonerName = Pick<PrisonerSearchApiPrisoner, 'prisonerNumber' | 'firstName' | 'lastName'>

// The most prisoner numbers Prisoner Search accepts in one request
export const MAX_PRISONER_NUMBERS_PER_REQUEST = 1000

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

  async getPrisonerNames(prisonerNumbers: string[], token: string): Promise<PrisonerName[]> {
    return PrisonerSearchClient.restClient(token).post({
      path: '/prisoner-search/prisoner-numbers',
      query: { responseFields: 'prisonerNumber,firstName,lastName' },
      data: { prisonerNumbers },
    })
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
