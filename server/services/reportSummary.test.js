const reportSummary = require('./reportSummary')

const form = {
  evidence: {},
  involvedStaff: [],
  incidentDetails: {},
  useOfForceDetails: {},
  relocationAndInjuries: {},
}
const offenderDetail = {}
const prison = {}
const locationDescription = ''
const involvedStaff = []
const incidentDate = new Date()

describe('reportSummary', () => {
  describe('getPainInducingTechniques', () => {
    it('should return undefined', () => {
      form.useOfForceDetails.painInducingTechniques = undefined
      const result = reportSummary(form, offenderDetail, prison, locationDescription, involvedStaff, incidentDate)
      expect(result.useOfForceDetails.painInducingTechniques).toEqual(undefined)
    })

    it('should return "Yes', () => {
      form.useOfForceDetails.painInducingTechniques = true
      form.useOfForceDetails.painInducingTechniquesUsed = undefined
      const result = reportSummary(form, offenderDetail, prison, locationDescription, involvedStaff, incidentDate)
      expect(result.useOfForceDetails.painInducingTechniques).toEqual('Yes')
    })

    it('should return 1 technique used', () => {
      form.useOfForceDetails.painInducingTechniques = true
      form.useOfForceDetails.painInducingTechniquesUsed = ['FINAL_LOCK_FLEXION']
      const result = reportSummary(form, offenderDetail, prison, locationDescription, involvedStaff, incidentDate)
      expect(result.useOfForceDetails.painInducingTechniques).toEqual('Yes - Final lock flexion')
    })

    it('should return 2 techniques used', () => {
      form.useOfForceDetails.painInducingTechniques = true
      form.useOfForceDetails.painInducingTechniquesUsed = ['FINAL_LOCK_FLEXION', 'THUMB_LOCK']
      const result = reportSummary(form, offenderDetail, prison, locationDescription, involvedStaff, incidentDate)
      expect(result.useOfForceDetails.painInducingTechniques).toEqual('Yes - Final lock flexion, Thumb lock')
    })

    it('should return "No"', () => {
      form.useOfForceDetails.painInducingTechniques = false
      form.useOfForceDetails.painInducingTechniquesUsed = undefined
      const result = reportSummary(form, offenderDetail, prison, locationDescription, involvedStaff, incidentDate)
      expect(result.useOfForceDetails.painInducingTechniques).toEqual('No')
    })
  })
})
