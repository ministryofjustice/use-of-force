import R from 'ramda'

import { QUESTION_SET } from '../../config/edit/incidentDetailsConfig'
import { hasValueChanged, excludeEmptyValuesThenTrim } from '../../utils/utils'

export default (report, valuesFromRequestBody) => {
  const witnessesOldValue = excludeEmptyValuesThenTrim(report.form.incidentDetails?.witnesses) || undefined
  const witnessesNewValue =
    excludeEmptyValuesThenTrim(valuesFromRequestBody.witnesses?.filter(witness => witness.name !== '')) || undefined

  return {
    incidentDate: {
      question: QUESTION_SET.INCIDENT_DATE,
      oldValue: report.incidentDate,
      newValue: valuesFromRequestBody.incidentDate,
      hasChanged: !R.equals(report.incidentDate, valuesFromRequestBody.incidentDate),
    },
    agencyId: {
      question: QUESTION_SET.PRISON,
      oldValue: report.agencyId,
      newValue: valuesFromRequestBody.newAgencyId,
      hasChanged: !R.equals(report.agencyId, valuesFromRequestBody.newAgencyId || report.agencyId),
    },
    incidentLocation: {
      question: QUESTION_SET.INCIDENT_LOCATION,
      oldValue: report.form.incidentDetails.incidentLocationId,
      newValue: valuesFromRequestBody.incidentLocationId,
      hasChanged: !R.equals(report.form.incidentDetails.incidentLocationId, valuesFromRequestBody.incidentLocationId),
    },
    plannedUseOfForce: {
      question: QUESTION_SET.PLANNED_UOF,
      oldValue: report.form.incidentDetails.plannedUseOfForce,
      newValue: valuesFromRequestBody.plannedUseOfForce,
      hasChanged: !R.equals(report.form.incidentDetails.plannedUseOfForce, valuesFromRequestBody.plannedUseOfForce),
    },
    authorisedBy: {
      question: QUESTION_SET.AUTHORISED_BY,
      oldValue: report.form.incidentDetails.authorisedBy,
      newValue: valuesFromRequestBody.authorisedBy,
      hasChanged: hasValueChanged(report.form.incidentDetails.authorisedBy, valuesFromRequestBody.authorisedBy),
    },
    witnesses: {
      question: QUESTION_SET.WITNESSES,
      oldValue: witnessesOldValue,
      newValue: witnessesNewValue,
      hasChanged: !R.equals(witnessesOldValue, witnessesNewValue),
    },
  }
}
