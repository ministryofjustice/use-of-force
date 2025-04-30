import { SearchForm } from '../data/prisonerSearchClient'
import { properCaseFullName } from '../utils/utils'
import { PrisonClient, PrisonerSearchClient } from '../data'
import { SystemToken } from '../types/uof'
import { PrisonerSearchApiPrisoner } from '../types/prisonerSearchApi/prisonerSearchTypes'

export type Prison = {
  agencyId: string
  description: string
}

export type SearchResult = {
  name: string
  prisonNumber: string
  prison: string
  bookingNumber: number
}

const isFormComplete = (form: SearchForm): boolean =>
  Boolean(form.prisonNumber || form.firstName || form.lastName || form.agencyId)

export default class PrisonerSearchService {
  constructor(
    private readonly prisonerSearchClient: PrisonerSearchClient,
    private readonly prisonClient: PrisonClient,
    private readonly systemToken: SystemToken
  ) {}

  private async getPrisonsUsing(token: string): Promise<Prison[]> {
    const prisons = await this.prisonClient.getPrisons(token)
    return prisons
      .map(({ agencyId, description }) => ({ agencyId, description }))
      .sort((a, b) => a.description.localeCompare(b.description))
  }

  private async createPrisonNameLookup(token: string): Promise<(agencyId: string) => string> {
    const prisons = await this.getPrisonsUsing(token)
    return (agencyId: string): string => {
      const found = prisons.find(prison => prison.agencyId === agencyId)
      return (found && found.description) || agencyId
    }
  }

  async search(searchingUserName: string, form: SearchForm): Promise<SearchResult[]> {
    if (!isFormComplete(form)) {
      return []
    }
    const token = await this.systemToken(searchingUserName)
    const results = await this.prisonerSearchClient.search(form, token)
    const prisonNameLookup = await this.createPrisonNameLookup(token)

    return results.map(prisoner => ({
      name: properCaseFullName(`${prisoner.lastName}, ${prisoner.firstName}`),
      prisonNumber: prisoner.prisonerNumber,
      prison: prisonNameLookup(prisoner.prisonId),
      bookingId: prisoner.bookingId,
    }))
  }

  async getPrisons(username: string): Promise<Prison[]> {
    return this.getPrisonsUsing(await this.systemToken(username))
  }

  async getPrisonerDetails(identifier: string, username: string): Promise<PrisonerSearchApiPrisoner> {
    const token = await this.systemToken(username)
    return this.prisonerSearchClient.getPrisonerDetails(identifier, token)
  }
}
