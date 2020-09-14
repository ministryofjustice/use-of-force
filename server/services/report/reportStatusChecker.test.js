const { SectionStatus, check } = require('./reportStatusChecker')

describe('statusCheck', () => {
  const validReport = {
    incidentDetails: {
      incidentDate: {
        date: '01/01/2019',
        time: { hour: '12', minute: '30' },
      },
      witnesses: [{ name: 'BOB BARRY' }, { name: 'JAMES JOHN' }],
      locationId: -25,
      plannedUseOfForce: true,
    },
    useOfForceDetails: {
      pavaDrawn: false,
      restraint: false,
      batonDrawn: false,
      guidingHold: false,
      handcuffsApplied: false,
      positiveCommunication: false,
      personalProtectionTechniques: true,
      painInducingTechniques: false,
    },
    evidence: {
      cctvRecording: 'NO',
      baggedEvidence: true,
      bodyWornCamera: 'YES',
      photographsTaken: false,
      bodyWornCameraNumbers: [{ cameraNum: '1111' }, { cameraNum: '2222' }],
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
      useOfForceDetails: SectionStatus.NOT_STARTED,
      relocationAndInjuries: SectionStatus.NOT_STARTED,
      evidence: SectionStatus.NOT_STARTED,
    })
  })

  test('report with unvisited sections', async () => {
    const { evidence, relocationAndInjuries, ...partiallyCompleteReport } = validReport

    const output = check(partiallyCompleteReport)

    expect(output).toEqual({
      complete: false,
      incidentDetails: SectionStatus.COMPLETE,
      useOfForceDetails: SectionStatus.COMPLETE,
      relocationAndInjuries: SectionStatus.NOT_STARTED,
      evidence: SectionStatus.NOT_STARTED,
    })
  })

  test('valid report', async () => {
    const output = check(validReport)

    expect(output).toEqual({
      complete: true,
      incidentDetails: SectionStatus.COMPLETE,
      useOfForceDetails: SectionStatus.COMPLETE,
      relocationAndInjuries: SectionStatus.COMPLETE,
      evidence: SectionStatus.COMPLETE,
    })
  })

  test('invalid report', async () => {
    const invalidReport = {
      ...validReport,
      useOfForceDetails: {
        pavaDrawn: false,
        restraint: false,
        batonDrawn: null,
        guidingHold: false,
        handcuffsApplied: null,
        positiveCommunication: false,
        personalProtectionTechniques: undefined,
        painInducingTechniques: null,
      },
    }

    const output = check(invalidReport)

    expect(output).toEqual({
      complete: false,
      incidentDetails: SectionStatus.COMPLETE,
      useOfForceDetails: SectionStatus.INCOMPLETE,
      relocationAndInjuries: SectionStatus.COMPLETE,
      evidence: SectionStatus.COMPLETE,
    })
  })
})
