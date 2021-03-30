import type { AdditionalComment, Statement, StatementSummary } from '../data/statementsClientTypes'

export type StatementWithComments = Statement & { additionalComments: AdditionalComment[] }

export { StatementSummary }
