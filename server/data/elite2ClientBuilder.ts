import sanitiseError from '../utils/errorSanitiser'
import logger from '../../log'
import config from '../config'
import createRestClientBuilder from './restClient'
import {
  InmateDetail,
  InmateBasicDetails,
  UserDetail,
  PrisonerDetail,
  CaseLoad,
  Prison,
  PrisonLocation,
} from './elite2ClientBuilderTypes'

const restClientBuilder = createRestClientBuilder('elite2api', config.apis.elite2)

export class Elite2Client {
  constructor(private restClient) {}

  async getOffenderDetails(bookingId: number): Promise<InmateDetail> {
    return this.restClient.get({ path: `/api/bookings/${bookingId}?basicInfo=false` })
  }

  async getOffenders(offenderNos: string[]): Promise<InmateBasicDetails[]> {
    return this.restClient.post({ path: '/api/bookings/offenders?activeOnly=false', data: offenderNos })
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

  getPrisonById(prisonId: string): Promise<Prison> {
    return this.restClient.get({
      path: `/api/agencies/${prisonId}?activeOnly=false`,
    })
  }

  getLocations(agencyId: string, occurrenceLocationsOnly = true): Promise<PrisonLocation[]> {
    return this.restClient.get({
      path: `/api/agencies/${agencyId}/locations${occurrenceLocationsOnly ? '?eventType=OCCUR' : ''}`,
      headers: { 'Sort-Fields': 'userDescription' },
    })
  }

  getLocation(locationId: number): Promise<PrisonLocation> {
    return this.restClient.get({ path: `/api/locations/${locationId}` })
  }

  getOffenderImage(bookingId: number) {
    return this.restClient.stream({
      path: `/api/bookings/${bookingId}/image/data`,
      errorLogger: error =>
        error.status === 404
          ? logger.info(`No offender image available for: ${bookingId}`)
          : logger.warn(sanitiseError(error), `Error calling elite2`),
    })
  }
}

export default function builder(token: string): Elite2Client {
  const restClient = restClientBuilder(token)
  return new Elite2Client(restClient)
}

export type Elite2ClientBuilder = typeof builder
