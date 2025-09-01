import { QUESTION_SET } from './incidentDetailsConfig'

// this will hold the questions every page. Keys to match those in db
export default {
  incidentDetails: {
    agencyId: QUESTION_SET.PRISON,
    incidentLocation: QUESTION_SET.INCIDENT_LOCATION,
    witnesses: QUESTION_SET.WITNESSES,
    plannedUseOfForce: QUESTION_SET.PLANNED_UOF,
    authorisedBy: QUESTION_SET.AUTHORISED_BY,
    incidentDate: QUESTION_SET.INCIDENT_DATE,
  },
  // Add mappings for the other sections/pages of the report here. Keys to be in the order to display in reasons page
}
