import {
  BodyWornCameras,
  Cctv,
  RelocationLocation,
  ControlAndRestraintPosition,
  PainInducingTechniquesUsed,
  RelocationType,
  toLabel,
  UofReasons,
  findEnum,
  WeaponsObserved,
} from '../config/types'
import { Prison } from '../data/prisonClientTypes'
import {
  IncidentDetails,
  UseOfForceDetails,
  ReasonsForUseOfForce,
  RelocationAndInjuries,
  Evidence,
  UseOfForceDraftReport,
} from '../data/UseOfForceReport'
import { properCaseFullName } from '../utils/utils'

const YES = 'Yes'
const NO = 'No'

const createIncidentDetails = (
  offenderDetail,
  prison: Prison,
  description,
  incidentDetails: Partial<IncidentDetails> = {},
  involvedStaff,
  incidentDate: Date
) => {
  return {
    offenderName: offenderDetail.displayName,
    offenderNumber: offenderDetail.offenderNo,
    prison,
    incidentLocationId: incidentDetails.incidentLocationId,
    location: description,
    plannedUseOfForce: incidentDetails.plannedUseOfForce,
    authorisedBy: incidentDetails.authorisedBy,
    staffInvolved: involvedStaff,
    witnesses: incidentDetails.witnesses
      ? incidentDetails.witnesses.map(staff => [properCaseFullName(staff.name)])
      : 'None',
    incidentDate,
  }
}

const createUseOfForceDetails = (
  details: Partial<UseOfForceDetails> = {},
  reasonsForUseOfForce: Partial<ReasonsForUseOfForce> = {},
  evidence: Partial<Evidence> = {}
) => {
  const bodyWornCamera = details.bodyWornCamera ? details.bodyWornCamera : evidence.bodyWornCamera
  const bodyWornCameraNumbers = details.bodyWornCameraNumbers
    ? details.bodyWornCameraNumbers
    : evidence.bodyWornCameraNumbers

  return {
    reasonsForUseOfForce: whenPresent(reasonsForUseOfForce.reasons, reasons =>
      reasons.map(value => toLabel(UofReasons, value)).join(', ')
    ),
    primaryReason: whenPresent(reasonsForUseOfForce.primaryReason, value => toLabel(UofReasons, value)),
    positiveCommunicationUsed: details.positiveCommunication,
    personalProtectionTechniques: details.personalProtectionTechniques,
    batonDrawn: whenPresent(details.batonDrawn, value => (value ? wasWeaponUsed(details.batonUsed) : NO)),
    batonDrawnAgainstPrisoner: whenPresent(details.batonDrawnAgainstPrisoner, value =>
      value ? wasWeaponUsed(details.batonUsed) : NO
    ),
    pavaDrawn: whenPresent(details.pavaDrawn, value => (value ? wasWeaponUsed(details.pavaUsed) : NO)),
    pavaDrawnAgainstPrisoner: whenPresent(details.pavaDrawnAgainstPrisoner, value =>
      value ? wasWeaponUsed(details.pavaUsed) : NO
    ),
    guidingHoldUsed: whenPresent(details.guidingHold, value =>
      value ? howManyOfficersInvolved(details.guidingHoldOfficersInvolved) : NO
    ),
    escortingHoldUsed: details.escortingHold,
    controlAndRestraintUsed:
      details.restraint === undefined || details.restraint
        ? getRestraintPositions(details.restraintPositions)
        : getRestraintPositions(ControlAndRestraintPosition.NONE.value),

    painInducingTechniques: getPainInducingTechniques(details),
    handcuffsApplied: details.handcuffsApplied,
    bodyCameras: whenPresent(bodyWornCamera, value =>
      value === BodyWornCameras.YES.value
        ? `${YES} - ${extractCommaSeparatedList('cameraNum', bodyWornCameraNumbers)}` || YES
        : toLabel(BodyWornCameras, value)
    ),

    weaponsObserved: whenPresent(details.weaponsObserved, value =>
      value === WeaponsObserved.YES.value
        ? `${YES} - ${extractCommaSeparatedList('weaponType', details.weaponTypes)}` || YES
        : toLabel(WeaponsObserved, value)
    ),
    bittenByPrisonDog: details.bittenByPrisonDog,
    taserDrawn: whenPresent(details.taserDrawn, value =>
      value === true ? `${YES} - ${getTaserDetails(details)}` : `${NO}`
    ),
  }
}
const getTaserDetails = details => {
  const messageOptionsForEachInput = [
    ['taserOperativePresent', 'prisoner warned', 'prisoner not warned'],
    ['redDotWarning', 'red-dot warning used', 'red-dot warning not used'],
    ['arcWarningUsed', 'arc warning used', 'arc warning not used'],
    ['taserDeployed', 'Taser deployed', 'Taser not deployed'],
    ['taserCycleExtended', 'Taser cycle extended', 'Taser cycle not extended'],
    ['taserReenergised', 'Taser re-energised', 'Taser not re-energised'],
  ]

  return messageOptionsForEachInput
    .map(([key, selectedMsg, notSelectedMsg]) => (details[key] ? ` ${selectedMsg}` : ` ${notSelectedMsg}`))
    .join(',')
    .trimEnd()
}

const getRelocationType = relocationType => {
  return relocationType ? ` - ${toLabel(RelocationType, relocationType)}` : ''
}

const getNonCompliancyType = relocationAndInjuries => {
  return relocationAndInjuries.relocationType === 'OTHER'
    ? `${NO} - ${relocationAndInjuries.userSpecifiedRelocationType}`
    : `${NO}${getRelocationType(relocationAndInjuries.relocationType)}`
}

const createRelocation = (relocationAndInjuries: Partial<RelocationAndInjuries> = {}) => {
  return {
    prisonerRelocation: toLabel(RelocationLocation, relocationAndInjuries.prisonerRelocation),

    relocationCompliancy:
      relocationAndInjuries.relocationCompliancy === true ? YES : getNonCompliancyType(relocationAndInjuries),

    healthcareStaffPresent: whenPresent(relocationAndInjuries.healthcareInvolved, value =>
      value ? relocationAndInjuries.healthcarePractionerName || YES : NO
    ),
    prisonerInjuries: relocationAndInjuries.prisonerInjuries,
    f213CompletedBy: relocationAndInjuries.f213CompletedBy,
    prisonerHospitalisation: relocationAndInjuries.prisonerHospitalisation,
    staffMedicalAttention: whenPresent(relocationAndInjuries.staffMedicalAttention, value =>
      value ? relocationAndInjuries.staffNeedingMedicalAttention.map(staff => [properCaseFullName(staff.name)]) : 'None'
    ),
    staffHospitalisation: whenPresent(relocationAndInjuries.staffMedicalAttention, value =>
      value ? staffTakenToHospital(relocationAndInjuries.staffNeedingMedicalAttention) : 'None'
    ),
  }
}

const createEvidence = (evidence: Partial<Evidence> = {}) => {
  return {
    evidenceBaggedTagged: baggedAndTaggedEvidence(evidence.evidenceTagAndDescription, evidence.baggedEvidence),
    photographs: evidence.photographsTaken,
    cctv: toLabel(Cctv, evidence.cctvRecording),
  }
}

const whenPresent = (value, present) => (value == null ? undefined : present(value))

const wasWeaponUsed = weaponUsed => {
  if (weaponUsed == null) {
    return undefined
  }
  return weaponUsed ? `${YES} and used` : `${YES} and not used`
}

const getRestraintPositions = positions => {
  if (positions == null) {
    return Array.of[ControlAndRestraintPosition.NONE.label]
  }
  return toParentChild(toArray(positions))
}

const toParentChild = postions => {
  const positionObjects = postions.map(p => findEnum(ControlAndRestraintPosition, p))
  // eslint-disable-next-line
  const parents: any[] = []
  // eslint-disable-next-line
  const children: any[] = []
  positionObjects.forEach(obj => {
    if (obj.parent == null) {
      parents.push(obj)
    } else {
      children.push(obj)
    }
  })
  const parentChild: string[] = []
  parents.forEach(p => {
    const thesechildren = children
      .filter(pos => pos.parent === p.value)
      .map(child => child.label)
      .join(', ')
    if (thesechildren === '') {
      parentChild.push(p.label)
    } else {
      parentChild.push(`${p.label}: ${thesechildren}`)
    }
  })
  return parentChild
}

const toArray = obj => {
  return Array.isArray(obj) ? obj : Array.of(obj)
}

const getPainInducingTechniques = (details: Partial<UseOfForceDetails>) => {
  if (details.painInducingTechniques === undefined && !details.painInducingTechniquesUsed) {
    return undefined
  }

  if (details.painInducingTechniques && !details.painInducingTechniquesUsed) {
    return YES
  }

  if (details.painInducingTechniquesUsed) {
    return `${toArray(details.painInducingTechniquesUsed)
      .map(technique => toLabel(PainInducingTechniquesUsed, technique))
      .join(', ')}`
  }

  return PainInducingTechniquesUsed.NONE.label
}

const staffTakenToHospital = (staffMembers = []) => {
  const hospitalisedStaff = staffMembers.filter(staff => staff.hospitalisation === true)
  if (hospitalisedStaff.length === 0) {
    return 'None'
  }
  return hospitalisedStaff.map(staff => [properCaseFullName(staff.name)])
}

const baggedAndTaggedEvidence = (tagsAndEvidence = [], evidenceYesNo = false) => {
  if (evidenceYesNo === false) {
    return false
  }
  return tagsAndEvidence.map(item => {
    return [item.evidenceTagReference, item.description]
  })
}

const howManyOfficersInvolved = guidingHoldOfficersInvolved => {
  return guidingHoldOfficersInvolved === 1 ? `${YES} - 1 officer involved` : `${YES} - 2 officers involved`
}

const extractCommaSeparatedList = (attr, dataArray = []) => {
  return dataArray.map(element => element[attr]).join(', ')
}

export = (
  form: UseOfForceDraftReport,
  offenderDetail,
  prison: Prison,
  locationDescription: string,
  involvedStaff,
  incidentDate: Date
) => {
  const { incidentDetails, reasonsForUseOfForce, useOfForceDetails, relocationAndInjuries, evidence } = form
  return {
    incidentDetails: createIncidentDetails(
      offenderDetail,
      prison,
      locationDescription,
      incidentDetails,
      involvedStaff,
      incidentDate
    ),
    offenderDetail,
    useOfForceDetails: createUseOfForceDetails(useOfForceDetails, reasonsForUseOfForce, evidence),
    relocationAndInjuries: createRelocation(relocationAndInjuries),
    evidence: createEvidence(evidence),
  }
}
