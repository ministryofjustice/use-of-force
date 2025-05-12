import { properCaseFullName } from '../utils/utils'
import reportSummary from './reportSummary'
import type { InvolvedStaffService } from './involvedStaffService'
import type LocationService from './locationService'
import type NomisMappingService from './nomisMappingService'
import type OffenderService from './offenderService'
import { Report } from '../data/incidentClientTypes'
import AuthService from './authService'

export interface ReportDetail {
  incidentId: number
  reporterName: string
  submittedDate: Date
  bookingId: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  offenderDetail: any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [reportSummaryKeys: string]: any
}

export default class ReportDataBuilder {
  constructor(
    private readonly involvedStaffService: InvolvedStaffService,
    private readonly locationService: LocationService,
    private readonly offenderService: OffenderService,
    private readonly nomisMappingService: NomisMappingService,
    private readonly authService: AuthService
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

  async getLocationId(token, { incidentDetails }): Promise<string> {
    if (incidentDetails.incidentLocationId) {
      return incidentDetails.incidentLocationId
    }

    // if the report only contains the original locationId, use it to get the new associate dpsLocationId
    const { dpsLocationId } = await this.nomisMappingService.getDpsLocationDetailsHavingCorrespondingNomisLocationId(
      token,
      incidentDetails.locationId
    )
    return dpsLocationId

    // TODO: locationId is the original id that may already be in DB.
    // consider adding the dpsLocationDetail as the incidentLocationId to the form_response.incidentDetails json in the DB
    // when a user views an already submitted report.
    // Do not delete the existing locationId already there (for safety!) as both locationId and incidentLocationId can exist together
  }

  async build(currentUsername: string, report: Report): Promise<ReportDetail> {
    const token = await this.authService.getSystemClientToken(currentUsername)

    const { id, form, username, incidentDate, bookingId, reporterName, submittedDate, agencyId: prisonId } = report
    const offenderDetail = await this.offenderService.getOffenderDetails(bookingId, currentUsername)
    const incidentLocationId = await this.getLocationId(token, form)
    const locationDescription = await this.locationService.getLocation(token, incidentLocationId)
    const involvedStaff = await this.involvedStaffService.getInvolvedStaff(id)
    const involvedStaffNameAndUsernames = involvedStaff.map(this.format(id, username))

    const prison = await this.locationService.getPrisonById(token, prisonId)

    return {
      incidentId: id,
      reporterName,
      submittedDate,
      bookingId,
      ...reportSummary(form, offenderDetail, prison, locationDescription, involvedStaffNameAndUsernames, incidentDate),
      offenderDetail,
    }
  }
}
