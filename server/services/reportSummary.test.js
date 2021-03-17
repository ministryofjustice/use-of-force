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
  describe('createRelocation', () => {
    it('should return "Yes', () => {
      form.relocationAndInjuries.relocationCompliancy = true
      const result = reportSummary(form, offenderDetail, prison, locationDescription, involvedStaff, incidentDate)
      expect(result.relocationAndInjuries.relocationCompliancy).toEqual('Yes')
    })

    it('should return "No', () => {
      form.relocationAndInjuries.relocationCompliancy = false
      const result = reportSummary(form, offenderDetail, prison, locationDescription, involvedStaff, incidentDate)
      expect(result.relocationAndInjuries.relocationCompliancy).toEqual('No')
    })

    it('should return "No - primary location" with detail in lower case', () => {
      form.relocationAndInjuries.relocationCompliancy = false
      form.relocationAndInjuries.relocationType = 'PRIMARY'
      const result = reportSummary(form, offenderDetail, prison, locationDescription, involvedStaff, incidentDate)
      expect(result.relocationAndInjuries.relocationCompliancy).toEqual('No - primary relocation')
    })

    it('should return "No - another kind of movement" with detail in lower case', () => {
      form.relocationAndInjuries.relocationCompliancy = false
      form.relocationAndInjuries.relocationType = 'OTHER'
      form.relocationAndInjuries.typeOfRelocation = 'Another kind of MOVEMENT'
      const result = reportSummary(form, offenderDetail, prison, locationDescription, involvedStaff, incidentDate)
      expect(result.relocationAndInjuries.relocationCompliancy).toEqual('No - another kind of movement')
    })
  })

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
