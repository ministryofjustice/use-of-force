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
