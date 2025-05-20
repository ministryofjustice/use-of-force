export interface AssignedLivingUnit {
  additionalProperties: { [key: string]: any }
  agencyId: string
  locationId: number
  description: string
  agencyName: string
}

export interface OffenderIdentifier {
  type: string
  value: string
  offenderNo: string
  bookingId: number
  issuedAuthorityText: string
  issuedDate: Date
  caseloadType: string
}

export interface InmateDetail {
  offenderNo: string
  bookingId: number
  bookingNo: string
  offenderId: number
  rootOffenderId: number
  firstName: string
  middleName: string
  lastName: string
  dateOfBirth: Date
  age: number
  activeFlag: boolean
  facialImageId: number
  agencyId: string
  assignedLivingUnitId: number
  religion: string
  language: string
  interpreterRequired: boolean
  writtenLanguage: string
  alertsCodes: string[]
  activeAlertCount: number
  inactiveAlertCount: number
  assignedLivingUnit: AssignedLivingUnit
  csra: string
  category: string
  categoryCode: string
  birthPlace: string
  birthCountryCode: string
  inOutStatus: string
  identifiers: OffenderIdentifier[]
  status: string
  recall: boolean
  imprisonmentStatus: string
}

export interface InmateBasicDetails {
  bookingId: number
  bookingNo: string
  offenderNo: string
  firstName: string
  middleName: string
  lastName: string
  agencyId: string
  assignedLivingUnitId: number
  dateOfBirth: Date
}

export interface PrisonerDetail {
  offenderNo: string
  title: string
  suffix: string
  firstName: string
  middleNames: string
  lastName: string
  dateOfBirth: string
  gender: string
  sexCode?: 'M' | 'F'
  nationalities: string
  currentlyInPrison?: 'Y' | 'N'
  latestBookingId: number
  latestLocationId: string
  latestLocation: string
  internalLocation: string
  pncNumber: string
  croNumber: string
  ethnicity: string
  ethnicityCode: string
  birthCountry: string
  religion: string
  religionCode: string
  convictedStatus: string
  bandCode: string
  imprisonmentStatus: string
  imprisonmentStatusDesc: string
  receptionDate?: string // ISO-8601 date format
  maritalStatus: string
  currentWorkingFirstName: string
  currentWorkingLastName: string
  currentWorkingBirthDate: Date
}

export interface UserDetail {
  staffId: number
  username: string
  firstName: string
  lastName: string
  thumbnailId: number
  activeCaseLoadId: string
  lockDate: Date
  expiryDate: Date
  lockedFlag: boolean
  expiredFlag: boolean
  additionalProperties: { [key: string]: any }
}

export interface CaseLoad {
  caseLoadId: string
  description: string
  type: string
  currentlyActive: boolean
}

interface Agency {
  agencyId: string
  description: string
  agencyType: string
  active: boolean
}

export type Prison = Agency

interface Location {
  incidentLocationId: string
  locationType: string
  description: string
  locationUsage: string
  agencyId: string
  parentLocationId: number
  currentOccupancy: number
  locationPrefix: string
  operationalCapacity: number
  userDescription: string
  internalLocationCode: string
}

export type PrisonLocation = Location
