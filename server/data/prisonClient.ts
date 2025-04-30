import type { Readable } from 'stream'
import sanitiseError from '../utils/errorSanitiser'
import logger from '../../log'
import type {
  InmateDetail,
  InmateBasicDetails,
  UserDetail,
  PrisonerDetail,
  CaseLoad,
  Prison,
} from './prisonClientTypes'
import config from '../config'
import BaseApiClient from './baseApiClient'

export default class PrisonClient extends BaseApiClient {
  protected static config() {
    return config.apis.prison
  }

  async getOffenderDetails(bookingId: number, token: string): Promise<Partial<InmateDetail>> {
    return PrisonClient.restClient(token).get({ path: `/api/bookings/${bookingId}?basicInfo=false` })
  }

  async getOffenders(offenderNos: string[], token: string): Promise<InmateBasicDetails[]> {
    return PrisonClient.restClient(token).post({
      path: '/api/bookings/offenders?activeOnly=false',
      data: offenderNos,
    })
  }

  async getPrisoners(offenderNos: string[], token: string): Promise<PrisonerDetail[]> {
    const query = { offenderNo: offenderNos }
    const headers = { 'Page-Limit': 5000 }
    return PrisonClient.restClient(token).get({ path: '/api/prisoners', query, headers })
  }

  async getUser(token: string): Promise<UserDetail> {
    return PrisonClient.restClient(token).get({ path: '/api/users/me' })
  }

  getUserCaseLoads(token: string): Promise<CaseLoad[]> {
    return PrisonClient.restClient(token).get({ path: '/api/users/me/caseLoads' })
  }

  getPrisons(token: string): Promise<Prison[]> {
    return PrisonClient.restClient(token).get({
      path: `/api/agencies/type/INST?active=true`,
    })
  }

  getPrisonById(agencyId: string, token: string): Promise<Prison> {
    return PrisonClient.restClient(token).get({
      path: `/api/agencies/${agencyId}?activeOnly=false`,
    })
  }

  getOffenderImage(bookingId: number, token: string): Promise<Readable> {
    return PrisonClient.restClient(token).stream({
      path: `/api/bookings/${bookingId}/image/data`,
      errorLogger: error =>
        error.status === 404
          ? logger.info(`No offender image available for: ${bookingId}`)
          : logger.warn(sanitiseError(error), `Error calling prisonApi`),
    })
  }
}
