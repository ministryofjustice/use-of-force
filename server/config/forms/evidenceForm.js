const { joi, validations } = require('./validations')
const { buildValidationSpec } = require('../../services/validation')

const {
  arrayOfObjects,
  requiredStringMsg,
  requiredBooleanMsg,
  requiredOneOfMsg,
  optionalForPartialValidation,
  minZeroForPartialValidation,
} = validations

const completeSchema = joi.object({
  baggedEvidence: requiredBooleanMsg('Select yes if any evidence was bagged and tagged').alter(
    optionalForPartialValidation
  ),

  evidenceTagAndDescription: joi
    .when('baggedEvidence', {
      is: true,
      then: arrayOfObjects({
        evidenceTagReference: requiredStringMsg('Enter the evidence tag number').alter(optionalForPartialValidation),
        description: requiredStringMsg('Enter a description of the evidence').alter(optionalForPartialValidation),
      })
        .min(1)
        .message('Please input both the evidence tag number and the description')
        .unique('evidenceTagReference')
        .message("Evidence tag '{#value.evidenceTagReference}' has already been added - remove this evidence tag")
        .required()
        .alter(minZeroForPartialValidation),
      otherwise: joi.any().strip(),
    })
    .meta({ firstFieldName: 'baggedEvidence' }),

  photographsTaken: requiredBooleanMsg('Select yes if any photographs were taken').alter(optionalForPartialValidation),

  cctvRecording: requiredOneOfMsg('YES', 'NO', 'NOT_KNOWN')(
    'Select yes if any part of the incident captured on CCTV'
  ).alter(optionalForPartialValidation),

  bodyWornCamera: requiredOneOfMsg('YES', 'NO', 'NOT_KNOWN')(
    'Select yes if any part of the incident was captured on a body-worn camera'
  ).alter(optionalForPartialValidation),
  bodyWornCameraNumbers: joi
    .when('bodyWornCamera', {
      is: 'YES',
      then: arrayOfObjects({
        cameraNum: requiredStringMsg('Enter the body-worn camera number').alter(optionalForPartialValidation),
      })
        .min(1)
        .message('Enter the body-worn camera number')
        .ruleset.unique('cameraNum')
        .message("Camera '{#value.cameraNum}' has already been added - remove this camera")
        .required()
        .alter(minZeroForPartialValidation),
      otherwise: joi.any().strip(),
    })
    .meta({ firstFieldName: 'bodyWornCameraNumbers[0]' }),
})

module.exports = {
  complete: buildValidationSpec(completeSchema),
  partial: buildValidationSpec(completeSchema.tailor('partial')),
}
