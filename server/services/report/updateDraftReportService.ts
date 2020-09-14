import type IncidentClient from '../../data/incidentClient'
import type { SystemToken } from '../../types/uof'

import logger from '../../../log'
import { isNilOrEmpty } from '../../utils/utils'
import { Elite2ClientBuilder } from '../../data/elite2ClientBuilder'

export type UpdateParams = { currentUser; formId; bookingId; formObject; incidentDate? }

export default class UpdateDraftReportService {
  constructor(
    private readonly incidentClient: IncidentClient,
    private readonly elite2ClientBuilder: Elite2ClientBuilder,
    private readonly systemToken: SystemToken
  ) {}

  public async update({ currentUser, formId, bookingId, formObject, incidentDate }: UpdateParams): Promise<number> {
    const incidentDateValue = incidentDate ? incidentDate.value : null
    const formValue = !isNilOrEmpty(formObject) ? formObject : null

    return formId
      ? this.updateReport(formId, bookingId, currentUser, incidentDateValue, formValue)
      : this.startNewReport(bookingId, currentUser, incidentDateValue, formObject)
  }

  private async updateReport(formId: number, bookingId: number, currentUser, incidentDateValue, formValue) {
    const { username: userId } = currentUser
    if (incidentDateValue || formValue) {
      logger.info(`Updated report with id: ${formId} for user: ${userId} on booking: ${bookingId}`)
      await this.incidentClient.updateDraftReport(formId, incidentDateValue, formValue)
    }
    return formId
  }

  private async startNewReport(bookingId: number, currentUser, incidentDateValue, formObject) {
    const { username: userId, displayName: reporterName } = currentUser

    const token = await this.systemToken(userId)
    const elite2Client = this.elite2ClientBuilder(token)
    const { offenderNo, agencyId } = await elite2Client.getOffenderDetails(bookingId)
    const id = await this.incidentClient.createDraftReport({
      userId,
      reporterName,
      bookingId,
      agencyId,
      offenderNo,
      incidentDate: incidentDateValue,
      formResponse: formObject,
    })
    logger.info(`Created new report with id: ${id} for user: ${userId} on booking: ${bookingId}`)
    return id
  }

  public async updateAgencyId(agencyId: string, username: string, bookingId: number): Promise<void> {
    logger.info(`username: ${username} updating agencyId for booking: ${bookingId} to ${agencyId}`)
    await this.incidentClient.updateAgencyId(agencyId, username, bookingId)
  }
}
