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

export interface UserService {
  /** get current user */
  getUser: (token: string) => Promise<User>
  /** Get details for users along with email address */
  getUsers: (token: string, usernames: string[]) => Promise<GetUsersResults[]>
}

export interface PrisonerDetail {
  offenderNo: string
  firstName?: string
  lastName?: string
  dateOfBirth?: string // ISO 8601 date format
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
