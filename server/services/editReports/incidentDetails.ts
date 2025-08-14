import R from 'ramda'

import { trimAllValuesInObjectArray, hasValueChanged, toJSDate } from '../../utils/utils'

export const compareIncidentDetailsEditWithReport = (report, valuesFromRequestBody) => {
  return {
    incidentDate: {
      oldValue: report.incidentDate,
      newValue: toJSDate(valuesFromRequestBody.incidentDate), // need to persist JS Date object in the same format as as in the create report journey
      hasChanged: report.incidentDate.toISOString() !== toJSDate(valuesFromRequestBody.incidentDate).toISOString(),
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
      hasChanged: hasValueChanged(
        report.form.incidentDetails.plannedUseOfForce.toString(),
        valuesFromRequestBody.plannedUseOfForce
      ),
    },
    authorisedBy: {
      oldValue: report.form.incidentDetails.authorisedBy,
      newValue: valuesFromRequestBody.authorisedBy,
      hasChanged: hasValueChanged(report.form.incidentDetails.authorisedBy, valuesFromRequestBody.authorisedBy),
    },
    witnesses: {
      oldValue: trimAllValuesInObjectArray(report.form.incidentDetails.witnesses) || [],
      newValue: trimAllValuesInObjectArray(valuesFromRequestBody.witnesses?.filter(witness => witness.name !== '')),
      hasChanged: !R.equals(
        trimAllValuesInObjectArray(handleZeroWitnessesInExistingReport(report.form.incidentDetails.witnesses)),
        trimAllValuesInObjectArray(valuesFromRequestBody.witnesses)
      ),
    },
  }
}

const handleZeroWitnessesInExistingReport = witnesses => (!witnesses ? [] : witnesses)

export const compareReportDetailsEditWithReport = () => {
  return 0
}
