import moment from 'moment'
import { CaseLoad } from '../data/prisonClientTypes'

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
  displayNameInitial: string
}

export type FoundUserResult = {
  username: string
  verified: boolean
  email?: string // only if verified
  name: string
  activeCaseLoadId?: string // not present for new users or having active caseload removed
  staffId: number
}

export type UserWithPrison = FoundUserResult & { prison?: string }

export type SystemToken = (string?) => Promise<string>

export type LoggedInUser = {
  username: string
  token: string
  refreshToken: string
  refreshTime: any
  firstName: string
  lastName: string
  userId: string
  displayName: string
  isReviewer: boolean
  isCoordinator: boolean
  activeCaseLoadId: string
}
