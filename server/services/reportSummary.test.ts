import { UofReasons } from '../config/types'
import { Prison } from '../data/prisonClientTypes'
import { UseOfForceDraftReport } from '../data/UseOfForceReport'
import reportSummary from './reportSummary'

const form: UseOfForceDraftReport = { useOfForceDetails: {}, relocationAndInjuries: {}, reasonsForUseOfForce: {} }
const offenderDetail = {}
const prison: Prison = { agencyId: 'MDI', description: 'Moorland HMP', active: true, agencyType: 'INST' }
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

  describe('Use of force reasons', () => {
    it('should return undefined', () => {
      form.reasonsForUseOfForce.reasons = undefined
      const result = reportSummary(form, offenderDetail, prison, locationDescription, involvedStaff, incidentDate)
      expect(result.useOfForceDetails.reasonsForUseOfForce).toEqual(undefined)
    })

    it('should handle single value', () => {
      form.reasonsForUseOfForce.reasons = [UofReasons.ASSAULT_BY_A_MEMBER_OF_PUBLIC.value]
      const result = reportSummary(form, offenderDetail, prison, locationDescription, involvedStaff, incidentDate)
      expect(result.useOfForceDetails.reasonsForUseOfForce).toEqual(UofReasons.ASSAULT_BY_A_MEMBER_OF_PUBLIC.label)
    })

    it('should handle multiple values', () => {
      form.reasonsForUseOfForce.reasons = [
        UofReasons.ASSAULT_BY_A_MEMBER_OF_PUBLIC.value,
        UofReasons.CONCERTED_INDISCIPLINE.value,
      ]
      const result = reportSummary(form, offenderDetail, prison, locationDescription, involvedStaff, incidentDate)
      expect(result.useOfForceDetails.reasonsForUseOfForce).toEqual(
        'Assault by a member of public, Concerted indiscipline'
      )
    })
  })

  describe('Use of force primary reason', () => {
    it('should return undefined', () => {
      form.reasonsForUseOfForce.primaryReason = undefined
      const result = reportSummary(form, offenderDetail, prison, locationDescription, involvedStaff, incidentDate)
      expect(result.useOfForceDetails.primaryReason).toEqual(undefined)
    })

    it('should handle value', () => {
      form.reasonsForUseOfForce.primaryReason = UofReasons.ASSAULT_BY_A_MEMBER_OF_PUBLIC.value
      const result = reportSummary(form, offenderDetail, prison, locationDescription, involvedStaff, incidentDate)
      expect(result.useOfForceDetails.primaryReason).toEqual(UofReasons.ASSAULT_BY_A_MEMBER_OF_PUBLIC.label)
    })
  })

  describe('Relocation type', () => {
    it('should return description', () => {
      form.relocationAndInjuries.relocationType = 'NTRG'
      const result = reportSummary(form, offenderDetail, prison, locationDescription, involvedStaff, incidentDate)
      expect(result.relocationAndInjuries.relocationCompliancy).toEqual('No - Handed to local staff (NTRG)')
    })

    it('should return user provided description when provided', () => {
      form.relocationAndInjuries.relocationType = 'OTHER'
      form.relocationAndInjuries.userSpecifiedRelocationType = 'We had to put them on a BIG boat'
      const result = reportSummary(form, offenderDetail, prison, locationDescription, involvedStaff, incidentDate)
      expect(result.relocationAndInjuries.relocationCompliancy).toEqual('No - We had to put them on a BIG boat')
    })
  })
})
