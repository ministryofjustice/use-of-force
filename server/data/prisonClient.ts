import type { Readable } from 'stream'
import sanitiseError from '../utils/errorSanitiser'
import logger from '../../log'
import type { InmateDetail } from './prisonClientTypes'
import config from '../config'
import BaseApiClient from './baseApiClient'

export default class PrisonClient extends BaseApiClient {
  protected static config() {
    return config.apis.prison
  }

  async getOffenderDetails(bookingId: number, token: string): Promise<Partial<InmateDetail>> {
    return PrisonClient.restClient(token).get({ path: `/api/bookings/${bookingId}?basicInfo=false` })
  }

  getOffenderImage(bookingId: string, token: string): Promise<Readable> {
    return PrisonClient.restClient(token).stream({
      path: `/api/bookings/${bookingId}/image/data`,
      errorLogger: error =>
        error.status === 404
          ? logger.info(`No offender image available for: ${bookingId}`)
          : logger.warn(sanitiseError(error), `Error calling prisonApi`),
    })
  }
}
