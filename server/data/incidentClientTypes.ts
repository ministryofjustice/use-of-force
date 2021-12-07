import moment, { Moment } from 'moment'
import { UseOfForceReport } from './UseOfForceReport'

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

export interface AnonReportSummary {
  statementId: number
  incidentDate: Date
  agencyId: string
  isRemovalRequested: boolean
}

export interface IncompleteReportSummary extends ReportSummary {
  isOverdue?: boolean
  isRemovalRequested?: boolean
}

export interface Report extends ReportSummary {
  username: string
  agencyId: string
  submittedDate: Date
  form: UseOfForceReport
}

export interface InvolvedStaff {
  statementId: number
  userId: string
  name: string
  email: string
}

export interface NotificationReminder {
  reportId: number
  statementId: number
  userId: string
  recipientEmail: string
  recipientName: string
  nextReminderDate: Moment
  submittedDate: Moment
  reporterName: string
  incidentDate: Moment
  isReporter: boolean
  overdueDate: Moment
  isOverdue?: boolean
  reminder: number
}
