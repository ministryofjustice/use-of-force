type StatementSummary = {
  id: number
  reporterName: string
  offenderNo: string
  incidentDate: Date
  name: string // name of staff
  inProgress: boolean
  isOverdue: boolean
  status: string
}

type Statement = {
  id?: number
  bookingId?: number
  incidentDate?: Date
  lastTrainingMonth?: number
  lastTrainingYear?: number
  jobStartYear?: number
  statement?: string
  submittedDate?: Date
  name?: string
  reporterName?: string
}

type AdditionalComments = Array<{ additionalComment: string; dateSubmitted: Date }>
