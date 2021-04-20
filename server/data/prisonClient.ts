import type { Readable } from 'stream'
import sanitiseError from '../utils/errorSanitiser'
import logger from '../../log'
import type { RestClient } from './restClient'
import type {
  InmateDetail,
  InmateBasicDetails,
  UserDetail,
  PrisonerDetail,
  CaseLoad,
  Prison,
  PrisonLocation,
} from './prisonClientTypes'

export default class PrisonClient {
  constructor(private restClient: RestClient) {}

  async getOffenderDetails(bookingId: number): Promise<InmateDetail> {
    return this.restClient.get({ path: `/api/bookings/${bookingId}?basicInfo=false` })
  }

  async getOffenders(offenderNos: string[]): Promise<InmateBasicDetails[]> {
    return this.restClient.post({
      path: '/api/bookings/offenders?activeOnly=false',
      data: offenderNos,
    })
  }

  async getPrisoners(offenderNos: string[]): Promise<PrisonerDetail[]> {
    const query = { offenderNo: offenderNos }
    const headers = { 'Page-Limit': 5000 }
    return this.restClient.get({ path: '/api/prisoners', query, headers })
  }

  async getUser(): Promise<UserDetail> {
    return this.restClient.get({ path: '/api/users/me' })
  }

  getUserCaseLoads(): Promise<CaseLoad[]> {
    return this.restClient.get({ path: '/api/users/me/caseLoads' })
  }

  getPrisons(): Promise<Prison[]> {
    return this.restClient.get({
      path: `/api/agencies/type/INST?active=true`,
    })
  }

  getPrisonById(agencyId: string): Promise<Prison> {
    return this.restClient.get({
      path: `/api/agencies/${agencyId}?activeOnly=false`,
    })
  }

  getLocations(agencyId: string, occurrenceLocationsOnly = true): Promise<PrisonLocation[]> {
    return this.restClient.get({
      path: `/api/agencies/${agencyId}/locations${occurrenceLocationsOnly ? '?eventType=OCCUR' : ''}`,
      headers: { 'Sort-Fields': 'userDescription' },
    })
  }

  async getLocation(locationId: number): Promise<PrisonLocation | Record<string, unknown>> {
    let location = {}
    try {
      location = await this.restClient.get({ path: `/api/locations/${locationId}?includeInactive=true` })
    } catch (error) {
      if (error?.status !== 404) {
        throw error
      }
    }
    return location
  }

  getOffenderImage(bookingId: number): Promise<Readable> {
    return this.restClient.stream({
      path: `/api/bookings/${bookingId}/image/data`,
      errorLogger: error =>
        error.status === 404
          ? logger.info(`No offender image available for: ${bookingId}`)
          : logger.warn(sanitiseError(error), `Error calling prisonApi`),
    })
  }
}
