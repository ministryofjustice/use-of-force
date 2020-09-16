import type { AdditionalComment, Statement, StatementSummary } from '../data/statementsClientTypes'

export type StatementWithComments = Statement & { additionalComments: AdditionalComment[] }

export type Status = {
  value: string
  label: string
}

export { StatementSummary }
