import type { Readable } from 'stream'
import moment from 'moment/moment'
import logger from '../../log'
import { isNilOrEmpty, properCaseName } from '../utils/utils'
import { PrisonClient } from '../data'
import AuthService from './authService'

export default class OffenderService {
  constructor(private readonly prisonClient: PrisonClient, private readonly authService: AuthService) {}

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async getOffenderDetails(bookingId: string, username: string): Promise<any> {
    try {
      const token = await this.authService.getSystemClientToken(username)
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

  async getOffenderImage(token: string, bookingId: string): Promise<Readable> {
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
