import moment from 'moment'

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

type User = {
  staffId: number
  username: string
  firstName: string
  lastName: string
  activeCaseLoadId: string
  accountStatus: string
  active: boolean
  caseLoadId: string
  description: string
  type: string
  caseloadFunction: string
  currentlyActive: boolean
  displayname: string
}

type GetUsersResults = {
  username: string
  missing: boolean
  verified: boolean

  email?: string // only if exists and verified
  name?: string // only if exists
  staffId?: number // only if exists
}

export type SystemToken = (string?) => Promise<string>

export interface PrisonLocation {
  agencyId?: string
  currentOccupancy?: number
  description?: string
  internalLocationCode?: string
  locationId?: number
  locationPrefix?: string
  locationType?: string
  locationUsage?: string
  operationalCapacity?: number
  parentLocationId?: number
  userDescription?: string
}

export interface UserService {
  /** get current user */
  getUser: (token: string) => Promise<User>
  /** Get details for users along with email address */
  getUsers: (token: string, usernames: string[]) => Promise<GetUsersResults[]>
}

export interface OffenderService {
  getOffenderDetails: (token: string, bookingId: string) => Promise<any>
  getPrisonersDetails: (token: string, offenderNumbers: string[]) => Promise<PrisonerDetail[]>
  getOffenderImage: (token: string, bookingId: string) => Promise<ReadableStream>
  getOffenderNames: (token: string, offenderNos: string[]) => Promise<{ [offenderNo: string]: string }>
}

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

export interface PrisonerDetail {
  offenderNo: string
  firstName?: string
  lastName?: string
  dateOfBirth?: string // ISO 8601 date format eg 1984-02-24
  gender?: string
  sexCode?: 'M' | 'F'
  nationalities?: string
  currentlyInPrison?: 'Y' | 'N'
  latestBookingId?: number
  latestLocationId?: string
  latestLocation?: string
  internalLocation?: string
  pncNumber?: string
  croNumber?: string
  ethnicity?: string
  ethnicityCode?: string
  birthCountry?: string
  religion?: string
  religionCode?: string
  convictedStatus?: string
  imprisonmentStatus?: string
  imprisonmentStatusDesc?: string
  receptionDate?: string // ISO-8601 date format
  maritalStatus?: string
}

export interface Prison {
  active?: boolean
  agencyId?: string
  agencyType?: string
  description?: string
}

export interface LocationService {
  getPrisons: (token: string) => Promise<Prison[]>
  getPrisonById: (token: string, prisonId: string) => Promise<Prison>
  getLocation: (token: string, locationId: string) => Promise<PrisonLocation>
  getIncidentLocations: (token: string, agencyId: string) => Promise<PrisonLocation[]>
}
