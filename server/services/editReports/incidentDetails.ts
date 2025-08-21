import R from 'ramda'

import { hasValueChanged, excludeEmptyValuesThenTrim } from '../../utils/utils'

export const compareIncidentDetailsEditWithReport = (report, valuesFromRequestBody) => {
  const witnessesOldValue = excludeEmptyValuesThenTrim(report.form.incidentDetails.witnesses) || undefined
  const witnessesNewValue =
    excludeEmptyValuesThenTrim(valuesFromRequestBody.witnesses?.filter(witness => witness.name !== '')) || undefined

  return {
    incidentDate: {
      oldValue: report.incidentDate,
      newValue: valuesFromRequestBody.incidentDate,
      hasChanged: !R.equals(report.incidentDate, valuesFromRequestBody.incidentDate),
    },
    agencyId: {
      oldValue: report.agencyId,
      newValue: valuesFromRequestBody.newAgencyId,
      hasChanged: hasValueChanged(report.agencyId, valuesFromRequestBody.newAgencyId || report.agencyId),
    },
    incidentLocation: {
      oldValue: report.form.incidentDetails.incidentLocationId,
      newValue: valuesFromRequestBody.incidentLocationId,
      hasChanged: hasValueChanged(
        report.form.incidentDetails.incidentLocationId,
        valuesFromRequestBody.incidentLocationId
      ),
    },
    plannedUseOfForce: {
      oldValue: report.form.incidentDetails.plannedUseOfForce,
      newValue: valuesFromRequestBody.plannedUseOfForce,
      hasChanged: !R.equals(report.form.incidentDetails.plannedUseOfForce, valuesFromRequestBody.plannedUseOfForce),
    },
    authorisedBy: {
      oldValue: report.form.incidentDetails.authorisedBy,
      newValue: valuesFromRequestBody.authorisedBy,
      hasChanged: hasValueChanged(report.form.incidentDetails.authorisedBy, valuesFromRequestBody.authorisedBy),
    },
    witnesses: {
      oldValue: witnessesOldValue,
      newValue: witnessesNewValue,
      hasChanged: !R.equals(witnessesOldValue, witnessesNewValue),
    },
  }
}

export const compareReportDetailsEditWithReport = () => {
  return 0
}
