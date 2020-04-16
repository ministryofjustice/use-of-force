import moment from 'moment'
import * as R from 'ramda'
import { buildIncidentToOffenderAge, groupAges } from './index'

describe('incidentsByAgeAggregator', () => {
  describe('incidentToOffenderAge + factory', () => {
    const incidentDate1 = moment({ year: 2020, month: 1, day: 2 }).toDate()

    it('Returns undefined when there are no PrisonerDetails', () => {
      const incidentToOffenderAge = buildIncidentToOffenderAge([])
      expect(incidentToOffenderAge({ offenderNo: 'X', incidentDate: incidentDate1 })).toBeUndefined()
    })

    it('Returns undefined when PrisonerDetails do not match', () => {
      const incidentToOffenderAge = buildIncidentToOffenderAge([{ offenderNo: 'Y' }])
      expect(incidentToOffenderAge({ offenderNo: 'X', incidentDate: incidentDate1 })).toBeUndefined()
    })

    it('Returns undefined when PrisonerDetail has no dateOfBirth', () => {
      const incidentToOffenderAge = buildIncidentToOffenderAge([{ offenderNo: 'X' }])
      expect(incidentToOffenderAge({ offenderNo: 'X', incidentDate: incidentDate1 })).toBeUndefined()
    })

    it('Returns age in years when offenderNo matches', () => {
      const incidentToOffenderAge = buildIncidentToOffenderAge([{ offenderNo: 'X', dateOfBirth: '2010-02-02' }])
      expect(incidentToOffenderAge({ offenderNo: 'X', incidentDate: incidentDate1 })).toBe(10)
    })

    it('Returns age in years when off by one day', () => {
      const incidentToOffenderAge = buildIncidentToOffenderAge([{ offenderNo: 'X', dateOfBirth: '2010-02-03' }])
      expect(incidentToOffenderAge({ offenderNo: 'X', incidentDate: incidentDate1 })).toBe(9)
    })

    it('Correctly matches multiple offender numbers', () => {
      const incidentToOffenderAge = buildIncidentToOffenderAge([
        { offenderNo: 'X', dateOfBirth: '2010-02-03' },
        { offenderNo: 'Y', dateOfBirth: '2010-02-02' },
        { offenderNo: 'Z', dateOfBirth: '2011-01-01' },
      ])
      expect(incidentToOffenderAge({ offenderNo: 'X', incidentDate: incidentDate1 })).toBe(9)
      expect(incidentToOffenderAge({ offenderNo: 'Y', incidentDate: incidentDate1 })).toBe(10)
    })
  })
  describe('groupAges', () => {
    const defaultValues = {
      '18-20': 0,
      '21-24': 0,
      '25-29': 0,
      '30-39': 0,
      '40-49': 0,
      '50-59': 0,
      '60-69': 0,
      '70-79': 0,
      '80+': 0,
      UNKNOWN: 0,
    }
    it('Returns zero for each age group', () => {
      expect(groupAges([])).toEqual(defaultValues)
    })

    it('Correctly assigns ages to groups', () => {
      expect(groupAges(R.range(0, 100))).toEqual({
        '18-20': 3,
        '21-24': 4,
        '25-29': 5,
        '30-39': 10,
        '40-49': 10,
        '50-59': 10,
        '60-69': 10,
        '70-79': 10,
        '80+': 20,
        UNKNOWN: 18,
      })
    })

    it('null and undefined ages fall in the UNKNOWN group', () => {
      expect(groupAges([undefined, null])).toEqual({
        ...defaultValues,
        UNKNOWN: 2,
      })
    })
  })
})
