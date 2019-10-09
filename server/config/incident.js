const incidentDetails = require('./forms/incidentDetailsForm')
const useOfForceDetailsForm = require('./forms/useOfForceDetailsForm')
const relocationAndInjuriesForm = require('./forms/relocationAndInjuriesForm')
const evidenceForm = require('./forms/evidenceForm')

module.exports = {
  incidentDetails: incidentDetails.formConfig,
  useOfForceDetails: useOfForceDetailsForm.formConfig,
  relocationAndInjuries: relocationAndInjuriesForm.formConfig,
  evidence: evidenceForm.formConfig,
}
