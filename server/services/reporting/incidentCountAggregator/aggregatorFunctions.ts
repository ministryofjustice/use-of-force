import * as R from 'ramda'
import { PrisonerDetail } from '../../../data/elite2ClientBuilderTypes'

export interface Groups {
  [group: string]: {
    codes?: Array<string>
  }
}

export interface DescribedGroups extends Groups {
  [group: string]: {
    description: string
    codes?: Array<string>
  }
}

export interface IncidentCountByOffender {
  [offenderNo: string]: number
}

export interface IncidentCountByGroup {
  [group: string]: number
}

/**
 * Invert a Groups object to yield a map of code -> groupName as an object
 */
export const invertGroupings: (groups: Groups) => { [code: string]: string } = R.pipe(
  R.toPairs,
  R.chain(([groupName, { codes }]) => (codes ? codes.map(code => [code, groupName]) : [])),
  R.fromPairs,
  Object.freeze
)

export type CsvRendererConfiguration = Array<{ key: string; header: string }>

export interface IncidentsByPrisonerPropertyAggregator {
  (incidentCountByOffender: IncidentCountByOffender, prisonerDetails: Array<PrisonerDetail>): IncidentCountByGroup
}

export const aggregatorFactory = (
  codesByGroup: Groups,
  defaultGroup: string,
  prisonerDetailPropertyName: string
): IncidentsByPrisonerPropertyAggregator => {
  const groupsByCode = invertGroupings(codesByGroup)

  return (offenderNumberToIncidentCountMap, prisonersDetails) =>
    prisonersDetails.reduce(
      (accumulator, prisonerDetail) => {
        const code = prisonerDetail[prisonerDetailPropertyName]

        const group = groupsByCode[code] || defaultGroup
        const accumulatedCount = accumulator[group]
        accumulator[group] = accumulatedCount + offenderNumberToIncidentCountMap[prisonerDetail.offenderNo]
        return accumulator
      },
      R.map(() => 0, codesByGroup)
    )
}

export const buildCsvRendererConfiguration = (groups: DescribedGroups): CsvRendererConfiguration =>
  Object.entries(groups).map(([group, { description }]) => ({
    key: group,
    header: description,
  }))
