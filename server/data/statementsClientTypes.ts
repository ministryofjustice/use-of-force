export type StatementSummary = {
  id: number
  reporterName: string
  offenderNo: string
  incidentDate: Date
  name: string // name of staff
  inProgress: boolean
  isOverdue: boolean
  status: string
}

export type Statement = {
  id: number
  bookingId: number
  incidentDate: Date
  lastTrainingMonth?: number
  lastTrainingYear?: number
  jobStartYear?: number
  statement?: string
  submittedDate?: Date
  name: string
  reporterName: string
}

export type AdditionalComment = { additionalComment: string; dateSubmitted: Date }
