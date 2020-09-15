type UserStatement = {
  additionalComments?: Array<{ additionalComment: string; dateSubmitted: Date }>
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

type Status = {
  value: string
  label: string
}
