import moment from 'moment'
import type IncidentClient from '../../data/draftReportClient'
import type SubmitDraftReportService from './submitDraftReportService'
import type { LoggedInUser } from '../../types/uof'
import { check as getReportStatus } from './reportStatusChecker'
import UpdateDraftReportService from './updateDraftReportService'
import { DraftReport, NoDraftReport } from '../../data/draftReportClientTypes'

export default class DraftReportService {
  constructor(
    private readonly incidentClient: IncidentClient,
    private readonly updateDraftReport: UpdateDraftReportService,
    private readonly submitDraftReport: SubmitDraftReportService
  ) {}

  public getCurrentDraft(userId: string, bookingId: number): Promise<DraftReport | NoDraftReport> {
    return this.incidentClient.get(userId, bookingId)
  }

  public async isDraftComplete(username: string, bookingId: number): Promise<boolean> {
    const { form = {} } = await this.getCurrentDraft(username, bookingId)
    const { complete } = getReportStatus(form)
    return complete
  }

  getReportStatus(report) {
    return getReportStatus(report)
  }

  public process(
    currentUser: LoggedInUser,
    bookingId: number,
    formName: string,
    updatedSection: unknown,
    incidentDate?: Date | null
  ): Promise<void> {
    return this.updateDraftReport.process(currentUser, bookingId, formName, updatedSection, incidentDate)
  }

  public updateAgencyId(agencyId: string, username: string, bookingId: number): Promise<void> {
    return this.updateDraftReport.updateAgencyId(agencyId, username, bookingId)
  }

  public submit(
    currentUser: LoggedInUser,
    bookingId: number,
    now: () => moment.Moment = () => moment()
  ): Promise<number | false> {
    return this.submitDraftReport.submit(currentUser, bookingId, now)
  }
}
