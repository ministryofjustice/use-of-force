import * as R from 'ramda'
import type { LoggedInUser } from '../../types/uof'

import logger from '../../../log'
import type { PrisonClient, DraftReportClient, IncidentClient } from '../../data'
import ReportLogClient from '../../data/reportLogClient'
import { InTransaction } from '../../data/dataAccess/db'
import AuthService from '../authService'

export default class UpdateDraftReportService {
  constructor(
    private readonly draftReportClient: DraftReportClient,
    private readonly incidentClient: IncidentClient,
    private readonly reportLogClient: ReportLogClient,
    private readonly inTransaction: InTransaction,
    private readonly prisonClient: PrisonClient,
    private readonly authService: AuthService
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
      await this.incidentClient.update(formId, incidentDateValue, formValue)
    }
  }

  private async startNewReport(bookingId: number, currentUser, incidentDateValue, formObject): Promise<void> {
    const { username: userId, displayName: reporterName } = currentUser

    const token = await this.authService.getSystemClientToken(userId)
    const { offenderNo, agencyId } = await this.prisonClient.getOffenderDetails(bookingId, token)

    return this.inTransaction(async client => {
      const id = await this.draftReportClient.create({
        userId,
        reporterName,
        bookingId,
        agencyId,
        offenderNo,
        incidentDate: incidentDateValue,
        formResponse: formObject,
      })
      await this.reportLogClient.create(client, userId, id)

      logger.info(`Created new report with id: ${id} for user: ${userId} on booking: ${bookingId}`)
    })
  }

  public async updateAgencyId(agencyId: string, username: string, bookingId: number): Promise<void> {
    logger.info(`username: ${username} updating agencyId for booking: ${bookingId} to ${agencyId}`)
    await this.draftReportClient.updateAgencyId(agencyId, username, bookingId)
  }

  public async updateLocationId(reportId, incidentDateValue, formValue) {
    await this.incidentClient.update(reportId, incidentDateValue, formValue)
  }
}
