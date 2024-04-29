export type IncidentDetails = {
  plannedUseOfForce: boolean
  locationId: number
  authorisedBy: string
  witnesses: { name: string }[]
}

export type UseOfForceDetails = {
  positiveCommunication: boolean
  bodyWornCamera?: string
  bodyWornCameraNumbers?: { cameraNum: string }[]
  personalProtectionTechniques: boolean
  batonDrawn?: boolean
  batonDrawnAgainstPrisoner?: boolean
  batonUsed: boolean
  pavaDrawn?: boolean
  pavaDrawnAgainstPrisoner?: boolean
  pavaUsed: boolean
  weaponsObserved: string
  weaponTypes: { weaponType: string }[]
  guidingHold: boolean
  guidingHoldOfficersInvolved: number
  escortingHold?: boolean
  restraint?: boolean
  restraintPositions: string | string[]
  handcuffsApplied: boolean
  painInducingTechniques?: boolean
  painInducingTechniquesUsed: string | string[]
}

export type ReasonsForUseOfForce = {
  reasons: string[]
  primaryReason: string
}

export type RelocationAndInjuries = {
  prisonerRelocation: string
  relocationCompliancy: boolean
  relocationType: string
  userSpecifiedRelocationType?: string
  healthcareInvolved: boolean
  healthcarePractionerName: string
  prisonerInjuries: boolean
  f213CompletedBy: string
  prisonerHospitalisation: boolean
  staffMedicalAttention: boolean
  staffNeedingMedicalAttention: { name: string; hospitalisation: boolean }[]
}

export type Evidence = {
  evidenceTagAndDescription: { description: string; evidenceTagReference: string }[]
  baggedEvidence: boolean
  photographsTaken: boolean
  cctvRecording: string
  bodyWornCamera?: string
  bodyWornCameraNumbers?: { cameraNum: string }[]
}

export type InvolvedStaff = {
  name: string
  email: string
  staffId: number
  username: string
  verified: boolean
}

export type UseOfForceReport = {
  incidentDetails: IncidentDetails
  involvedStaff: InvolvedStaff[]
  reasonsForUseOfForce: ReasonsForUseOfForce
  useOfForceDetails: UseOfForceDetails
  relocationAndInjuries: RelocationAndInjuries
  evidence: Evidence
}

type PartialValues<T> = { [P in keyof T]?: Partial<T[P]> }

export type UseOfForceDraftReport = PartialValues<UseOfForceReport>
