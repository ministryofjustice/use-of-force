import type { Readable } from 'stream'
import moment from 'moment/moment'
import logger from '../../log'
import { isNilOrEmpty, properCaseName } from '../utils/utils'
import type { PrisonClient } from '../data'
import { PrisonerDetail } from '../data/prisonClientTypes'

export default class OffenderService {
  constructor(private readonly prisonClient: PrisonClient) {}

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async getOffenderDetails(token: string, bookingId: number): Promise<any> {
    try {
      const result = await this.prisonClient.getOffenderDetails(bookingId, token)

      if (isNilOrEmpty(result)) {
        logger.warn(`No details found for bookingId=${bookingId}`)
        return []
      }

      const displayName = `${properCaseName(result.firstName)} ${properCaseName(result.lastName)}`
      const dateOfBirth = moment(result.dateOfBirth).format('YYYY-MM-DD')

      return {
        displayName,
        ...result,
        dateOfBirth,
      }
    } catch (error) {
      logger.error(error, 'Error during getOffenderDetails')
      throw error
    }
  }

  async getPrisonersDetails(token: string, offenderNumbers: string[]): Promise<PrisonerDetail[]> {
    try {
      const result = await this.prisonClient.getPrisoners(offenderNumbers, token)

      if (isNilOrEmpty(result)) {
        logger.warn(`No details found for offenderNumbers ${offenderNumbers}`)
        return []
      }
      return result
    } catch (error) {
      logger.error(error, 'Error during getPrisonersDetails')
      throw error
    }
  }

  async getOffenderImage(token: string, bookingId: number): Promise<Readable> {
    return this.prisonClient.getOffenderImage(bookingId, token)
  }

  private fullName({ firstName, lastName }): string {
    return `${properCaseName(lastName)}, ${properCaseName(firstName)}`
  }

  async getOffenderNames(token: string, offenderNos: string[]): Promise<{ [offenderNo: string]: string }> {
    if (offenderNos.length === 0) {
      return {}
    }
    const uniqueNos = [...new Set(offenderNos)]
    const offenders = await this.prisonClient.getOffenders(uniqueNos, token)

    return offenders.reduce((rv, offender) => ({ ...rv, [offender.offenderNo]: this.fullName(offender) }), {})
  }
}
