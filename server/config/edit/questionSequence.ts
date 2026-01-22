// This is the order in which changes will be displayed in the 'what changed, changed from, changed to' columns of
// /{incidentId}/view-incident?tab=edit-history page.
// Not setting this order will mean the output in the view will very random.

export default [
  // incidentDetails
  'incidentDate',
  'agencyId',
  'incidentLocation',
  'plannedUseOfForce',
  'authorisedBy',
  'witnesses',
  // relocation and injuries
  'prisonerRelocation',
  'relocationCompliancy',
  'relocationType',
  'userSpecifiedRelocationType',
  'f213CompletedBy',
  'prisonerInjuries',
  'healthcareInvolved',
  'healthcarePractionerName',
  'prisonerHospitalisation',
  'staffMedicalAttention',
  'staffNeedingMedicalAttention',
  // evidence
  'baggedEvidence',
  'evidenceTagAndDescription',
  'photographsTaken',
  'cctvRecording',
  // why use of force used
  'reasons',
  // primary reason
  'primaryReason',
  // use of force details
  'positiveCommunication',
  'bodyWornCamera',
  'bodyWornCameraNumbers',
  'personalProtectionTechniques',
  'batonDrawnAgainstPrisoner',
  'batonUsed',
  'pavaDrawnAgainstPrisoner',
  'pavaUsed',
  'taserDrawn',
  'taserOperativePresent',
  'redDotWarning',
  'arcWarningUsed',
  'taserDeployed',
  'taserCycleExtended',
  'taserReenergised',
  'bittenByPrisonDog',
  'weaponsObserved',
  'weaponTypes',
  'guidingHold',
  'guidingHoldOfficersInvolved',
  'escortingHold',
  'restraintPositions',
  'painInducingTechniquesUsed',
  'handcuffsApplied',
  // add involved staff
  'involvedStaff',
]
