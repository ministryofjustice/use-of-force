import * as R from 'ramda'
import type DraftReportClient from '../../data/draftReportClient'
import type { LoggedInUser, SystemToken } from '../../types/uof'

import logger from '../../../log'
import { Elite2ClientBuilder } from '../../data/elite2ClientBuilder'
import { StaffDetails } from '../../data/draftReportClientTypes'

export default class UpdateDraftReportService {
  constructor(
    private readonly draftReportClient: DraftReportClient,
    private readonly elite2ClientBuilder: Elite2ClientBuilder,
    private readonly systemToken: SystemToken
  ) {}

  public async process(
    currentUser: LoggedInUser,
    bookingId: number,
    formName: string,
    updatedSection: unknown,
    incidentDate?: Date | null
  ): Promise<void> {
    const { id: formId, form: existingReport = {} } = await this.draftReportClient.get(currentUser.username, bookingId)

    const updatedPayload = this.getUpdatedReport(existingReport, formName, updatedSection)

    if (updatedPayload || incidentDate) {
      return formId
        ? this.updateReport(formId, bookingId, currentUser, incidentDate, updatedPayload || null)
        : this.startNewReport(bookingId, currentUser, incidentDate, updatedPayload || {})
    }
    return null
  }

  private getUpdatedReport(
    existingReport: Record<string, unknown>,
    formName: string,
    updatedSection
  ): Record<string, unknown> | false {
    const updatedFormObject = {
      ...existingReport,
      [formName]: updatedSection,
    }

    const payloadChanged = !R.equals(existingReport, updatedFormObject)
    return payloadChanged ? updatedFormObject : false
  }

  private async updateReport(
    formId: number,
    bookingId: number,
    currentUser: LoggedInUser,
    incidentDateValue,
    formValue
  ): Promise<void> {
    const { username } = currentUser
    if (incidentDateValue || formValue) {
      logger.info(`Updated report with id: ${formId} for user: ${username} on booking: ${bookingId}`)
      await this.draftReportClient.update(formId, incidentDateValue, formValue)
    }
  }

  private async startNewReport(bookingId: number, currentUser, incidentDateValue, formObject): Promise<void> {
    const { username: userId, displayName: reporterName } = currentUser

    const token = await this.systemToken(userId)
    const elite2Client = this.elite2ClientBuilder(token)
    const { offenderNo, agencyId } = await elite2Client.getOffenderDetails(bookingId)
    const id = await this.draftReportClient.create({
      userId,
      reporterName,
      bookingId,
      agencyId,
      offenderNo,
      incidentDate: incidentDateValue,
      formResponse: formObject,
    })
    logger.info(`Created new report with id: ${id} for user: ${userId} on booking: ${bookingId}`)
  }

  public async updateAgencyId(agencyId: string, username: string, bookingId: number): Promise<void> {
    logger.info(`username: ${username} updating agencyId for booking: ${bookingId} to ${agencyId}`)
    await this.draftReportClient.updateAgencyId(agencyId, username, bookingId)
  }
}
