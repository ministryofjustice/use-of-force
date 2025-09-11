import R from 'ramda'

import { QUESTION_SET } from '../../config/edit/relocationAndInjuriesConfig'

export default (report, valuesFromRequestBody) => {
  return {
    prisonerRelocation: {
      question: QUESTION_SET.PRISONER_RELOCATION,
      oldValue: report.form.relocationAndInjuries.prisonerRelocation,
      newValue: valuesFromRequestBody.prisonerRelocation,
      hasChanged: !R.equals(
        report.form.relocationAndInjuries.prisonerRelocation,
        valuesFromRequestBody.prisonerRelocation
      ),
    },
    relocationCompliancy: {
      question: QUESTION_SET.RELOCATION_COMPLIANCY,
      oldValue: report.form.relocationAndInjuries.relocationCompliancy,
      newValue: valuesFromRequestBody.relocationCompliancy,
      hasChanged: !R.equals(
        report.form.relocationAndInjuries.relocationCompliancy,
        valuesFromRequestBody.relocationCompliancy
      ),
    },
    relocationType: {
      question: QUESTION_SET.RELOCATION_TYPE,
      oldValue: report.form.relocationAndInjuries.relocationType,
      newValue: valuesFromRequestBody.relocationType,
      hasChanged: !R.equals(report.form.relocationAndInjuries.relocationType, valuesFromRequestBody.relocationType),
    },
    userSpecifiedRelocationType: {
      question: QUESTION_SET.USER_SPECIFIED_RELOCATION_TYPE,
      oldValue: report.form.relocationAndInjuries.userSpecifiedRelocationType,
      newValue: valuesFromRequestBody.userSpecifiedRelocationType,
      hasChanged: !R.equals(
        report.form.relocationAndInjuries.userSpecifiedRelocationType,
        valuesFromRequestBody.userSpecifiedRelocationType
      ),
    },
    f213CompletedBy: {
      question: QUESTION_SET.F213_COMPLETED_BY,
      oldValue: report.form.relocationAndInjuries.f213CompletedBy,
      newValue: valuesFromRequestBody.f213CompletedBy,
      hasChanged: !R.equals(
        report.form.relocationAndInjuries.f213CompletedBy.toUpperCase().trim(),
        valuesFromRequestBody.f213CompletedBy.toUpperCase().trim()
      ),
    },
    prisonerInjuries: {
      question: QUESTION_SET.PRISONER_INJURIES,
      oldValue: report.form.relocationAndInjuries.prisonerInjuries,
      newValue: valuesFromRequestBody.prisonerInjuries,
      hasChanged: !R.equals(report.form.relocationAndInjuries.prisonerInjuries, valuesFromRequestBody.prisonerInjuries),
    },
    healthcareInvolved: {
      question: QUESTION_SET.HEALTHCARE_INVOLVED,
      oldValue: report.form.relocationAndInjuries.healthcareInvolved,
      newValue: valuesFromRequestBody.healthcareInvolved,
      hasChanged: !R.equals(
        report.form.relocationAndInjuries.healthcareInvolved,
        valuesFromRequestBody.healthcareInvolved
      ),
    },
    healthcarePractionerName: {
      question: QUESTION_SET.HEALTHCARE_PRACTIONER_NAME,
      oldValue: report.form.relocationAndInjuries.healthcarePractionerName,
      newValue: valuesFromRequestBody.healthcarePractionerName,
      hasChanged: !R.equals(
        report.form.relocationAndInjuries.healthcarePractionerName,
        valuesFromRequestBody.healthcarePractionerName
      ),
    },
    prisonerHospitalisation: {
      question: QUESTION_SET.PRISONER_HOSPITALISATION,
      oldValue: report.form.relocationAndInjuries.prisonerHospitalisation,
      newValue: valuesFromRequestBody.prisonerHospitalisation,
      hasChanged: !R.equals(
        report.form.relocationAndInjuries.prisonerHospitalisation,
        valuesFromRequestBody.prisonerHospitalisation
      ),
    },
    staffMedicalAttention: {
      question: QUESTION_SET.STAFF_MEDICAL_ATTENTION,
      oldValue: report.form.relocationAndInjuries.staffMedicalAttention,
      newValue: valuesFromRequestBody.staffMedicalAttention,
      hasChanged: !R.equals(
        report.form.relocationAndInjuries.staffMedicalAttention,
        valuesFromRequestBody.staffMedicalAttention
      ),
    },
    staffNeedingMedicalAttention: {
      question: QUESTION_SET.STAFF_NEEDING_MEDICAL_ATTENTION,
      oldValue: report.form.relocationAndInjuries.staffNeedingMedicalAttention,
      newValue: valuesFromRequestBody.staffNeedingMedicalAttention,
      hasChanged: compareStaffNeedingMedicalAttention(
        report.form.relocationAndInjuries.staffNeedingMedicalAttention || [],
        valuesFromRequestBody.staffNeedingMedicalAttention || []
      ),
    },
  }
}

const compareStaffNeedingMedicalAttention = (arr1, arr2) => {
  const normalize = R.map(obj => ({
    name: R.toLower(obj.name),
    hospitalisation: obj.hospitalisation,
  }))
  return !R.equals(normalize(arr1), normalize(arr2))
}
