import R from 'ramda'
import { QUESTION_SET } from '../../config/edit/useOfForceDetailsConfig'

export default (report, valuesFromRequestBody) => {
  return {
    positiveCommunication: {
      question: QUESTION_SET.POSITIVE_COMMUNICATION,
      oldValue: report.form.useOfForceDetails.positiveCommunication,
      newValue: valuesFromRequestBody.positiveCommunication,
      hasChanged: !R.equals(
        report.form.useOfForceDetails.positiveCommunication,
        valuesFromRequestBody.positiveCommunication
      ),
    },
    bodyWornCamera: {
      question: QUESTION_SET.BODY_WORN_CAMERA,
      oldValue: report.form.useOfForceDetails.bodyWornCamera,
      newValue: valuesFromRequestBody.bodyWornCamera,
      hasChanged: !R.equals(report.form.useOfForceDetails.bodyWornCamera, valuesFromRequestBody.bodyWornCamera),
    },
    bodyWornCameraNumbers: {
      question: QUESTION_SET.BODY_WORN_CAMERA_NUMBERS,
      oldValue: report.form.useOfForceDetails.bodyWornCameraNumbers,
      newValue: valuesFromRequestBody.bodyWornCameraNumbers,
      hasChanged: !compareBodyWornCameraNumbersOrWeaponTypes(
        'cameraNum',
        report.form.useOfForceDetails.bodyWornCameraNumbers,
        valuesFromRequestBody.bodyWornCameraNumbers
      ),
    },
    personalProtectionTechniques: {
      question: QUESTION_SET.PERSONAL_PROTECTION_TECHNIQUES,
      oldValue: report.form.useOfForceDetails.personalProtectionTechniques,
      newValue: valuesFromRequestBody.personalProtectionTechniques,
      hasChanged: !R.equals(
        report.form.useOfForceDetails.personalProtectionTechniques,
        valuesFromRequestBody.personalProtectionTechniques
      ),
    },
    batonDrawnAgainstPrisoner: {
      question: QUESTION_SET.BATON_DRAWN_AGAINST_PRISONER,
      oldValue: report.form.useOfForceDetails.batonDrawnAgainstPrisoner,
      newValue: valuesFromRequestBody.batonDrawnAgainstPrisoner,
      hasChanged: !R.equals(
        report.form.useOfForceDetails.batonDrawnAgainstPrisoner,
        valuesFromRequestBody.batonDrawnAgainstPrisoner
      ),
    },
    batonUsed: {
      question: QUESTION_SET.BATON_USED,
      oldValue: report.form.useOfForceDetails.batonUsed,
      newValue: valuesFromRequestBody.batonUsed,
      hasChanged: !R.equals(report.form.useOfForceDetails.batonUsed, valuesFromRequestBody.batonUsed),
    },
    pavaDrawnAgainstPrisoner: {
      question: QUESTION_SET.PAVA_DRAWN_AGAINST_PRISONER,
      oldValue: report.form.useOfForceDetails.pavaDrawnAgainstPrisoner,
      newValue: valuesFromRequestBody.pavaDrawnAgainstPrisoner,
      hasChanged: !R.equals(
        report.form.useOfForceDetails.pavaDrawnAgainstPrisoner,
        valuesFromRequestBody.pavaDrawnAgainstPrisoner
      ),
    },
    pavaUsed: {
      question: QUESTION_SET.PAVA_USED,
      oldValue: report.form.useOfForceDetails.pavaUsed,
      newValue: valuesFromRequestBody.pavaUsed,
      hasChanged: !R.equals(report.form.useOfForceDetails.pavaUsed, valuesFromRequestBody.pavaUsed),
    },
    taserDrawn: {
      question: QUESTION_SET.TASER_DRAWN,
      oldValue: report.form.useOfForceDetails.taserDrawn,
      newValue: valuesFromRequestBody.taserDrawn,
      hasChanged: !R.equals(report.form.useOfForceDetails.taserDrawn, valuesFromRequestBody.taserDrawn),
    },
    taserOperativePresent: {
      question: QUESTION_SET.TASER_OPERATIVE_PRESENT,
      oldValue: report.form.useOfForceDetails.taserOperativePresent,
      newValue: valuesFromRequestBody.taserOperativePresent,
      hasChanged: !R.equals(
        report.form.useOfForceDetails.taserOperativePresent,
        valuesFromRequestBody.taserOperativePresent
      ),
    },
    redDotWarning: {
      question: QUESTION_SET.RED_DOT_WARNING,
      oldValue: report.form.useOfForceDetails.redDotWarning,
      newValue: valuesFromRequestBody.redDotWarning,
      hasChanged: !R.equals(report.form.useOfForceDetails.redDotWarning, valuesFromRequestBody.redDotWarning),
    },
    arcWarningUsed: {
      question: QUESTION_SET.ARC_WARNING_USED,
      oldValue: report.form.useOfForceDetails.arcWarningUsed,
      newValue: valuesFromRequestBody.arcWarningUsed,
      hasChanged: !R.equals(report.form.useOfForceDetails.arcWarningUsed, valuesFromRequestBody.arcWarningUsed),
    },
    taserDeployed: {
      question: QUESTION_SET.TASER_DEPLOYED,
      oldValue: report.form.useOfForceDetails.taserDeployed,
      newValue: valuesFromRequestBody.taserDeployed,
      hasChanged: !R.equals(report.form.useOfForceDetails.taserDeployed, valuesFromRequestBody.taserDeployed),
    },
    taserCycleExtended: {
      question: QUESTION_SET.TASER_CYCLE_EXTENDED,
      oldValue: report.form.useOfForceDetails.taserCycleExtended,
      newValue: valuesFromRequestBody.taserCycleExtended,
      hasChanged: !R.equals(report.form.useOfForceDetails.taserCycleExtended, valuesFromRequestBody.taserCycleExtended),
    },
    taserReenergised: {
      question: QUESTION_SET.TASER_REENERGISED,
      oldValue: report.form.useOfForceDetails.taserReenergised,
      newValue: valuesFromRequestBody.taserReenergised,
      hasChanged: !R.equals(report.form.useOfForceDetails.taserReenergised, valuesFromRequestBody.taserReenergised),
    },
    bittenByPrisonDog: {
      question: QUESTION_SET.BITTEN_BY_PRISON_DOG,
      oldValue: report.form.useOfForceDetails.bittenByPrisonDog,
      newValue: valuesFromRequestBody.bittenByPrisonDog,
      hasChanged: !R.equals(report.form.useOfForceDetails.bittenByPrisonDog, valuesFromRequestBody.bittenByPrisonDog),
    },
    weaponsObserved: {
      question: QUESTION_SET.WEAPONS_OBSERVED,
      oldValue: report.form.useOfForceDetails.weaponsObserved,
      newValue: valuesFromRequestBody.weaponsObserved,
      hasChanged: !R.equals(report.form.useOfForceDetails.weaponsObserved, valuesFromRequestBody.weaponsObserved),
    },
    weaponTypes: {
      question: QUESTION_SET.WEAPON_TYPES,
      oldValue: report.form.useOfForceDetails.weaponTypes,
      newValue: valuesFromRequestBody.weaponTypes,
      hasChanged: !compareBodyWornCameraNumbersOrWeaponTypes(
        'weaponType',
        report.form.useOfForceDetails.weaponTypes,
        valuesFromRequestBody.weaponTypes
      ),
    },
    guidingHold: {
      question: QUESTION_SET.GUIDING_HOLD,
      oldValue: report.form.useOfForceDetails.guidingHold,
      newValue: valuesFromRequestBody.guidingHold,
      hasChanged: !R.equals(report.form.useOfForceDetails.guidingHold, valuesFromRequestBody.guidingHold),
    },
    escortingHold: {
      question: QUESTION_SET.ESCORTING_HOLD,
      oldValue: report.form.useOfForceDetails.escortingHold,
      newValue: valuesFromRequestBody.escortingHold,
      hasChanged: !R.equals(report.form.useOfForceDetails.escortingHold, valuesFromRequestBody.escortingHold),
    },
    restraintPositions: {
      question: QUESTION_SET.RESTRAINT_POSITIONS,
      oldValue: report.form.useOfForceDetails.restraintPositions,
      newValue: valuesFromRequestBody.restraintPositions,
      hasChanged: !R.equals(report.form.useOfForceDetails.restraintPositions, valuesFromRequestBody.restraintPositions),
    },
    painInducingTechniquesUsed: {
      question: QUESTION_SET.PAIN_INDUCING_TECHNIQUES_USED,
      oldValue: report.form.useOfForceDetails.painInducingTechniquesUsed,
      newValue: valuesFromRequestBody.painInducingTechniquesUsed,
      hasChanged: !R.equals(
        report.form.useOfForceDetails.painInducingTechniquesUsed,
        valuesFromRequestBody.painInducingTechniquesUsed
      ),
    },
    handcuffsApplied: {
      question: QUESTION_SET.HANDCUFFS_APPLIED,
      oldValue: report.form.useOfForceDetails.handcuffsApplied,
      newValue: valuesFromRequestBody.handcuffsApplied,
      hasChanged: !R.equals(report.form.useOfForceDetails.handcuffsApplied, valuesFromRequestBody.handcuffsApplied),
    },
  }
}

const compareBodyWornCameraNumbersOrWeaponTypes = (
  entityKey: string,
  arr1?: Record<string, string>[],
  arr2?: Record<string, string>[]
) => {
  const normalize = R.map((obj: Record<string, string>[]) => ({
    entityKey: R.toLower(obj[entityKey]),
  }))

  const sortFn = R.sortBy(R.prop(entityKey))

  const safeArr1 = Array.isArray(arr1) ? arr1 : []
  const safeArr2 = Array.isArray(arr2) ? arr2 : []

  return R.equals(sortFn(normalize(safeArr1)), sortFn(normalize(safeArr2)))
}
