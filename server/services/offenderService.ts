import type { Readable } from 'stream'
import moment from 'moment/moment'
import { splitEvery } from 'ramda'
import logger from '../../log'
import { isNilOrEmpty, properCaseName } from '../utils/utils'
import { PrisonClient, PrisonerSearchClient } from '../data'
import { MAX_PRISONER_NUMBERS_PER_REQUEST, type PrisonerName } from '../data/prisonerSearchClient'
import AuthService from './authService'

export default class OffenderService {
  constructor(
    private readonly prisonClient: PrisonClient,
    private readonly authService: AuthService,
    private readonly prisonerSearchClient: PrisonerSearchClient,
  ) {}

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async getOffenderDetails(bookingId: number, username: string): Promise<any> {
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
    // Ask for one batch at a time, so a long list does not send several requests to Prisoner Search at once
    const prisoners: PrisonerName[] = []
    for (const batch of splitEvery(MAX_PRISONER_NUMBERS_PER_REQUEST, uniqueNos)) {
      // eslint-disable-next-line no-await-in-loop
      prisoners.push(...(await this.prisonerSearchClient.getPrisonerNames(batch, token)))
    }

    return Object.fromEntries(prisoners.map(prisoner => [prisoner.prisonerNumber, this.fullName(prisoner)]))
  }
}
