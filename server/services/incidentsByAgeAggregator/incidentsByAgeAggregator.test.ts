import moment from 'moment'
import { buildIncidentToOffenderAge } from './index'

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
})
