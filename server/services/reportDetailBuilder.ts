import { Moment } from 'moment'
import { properCaseFullName } from '../utils/utils'
import reportSummary from '../routes/model/reportSummary'

interface ReportDetail {
  incidentId: number
  reporterName: string
  submittedDate: Moment
  bookingId: number
  [reportSummaryKeys: string]: any
}

export default class ReportDataBuilder {
  involvedStaffService

  locationService

  offenderService

  systemToken

  constructor({ involvedStaffService, locationService, offenderService, systemToken }) {
    this.involvedStaffService = involvedStaffService
    this.locationService = locationService
    this.offenderService = offenderService
    this.systemToken = systemToken
  }

  private format(reportId) {
    return staff => ({
      name: properCaseFullName(staff.name),
      username: staff.userId,
      reportId,
      statementId: staff.statementId,
    })
  }

  async build(username: string, report): Promise<ReportDetail> {
    const token = await this.systemToken(username)

    const { id, form, incidentDate, bookingId, reporterName, submittedDate, agencyId: prisonId } = report
    const offenderDetail = await this.offenderService.getOffenderDetails(token, bookingId)
    const { description: locationDescription = '' } = await this.locationService.getLocation(
      token,
      form.incidentDetails.locationId
    )
    const involvedStaff = await this.involvedStaffService.getInvolvedStaff(id)
    const involvedStaffNameAndUsernames = involvedStaff.map(this.format(id))

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
