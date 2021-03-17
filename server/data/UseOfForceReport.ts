export type IncidentDetails = {
  plannedUseOfForce: boolean
  authorisedBy: string
  witnesses: { name: string }[]
}

export type UseOfForceDetails = {
  positiveCommunication: boolean
  personalProtectionTechniques: string
  batonDrawn: boolean
  batonUsed: boolean
  pavaDrawn: boolean
  pavaUsed: boolean
  guidingHold: boolean
  guidingHoldOfficersInvolved: number
  restraint: boolean
  restraintPositions: string[]
  handcuffsApplied: boolean
  painInducingTechniques: boolean
  painInducingTechniquesUsed: string[]
}

export type ReasonsForUseOfForce = {
  reasons: string[]
  primaryReason: string
}

export type RelocationAndInjuries = {
  prisonerRelocation: string
  relocationCompliancy: boolean
  relocationType: string
  healthcareInvolved: boolean
  healthcarePractionerName: string
  prisonerInjuries: boolean
  f213CompletedBy: string
  prisonerHospitalisation: boolean
  staffMedicalAttention: boolean
  staffNeedingMedicalAttention: { name: string }[]
}

export type Evidence = {
  evidenceTagAndDescription: { description: string; evidenceTagReference: string }[]
  baggedEvidence: boolean
  photographsTaken: boolean
  cctvRecording: string
  bodyWornCamera: boolean
  bodyWornCameraNumbers: string[]
}

export type UseOfForceReport = {
  incidentDetails: IncidentDetails
  reasonsForUseOfForce: ReasonsForUseOfForce
  useOfForceDetails: UseOfForceDetails
  relocationAndInjuries: RelocationAndInjuries
  evidence: Evidence
}

type PartialValues<T> = { [P in keyof T]?: Partial<T[P]> }

export type UseOfForceDraftReport = PartialValues<UseOfForceReport>
