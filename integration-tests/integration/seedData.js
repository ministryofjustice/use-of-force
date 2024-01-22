const expectedPayload = {
  evidence: {
    cctvRecording: 'NOT_KNOWN',
    baggedEvidence: true,
    photographsTaken: true,
    evidenceTagAndDescription: [
      { description: 'This evidence was collected from the prisoner 1', evidenceTagReference: 'Bagged evidence 1' },
      { description: 'This evidence was collected from the prisoner 2', evidenceTagReference: 'Bagged evidence 2' },
      { description: 'Clothes samples', evidenceTagReference: 'Bagged evidence 3' },
    ],
  },
  incidentDetails: {
    witnesses: [{ name: 'Witness A' }, { name: 'Tom Jones' }],
    locationId: 357591,
    plannedUseOfForce: true,
    authorisedBy: 'Eric Bloodaxe',
  },
  involvedStaff: [
    { name: 'Emily Jones', email: 'Emily@gov.uk', staffId: 5, username: 'EMILY_JONES', verified: true },
    { name: 'Jo Zagato', email: 'Jo@gov.uk', staffId: 2, username: 'JO_ZAGATO', verified: true },
  ],
  reasonsForUseOfForce: {
    reasons: ['FIGHT_BETWEEN_PRISONERS'],
  },
  useOfForceDetails: {
    bodyWornCamera: 'YES',
    bodyWornCameraNumbers: [{ cameraNum: '123' }, { cameraNum: '789' }, { cameraNum: '456' }],
    pavaUsed: true,
    batonUsed: true,
    pavaDrawn: true,
    batonDrawn: true,
    guidingHold: true,
    escortingHold: true,
    restraint: true,
    handcuffsApplied: true,
    restraintPositions: ['STANDING', 'ON_BACK', 'FACE_DOWN', 'KNEELING'],
    painInducingTechniques: true,
    painInducingTechniquesUsed: ['FINAL_LOCK_FLEXION', 'THUMB_LOCK'],

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
