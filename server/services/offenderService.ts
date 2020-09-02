import logger from '../../log'
import { isNilOrEmpty, properCaseName } from '../utils/utils'
import { PrisonerDetail } from '../types/uof'
import type { Elite2ClientBuilder } from '../data/elite2ClientBuilder'

export default class OffenderService {
  constructor(private readonly elite2ClientBuilder: Elite2ClientBuilder) {}

  async getOffenderDetails(token: string, bookingId: string): Promise<any> {
    try {
      const elite2Client = this.elite2ClientBuilder(token)
      const result = await elite2Client.getOffenderDetails(bookingId)

      if (isNilOrEmpty(result)) {
        logger.warn(`No details found for bookingId=${bookingId}`)
        return []
      }

      const displayName = `${properCaseName(result.firstName)} ${properCaseName(result.lastName)}`
      const { dateOfBirth } = result

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
      const elite2Client = this.elite2ClientBuilder(token)
      const result = await elite2Client.getPrisoners(offenderNumbers)

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

  async getOffenderImage(token: string, bookingId: string): Promise<ReadableStream<any>> {
    const elite2Client = this.elite2ClientBuilder(token)
    return elite2Client.getOffenderImage(bookingId)
  }

  private fullName({ firstName, lastName }): string {
    return `${properCaseName(lastName)}, ${properCaseName(firstName)}`
  }

  async getOffenderNames(token: string, offenderNos: string[]): Promise<{ [offenderNo: string]: string }> {
    if (offenderNos.length === 0) {
      return {}
    }
    const uniqueNos = [...new Set(offenderNos)]
    const offenders = await this.elite2ClientBuilder(token).getOffenders(uniqueNos)

    return offenders.reduce((rv, offender) => ({ ...rv, [offender.offenderNo]: this.fullName(offender) }), {})
  }
}
