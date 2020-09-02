import sanitiseError from '../utils/errorSanitiser'
import logger from '../../log'
import config from '../config'
import createRestClientBuilder from './restClient'

const restClientBuilder = createRestClientBuilder('elite2api', config.apis.elite2)

export class Elite2Client {
  constructor(private restClient) {}

  async getOffenderDetails(bookingId) {
    return this.restClient.get({ path: `/api/bookings/${bookingId}?basicInfo=false` })
  }

  async getOffenders(offenderNos) {
    return this.restClient.post({ path: '/api/bookings/offenders?activeOnly=false', data: offenderNos })
  }

  async getPrisoners(offenderNos) {
    const query = { offenderNo: offenderNos }
    const headers = { 'Page-Limit': 5000 }
    return this.restClient.get({ path: '/api/prisoners', query, headers })
  }

  async getUser() {
    return this.restClient.get({ path: '/api/users/me' })
  }

  getUserCaseLoads() {
    return this.restClient.get({ path: '/api/users/me/caseLoads' })
  }

  getPrisons() {
    return this.restClient.get({
      path: `/api/agencies/type/INST?active=true`,
    })
  }

  getLocations(agencyId, occurrenceLocationsOnly = true) {
    return this.restClient.get({
      path: `/api/agencies/${agencyId}/locations${occurrenceLocationsOnly ? '?eventType=OCCUR' : ''}`,
      headers: { 'Sort-Fields': 'userDescription' },
    })
  }

  getLocation(locationId) {
    return this.restClient.get({ path: `/api/locations/${locationId}` })
  }

  getOffenderImage(bookingId) {
    return this.restClient.stream({
      path: `/api/bookings/${bookingId}/image/data`,
      errorLogger: error =>
        error.status === 404
          ? logger.info(`No offender image available for: ${bookingId}`)
          : logger.warn(sanitiseError(error), `Error calling elite2`),
    })
  }

  getPrisonById(prisonId) {
    return this.restClient.get({
      path: `/api/agencies/${prisonId}?activeOnly=false`,
    })
  }
}

export default function builder(token: string): Elite2Client {
  const restClient = restClientBuilder(token)
  return new Elite2Client(restClient)
}

export type Elite2ClientBuilder = typeof builder
