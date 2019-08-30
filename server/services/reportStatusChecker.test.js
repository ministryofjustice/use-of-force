const { SectionStatus, check } = require('./reportStatusChecker')

describe('statusCheck', () => {
  const validReport = {
    incidentDetails: {
      witnesses: [{ name: 'BOB BARRY' }, { name: 'JAMES JOHN' }],
      locationId: -25,
      involvedStaff: [
        { name: 'Itag User', email: 'itag_user@digital.justice.gov.uk', staffId: 1, username: 'ITAG_USER' },
        { name: 'Licence Case Admin', email: 'ca_user@digital.justice.gov.uk', staffId: 3, username: 'CA_USER' },
      ],
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
      staffMedicalAttention: true,
      prisonerHospitalisation: true,
      healthcarePractionerName: 'Dr Jenny',
      staffNeedingMedicalAttention: [{ name: 'Frank James', hospitalisation: false }],
    },
  }

  test('empty report', async () => {
    const output = check({})

    expect(output).toEqual({
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
      incidentDetails: SectionStatus.COMPLETE,
      useOfForceDetails: SectionStatus.COMPLETE,
      relocationAndInjuries: SectionStatus.NOT_STARTED,
      evidence: SectionStatus.NOT_STARTED,
    })
  })

  test('valid report', async () => {
    const output = check(validReport)

    expect(output).toEqual({
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
      },
    }

    const output = check(invalidReport)

    expect(output).toEqual({
      incidentDetails: SectionStatus.COMPLETE,
      useOfForceDetails: SectionStatus.INCOMPLETE,
      relocationAndInjuries: SectionStatus.COMPLETE,
      evidence: SectionStatus.COMPLETE,
    })
  })

  test('invalid incident details', async () => {
    const invalidReport = {
      ...validReport,
      incidentDetails: {
        witnesses: [{ name: 'BOB BARRY' }, { name: 'JAMES JOHN' }],
        locationId: -25,
        involvedStaff: [{ username: 'ITAG_USER' }, { username: 'CA_USER' }],
        plannedUseOfForce: true,
      },
    }

    const output = check(invalidReport)

    expect(output).toEqual({
      incidentDetails: SectionStatus.INCOMPLETE,
      useOfForceDetails: SectionStatus.COMPLETE,
      relocationAndInjuries: SectionStatus.COMPLETE,
      evidence: SectionStatus.COMPLETE,
    })
  })
})
