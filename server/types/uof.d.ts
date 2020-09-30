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
  verified: boolean

  email?: string // only if exists and verified
  name?: string // only if exists
  staffId?: number // only if exists
}

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
