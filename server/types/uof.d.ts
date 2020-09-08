import moment from 'moment'
import { CaseLoad } from '../data/elite2ClientBuilderTypes'

export type DateRange = [moment.Moment, moment.Moment]

export type AgencyId = string

export interface OffenderNoWithIncidentDate {
  offenderNo: string
  incidentDate: Date
}

export interface OffenderNoWithIncidentCount {
  offenderNo: string
  incidentCount: number
}

export type User = {
  staffId: number
  username: string
  firstName: string
  lastName: string
  activeCaseLoad: CaseLoad
  displayName: string
}

export type GetUsersResults = {
  username: string
  missing: boolean
  verified: boolean

  email?: string // only if exists and verified
  name?: string // only if exists
  staffId?: number // only if exists
}

export type SystemToken = (string?) => Promise<string>

export interface ReportingClient {
  getMostOftenInvolvedStaff: (agencyId: AgencyId, range: DateRange) => Promise<Array<any>>
  getMostOftenInvolvedPrisoners: (agencyId: AgencyId, range: DateRange) => Promise<Array<any>>
  getIncidentsOverview: (agencyId: AgencyId, range: DateRange, statuses) => Promise<Array<any>>
  getIncidentLocationsAndTimes: (agencyId: AgencyId, range: DateRange) => Promise<Array<any>>
  getIncidentCountByOffenderNo: (agencyId: AgencyId, range: DateRange) => Promise<Array<OffenderNoWithIncidentCount>>
  getIncidentsForAgencyAndDateRange: (
    agencyId: AgencyId,
    range: DateRange
  ) => Promise<Array<OffenderNoWithIncidentDate>>
}
