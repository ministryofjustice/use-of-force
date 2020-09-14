import type moment from 'moment'

export interface IncidentSearchQuery {
  prisonNumber?: string
  reporter?: string
  dateFrom?: moment.Moment
  dateTo?: moment.Moment
}

export interface ReportSummary {
  id: number
  bookingId: number
  reporterName: string
  offenderNo: string
  incidentDate: Date
  status?: string
}

export interface IncompleteReportSummary extends ReportSummary {
  isOverdue?: boolean
}

export type NoDraftReport = Record<string, any>

export interface DraftReport {
  id: number
  incidentDate: Date
  form: unknown
  agencyId: string
}
