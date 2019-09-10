const expectedPayload = {
  evidence: {
    cctvRecording: 'NOT_KNOWN',
    baggedEvidence: true,
    bodyWornCamera: 'YES',
    photographsTaken: true,
    bodyWornCameraNumbers: [{ cameraNum: '123' }, { cameraNum: '789' }, { cameraNum: '456' }],
    evidenceTagAndDescription: [
      { description: 'This evidence was collected from the prisoner 1', evidenceTagReference: 'Bagged evidence 1' },
      { description: 'This evidence was collected from the prisoner 2', evidenceTagReference: 'Bagged evidence 2' },
      { description: 'Clothes samples', evidenceTagReference: 'Bagged evidence 3' },
    ],
  },
  incidentDetails: {
    witnesses: [{ name: 'Witness 1' }, { name: 'Tom Jones' }],
    locationId: 357591,
    involvedStaff: [
      { name: 'MR ZAGATO name', email: 'MR ZAGATO@gov.uk', staffId: 231232, username: 'MR ZAGATO' },
      { name: 'MRS JONES name', email: 'MRS JONES@gov.uk', staffId: 231232, username: 'MRS JONES' },
    ],
    plannedUseOfForce: true,
  },
  useOfForceDetails: {
    pavaUsed: true,
    batonUsed: true,
    pavaDrawn: true,
    restraint: true,
    batonDrawn: true,
    guidingHold: true,
    handcuffsApplied: true,
    restraintPositions: ['STANDING', 'ON_BACK', 'FACE_DOWN', 'KNEELING'],
    positiveCommunication: true,
    guidingHoldOfficersInvolved: 2,
    personalProtectionTechniques: true,
  },
  relocationAndInjuries: {
    f213CompletedBy: 'Dr Taylor',
    prisonerInjuries: true,
    healthcareInvolved: true,
    prisonerRelocation: 'SEGREGATION_UNIT',
    relocationCompliancy: true,
    staffMedicalAttention: true,
    prisonerHospitalisation: true,
    healthcarePractionerName: 'Dr Smith',
    staffNeedingMedicalAttention: [
      { name: 'Eddie Thomas', hospitalisation: true },
      { name: 'Jayne Eyre', hospitalisation: true },
    ],
  },
}

module.exports = {
  expectedPayload,
}
