import { RestClient } from './restClient'

export type SearchForm = {
  prisonNumber?: string
  firstName?: string
  lastName?: string
  agencyId?: string
}

export default class PrisonerSearchClient {
  constructor(private readonly restClient: RestClient) {}

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
