import validationsDefault from './validations'
import validation from '../../services/validation'

const { joi, validations } = validationsDefault

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

  cctvRecording: requiredOneOfMsg(
    'YES',
    'NO',
    'NOT_KNOWN'
  )('Select yes if any part of the incident captured on CCTV').alter(optionalForPartialValidation),
})

export default {
  complete: validation.buildValidationSpec(completeSchema),
  partial: validation.buildValidationSpec(completeSchema.tailor('partial')),
}
