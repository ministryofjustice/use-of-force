const { joi, validations, setErrorMessage } = require('./validations')
const { isValid } = require('../../utils/fieldValidation')
const { toBoolean, removeEmptyValues } = require('./sanitisers')

const { arrayOfObjects, requiredString, requiredBoolean, requiredOneOf } = validations

module.exports = {
  formConfig: {
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
        baggedEvidence: requiredBoolean,
        evidenceTagAndDescription: joi.when(joi.ref('baggedEvidence'), {
          is: true,
          then: arrayOfObjects({
            evidenceTagReference: requiredString.error(setErrorMessage('Enter the evidence tag number')),
            description: requiredString.error(setErrorMessage('Enter a description of the evidence')),
          })
            .min(1)
            .ruleset.unique('evidenceTagReference')
            .message("Evidence tag '{#value.evidenceTagReference}' has already been added - remove this evidence tag")
            .required(),
        }),

        photographsTaken: requiredBoolean,

        cctvRecording: requiredOneOf('YES', 'NO', 'NOT_KNOWN'),

        bodyWornCamera: requiredOneOf('YES', 'NO', 'NOT_KNOWN'),
        bodyWornCameraNumbers: joi.when('bodyWornCamera', {
          is: 'YES',
          then: arrayOfObjects({
            cameraNum: requiredString.error(setErrorMessage('Enter the body-worn camera number')),
          })
            .min(1)
            .ruleset.unique('cameraNum')
            .message("Camera '{#value.cameraNum}' has already been added - remove this camera")
            .required(),
        }),
      }),
    },
    isComplete(values) {
      return isValid(this.schemas.complete, values)
    },
    nextPath: {
      path: bookingId => `/report/${bookingId}/check-your-answers`,
    },
  },
}
