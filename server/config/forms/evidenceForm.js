const { joi, validations } = require('./validations')

module.exports = joi.object({
  baggedEvidence: validations.requiredBoolean,
  evidenceTagAndDescription: validations.requiredTagAndDescription,
  photographsTaken: validations.requiredBoolean,
  cctvRecording: validations.requiredYesNoNotKnown,
  bodyWornCamera: validations.requiredYesNoNotKnown,
  bodyWornCameraNumbers: validations.requiredCameraNumber,
})
