import * as R from 'ramda'
import moment from 'moment'
import {
  buildCsvRendererConfiguration,
  DescribedGroups,
  IncidentCountByGroup,
  invertGroupings,
} from '../incidentCountAggregator/aggregatorFunctions'
import { OffenderNoWithIncidentDate } from '../../../types/uof'
import { PrisonerDetail } from '../../../data/prisonClientTypes'

/**
 * Given a set of PrisonerDetail return a function that maps an OffenderNoWithDate to the age of the offender, in years,
 * on the date that the incident occurred.  An answer will only be provided when the offenderNo on a PrisonerDetails
 * object matches the offenderNo on the OffenderNoWithIncidentDate object.
 * @param prisonersDetails The set of PrisonerDetail used to define offender's dateOfBirth
 * @return a function that maps from offenderNoWithIncidentDate to an age in years. Rounded down to nearest whole year.
 */
export const buildIncidentToOffenderAge = (
  prisonersDetails: Array<PrisonerDetail>
): ((onwid: OffenderNoWithIncidentDate) => number) => {
  const prisonerDetailMap = prisonersDetails.reduce(
    (map, prisonerDetail) => map.set(prisonerDetail.offenderNo, prisonerDetail),
    new Map<string, PrisonerDetail>()
  )

  return ({ offenderNo, incidentDate }) => {
    const prisonerDetail = prisonerDetailMap.get(offenderNo)

    if (!prisonerDetail || !prisonerDetail.dateOfBirth) return undefined

    const dateOfBirth = moment(prisonerDetail.dateOfBirth, 'YYYY-MM-DD', true)
    const incidentMoment = moment(incidentDate).startOf('day')
    return incidentMoment.diff(dateOfBirth, 'years')
  }
}

const ageGroups: DescribedGroups = {
  '18-20': { codes: R.range(18, 21), description: '18 - 20' },
  '21-24': { codes: R.range(21, 25), description: '21 - 24' },
  '25-29': { codes: R.range(25, 30), description: '25 - 29' },
  '30-39': { codes: R.range(30, 40), description: '30 - 39' },
  '40-49': { codes: R.range(40, 50), description: '40 - 49' },
  '50-59': { codes: R.range(50, 60), description: '50 - 59' },
  '60-69': { codes: R.range(60, 70), description: '60 - 69' },
  '70-79': { codes: R.range(70, 80), description: '70 - 79' },
  '80+': { codes: R.range(80, 130), description: '80+' },
  UNKNOWN: { description: 'Unknown' },
}

const ageGroupsByAge = invertGroupings(ageGroups)

export const groupAges = (ages: number[]): IncidentCountByGroup => {
  const incidentCountsByAgeGroup = R.map(() => 0, ageGroups)

  const assignToGroup = age => {
    const ageGroup = ageGroupsByAge[age] || 'UNKNOWN'
    incidentCountsByAgeGroup[ageGroup] += 1
  }

  ages.forEach(assignToGroup)

  return incidentCountsByAgeGroup
}
export const aggregateIncidentsByAgeGroup = (
  incidents: OffenderNoWithIncidentDate[],
  prisonersDetails: PrisonerDetail[]
): IncidentCountByGroup => {
  const incidentToOffenderAgeFn = buildIncidentToOffenderAge(prisonersDetails)
  const ages = incidents.map(incidentToOffenderAgeFn)
  return groupAges(ages)
}

export const ageGroupCsvRendererConfig = buildCsvRendererConfiguration(ageGroups)
