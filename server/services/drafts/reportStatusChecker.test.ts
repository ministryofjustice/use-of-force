import { UofReasons } from '../../config/types'
import { UseOfForceDraftReport } from '../../data/UseOfForceReport'
import { SectionStatus, check, isReportComplete } from './reportStatusChecker'

// remove mock once featureFlagDisplayDogAndTaserQuestions feature flag no longer needed
jest.mock('../../config', () => ({
  default: { featureFlagDisplayDogAndTaserQuestions: true },
}))

describe('statusCheck', () => {
  const validReport: UseOfForceDraftReport = {
    incidentDetails: {
      witnesses: [{ name: 'BOB BARRY' }, { name: 'JAMES JOHN' }],
      incidentLocationId: 'incident-location-id',
      plannedUseOfForce: true,
      authorisedBy: 'Eric Bloodaxe',
    },
    involvedStaff: [],
    reasonsForUseOfForce: { reasons: [UofReasons.FIGHT_BETWEEN_PRISONERS.value] },
    useOfForceDetails: {
      pavaDrawnAgainstPrisoner: false,
      bittenByPrisonDog: false,
      batonDrawnAgainstPrisoner: false,
      guidingHold: false,
      escortingHold: false,
      handcuffsApplied: false,
      positiveCommunication: false,
      personalProtectionTechniques: true,
      painInducingTechniquesUsed: 'NONE',
      restraintPositions: 'NONE',
      bodyWornCamera: 'YES',
      bodyWornCameraNumbers: [{ cameraNum: '1111' }, { cameraNum: '2222' }],
      weaponsObserved: 'YES',
      weaponTypes: [{ weaponType: 'gun' }],
    },
    evidence: {
      cctvRecording: 'NO',
      baggedEvidence: true,
      photographsTaken: false,
      evidenceTagAndDescription: [
        { description: 'aaaaa', evidenceTagReference: '1111' },
        { description: 'bbbb', evidenceTagReference: '2222' },
      ],
    },
    relocationAndInjuries: {
      f213CompletedBy: 'Dr Bob ',
      prisonerInjuries: false,
      healthcareInvolved: true,
      prisonerRelocation: 'OWN_CELL',
      relocationCompliancy: false,
      relocationType: 'VEHICLE',
      staffMedicalAttention: true,
      prisonerHospitalisation: true,
      healthcarePractionerName: 'Dr Jenny',
      staffNeedingMedicalAttention: [{ name: 'Frank James', hospitalisation: false }],
    },
  }

  test('empty report', async () => {
    const output = check({})

    expect(output).toEqual({
      complete: false,
      incidentDetails: SectionStatus.NOT_STARTED,
      involvedStaff: SectionStatus.NOT_STARTED,
      reasonsForUseOfForce: SectionStatus.NOT_STARTED,
      useOfForceDetails: SectionStatus.NOT_STARTED,
      relocationAndInjuries: SectionStatus.NOT_STARTED,
      evidence: SectionStatus.NOT_STARTED,
    })

    expect(isReportComplete({})).toBe(false)
  })

  test('report with unvisited sections', async () => {
    const { evidence, relocationAndInjuries, ...partiallyCompleteReport } = validReport

    const output = check(partiallyCompleteReport)

    expect(output).toEqual({
      complete: false,
      incidentDetails: SectionStatus.COMPLETE,
      involvedStaff: SectionStatus.COMPLETE,
      reasonsForUseOfForce: SectionStatus.COMPLETE,
      useOfForceDetails: SectionStatus.COMPLETE,
      relocationAndInjuries: SectionStatus.NOT_STARTED,
      evidence: SectionStatus.NOT_STARTED,
    })

    expect(isReportComplete(partiallyCompleteReport)).toBe(false)
  })

  test('valid report', async () => {
    const output = check(validReport)

    expect(output).toEqual({
      complete: true,
      incidentDetails: SectionStatus.COMPLETE,
      involvedStaff: SectionStatus.COMPLETE,
      reasonsForUseOfForce: SectionStatus.COMPLETE,
      useOfForceDetails: SectionStatus.COMPLETE,
      relocationAndInjuries: SectionStatus.COMPLETE,
      evidence: SectionStatus.COMPLETE,
    })

    expect(isReportComplete(validReport)).toBe(true)
  })

  test('invalid report', async () => {
    const invalidReport = {
      ...validReport,
      useOfForceDetails: {
        pavaDrawnAgainstPrisoner: false,
        restraint: false,
        batonDrawnAgainstPrisoner: null,
        guidingHold: false,
        escortingHold: false,
        handcuffsApplied: null,
        positiveCommunication: false,
        personalProtectionTechniques: undefined,
        painInducingTechniquesUsed: null,
      },
    }

    const output = check(invalidReport)

    expect(output).toEqual({
      complete: false,
      incidentDetails: SectionStatus.COMPLETE,
      involvedStaff: SectionStatus.COMPLETE,
      reasonsForUseOfForce: SectionStatus.COMPLETE,
      useOfForceDetails: SectionStatus.INCOMPLETE,
      relocationAndInjuries: SectionStatus.COMPLETE,
      evidence: SectionStatus.COMPLETE,
    })

    expect(isReportComplete(invalidReport)).toBe(false)
  })
})
