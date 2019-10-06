const { joi, validations } = require('./validations')
const { isValid } = require('../../utils/fieldValidation')
const { toBoolean, removeEmptyValues } = require('./sanitisers')

module.exports = {
  fields: [
    {
      baggedEvidence: {
        validationMessage: 'Select yes if any evidence was bagged and tagged',
        sanitiser: toBoolean,
      },
    },
    {
      evidenceTagAndDescription: {
        sanitiser: removeEmptyValues(['description', 'evidenceTagReference']),
        validationMessage: 'Please input both the evidence tag number and the description',
        dependentOn: 'baggedEvidence',
        firstFieldName: 'baggedEvidence',
        predicate: 'true',
      },
    },
    {
      photographsTaken: {
        validationMessage: 'Select yes if any photographs were taken',
        sanitiser: toBoolean,
      },
    },
    {
      cctvRecording: {
        validationMessage: 'Select yes if any part of the incident captured on CCTV',
      },
    },
    {
      bodyWornCamera: {
        validationMessage: 'Select yes if any part of the incident was captured on a body-worn camera',
      },
    },
    {
      bodyWornCameraNumbers: {
        sanitiser: removeEmptyValues(['cameraNum']),
        dependentOn: 'bodyWornCamera',
        predicate: 'YES',
        validationMessage: 'Enter the body-worn camera number',
        firstFieldName: 'bodyWornCameraNumbers[0][cameraNum]',
      },
    },
  ],
  schemas: {
    complete: joi.object({
      baggedEvidence: validations.requiredBoolean,
      evidenceTagAndDescription: validations.requiredTagAndDescription,
      photographsTaken: validations.requiredBoolean,
      cctvRecording: validations.requiredYesNoNotKnown,
      bodyWornCamera: validations.requiredYesNoNotKnown,
      bodyWornCameraNumbers: validations.requiredCameraNumber,
    }),
  },
  isComplete(values) {
    return isValid(this.schemas.complete, values)
  },
  nextPath: {
    path: bookingId => `/report/${bookingId}/check-your-answers`,
  },
}
