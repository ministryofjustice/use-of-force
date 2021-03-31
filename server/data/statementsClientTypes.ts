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

export type StatementUpdate = {
  lastTrainingMonth: number
  lastTrainingYear: number
  jobStartYear: number
  statement: string
}

export type AdditionalComment = { additionalComment: string; dateSubmitted: Date }

export type UsernameToStatementIds = { [username: string]: number }

export type ReviewerStatement = {
  id: number
  name: string
  userId: string
  isOverdue: boolean
  isSubmitted: boolean
  isDisputed: boolean
  bookingId: number
  incidentDate: Date
  lastTrainingMonth: number
  lastTrainingYear: number
  jobStartYear: number
  statement: string
  submittedDate: Date
}
