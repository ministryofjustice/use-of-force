const { joi, validations } = require('./validations')
const { isValid } = require('../../utils/fieldValidation')
const { buildValidationSpec } = require('../../utils/fieldValidation')
const { removeEmptyObjects } = require('./sanitisers')

const { arrayOfObjects, requiredStringMsg, requiredBooleanMsg, requiredOneOfMsg } = validations

const completeSchema = joi.object({
  baggedEvidence: requiredBooleanMsg('Select yes if any evidence was bagged and tagged'),

  evidenceTagAndDescription: joi
    .when(joi.ref('baggedEvidence'), {
      is: true,
      then: arrayOfObjects({
        evidenceTagReference: requiredStringMsg('Enter the evidence tag number'),
        description: requiredStringMsg('Enter a description of the evidence'),
      })
        .min(1)
        .message('Please input both the evidence tag number and the description')
        .unique('evidenceTagReference')
        .message("Evidence tag '{#value.evidenceTagReference}' has already been added - remove this evidence tag")
        .required()
        .meta({ sanitiser: removeEmptyObjects }),
      otherwise: joi.any().strip(),
    })
    .meta({ firstFieldName: 'baggedEvidence' }),

  photographsTaken: requiredBooleanMsg('Select yes if any photographs were taken'),

  cctvRecording: requiredOneOfMsg('YES', 'NO', 'NOT_KNOWN')('Select yes if any part of the incident captured on CCTV'),

  bodyWornCamera: requiredOneOfMsg('YES', 'NO', 'NOT_KNOWN')(
    'Select yes if any part of the incident was captured on a body-worn camera'
  ),
  bodyWornCameraNumbers: joi
    .when('bodyWornCamera', {
      is: 'YES',
      then: arrayOfObjects({
        cameraNum: requiredStringMsg('Enter the body-worn camera number'),
      })
        .min(1)
        .message('Enter the body-worn camera number')
        .ruleset.unique('cameraNum')
        .message("Camera '{#value.cameraNum}' has already been added - remove this camera")
        .required()
        .meta({ sanitiser: removeEmptyObjects }),
      otherwise: joi.any().strip(),
    })
    .meta({ firstFieldName: 'bodyWornCameraNumbers[0]' }),
})

module.exports = {
  complete: buildValidationSpec(completeSchema),
  partial: {},
  formConfig: {
    schemas: {
      complete: completeSchema,
    },
    isComplete(values) {
      return isValid(this.schemas.complete, values)
    },
    nextPath: {
      path: bookingId => `/report/${bookingId}/check-your-answers`,
    },
  },
}
