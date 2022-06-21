import { properCaseFullName } from '../utils/utils'
import reportSummary from './reportSummary'
import type { InvolvedStaffService } from './involvedStaffService'
import type LocationService from './locationService'
import type OffenderService from './offenderService'
import type { SystemToken } from '../types/uof'
import { Report } from '../data/incidentClientTypes'

export interface ReportDetail {
  incidentId: number
  reporterName: string
  submittedDate: Date
  bookingId: number
  [reportSummaryKeys: string]: any
}

export default class ReportDataBuilder {
  constructor(
    private readonly involvedStaffService: InvolvedStaffService,
    private readonly locationService: LocationService,
    private readonly offenderService: OffenderService,
    private readonly systemToken: SystemToken
  ) {}

  private format(reportId, reporterUsername) {
    return staff => ({
      name: properCaseFullName(staff.name),
      username: staff.userId,
      reportId,
      isReporter: reporterUsername === staff.userId,
      statementId: staff.statementId,
    })
  }

  async build(currentUsername: string, report: Report): Promise<ReportDetail> {
    const token = await this.systemToken(currentUsername)

    const { id, form, username, incidentDate, bookingId, reporterName, submittedDate, agencyId: prisonId } = report
    const offenderDetail = await this.offenderService.getOffenderDetails(token, bookingId)
    const locationDescription = await this.locationService.getLocation(token, form.incidentDetails.locationId)
    const involvedStaff = await this.involvedStaffService.getInvolvedStaff(id)
    const involvedStaffNameAndUsernames = involvedStaff.map(this.format(id, username))

    const prison = await this.locationService.getPrisonById(token, prisonId)

    return {
      incidentId: id,
      reporterName,
      submittedDate,
      bookingId,
      ...reportSummary(form, offenderDetail, prison, locationDescription, involvedStaffNameAndUsernames, incidentDate),
    }
  }
}
