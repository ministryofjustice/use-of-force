const R = require('ramda')
const { joi, validations } = require('./validations')
const { isValid } = require('../../utils/fieldValidation')
const { toBoolean, removeEmptyValues, trimmedString } = require('./sanitisers')

const { arrayOfObjects, requiredStringMsg, requiredBooleanMsg, requiredOneOfMsg } = validations

module.exports = {
  formConfig: {
    fields: [
      {
        baggedEvidence: {
          sanitiser: toBoolean,
        },
      },
      {
        evidenceTagAndDescription: {
          sanitiser: removeEmptyValues(['description', 'evidenceTagReference']),
          firstFieldName: 'baggedEvidence',
        },
      },
      {
        photographsTaken: {
          sanitiser: toBoolean,
        },
      },
      {
        cctvRecording: {
          sanitiser: trimmedString,
        },
      },
      {
        bodyWornCamera: {
          sanitiser: trimmedString,
        },
      },
      {
        bodyWornCameraNumbers: {
          sanitiser: removeEmptyValues(['cameraNum']),
          firstFieldName: 'bodyWornCameraNumbers[0]',
        },
      },
    ],
    schemas: {
      complete: joi.object({
        baggedEvidence: requiredBooleanMsg('Select yes if any evidence was bagged and tagged'),

        evidenceTagAndDescription: joi.when(joi.ref('baggedEvidence'), {
          is: true,
          then: joi
            .array()
            .items({
              evidenceTagReference: requiredStringMsg('Enter the evidence tag number'),
              description: requiredStringMsg('Enter a description of the evidence'),
            })
            .min(1)
            .message('Please input both the evidence tag number and the description')
            .unique('evidenceTagReference')
            .message("Evidence tag '{#value.evidenceTagReference}' has already been added - remove this evidence tag")
            .required(),
          otherwise: joi.any().strip(),
        }),

        photographsTaken: requiredBooleanMsg('Select yes if any photographs were taken'),

        cctvRecording: requiredOneOfMsg('YES', 'NO', 'NOT_KNOWN')(
          'Select yes if any part of the incident captured on CCTV'
        ),

        bodyWornCamera: requiredOneOfMsg('YES', 'NO', 'NOT_KNOWN')(
          'Select yes if any part of the incident was captured on a body-worn camera'
        ),
        bodyWornCameraNumbers: joi.when('bodyWornCamera', {
          is: 'YES',
          then: arrayOfObjects({
            cameraNum: requiredStringMsg('Enter the body-worn camera number'),
          })
            .min(1)
            .message('Enter the body-worn camera number')
            .ruleset.unique('cameraNum')
            .message("Camera '{#value.cameraNum}' has already been added - remove this camera")
            .required(),
          otherwise: joi.any().strip(),
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
