export type NoDraftReport = Record<string, any>

export interface DraftReport {
  id: number
  incidentDate?: Date
  form: unknown
  agencyId: string
}

export interface StaffDetails {
  username: string
  email?: string
  name?: string
  staffId?: number
  missing?: boolean
  verified?: boolean
}

export type OffenderReport = {
  date: moment.Moment
  form: {
    incidentDetails: Record<string, number>
  }
  reporter: string
  status: string
}

export type DuplicateReport = {
  reporter: string
  date: moment.Moment
  location: string
}
