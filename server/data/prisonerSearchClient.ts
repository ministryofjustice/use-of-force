import config from '../config'
import createRestClientBuilder from './restClient'

const restClientBuilder = createRestClientBuilder('prisonerSearch', config.apis.prisonerSearch)

export type SearchForm = {
  prisonNumber?: string
  firstName?: string
  lastName?: string
  agencyId?: string
}

export type PrisonerSearchClientBuilder = new (token: string) => PrisonerSearchClient

export default class PrisonerSearchClient {
  restClient: any

  constructor(token: string) {
    this.restClient = restClientBuilder(token)
  }

  async search(form: SearchForm): Promise<any> {
    return this.restClient.post({
      path: `/prisoner-search/match`,
      data: {
        prisonerIdentifier: form.prisonNumber,
        firstName: form.firstName,
        lastName: form.lastName,
        prisonId: form.agencyId,
        includeAliases: false,
      },
    })
  }
}
