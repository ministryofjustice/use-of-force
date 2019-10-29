const { joi, validations, namePattern, caseInsensitiveComparator } = require('./validations')
const { buildValidationSpec } = require('../../services/validation')

const {
  requiredStringMsg,
  requiredBooleanMsg,
  arrayOfObjects,
  optionalForPartialValidation,
  minZeroForPartialValidation,
} = validations

const f213CompletedBy = requiredStringMsg('Enter the name of who completed the F213 form')
  .pattern(namePattern)
  .message('Names may only contain letters, spaces, hyphens or apostrophes')
  .alter(optionalForPartialValidation)

const completeSchema = joi.object({
  prisonerRelocation: requiredStringMsg('Select where the prisoner was relocated to').alter(
    optionalForPartialValidation
  ),

  relocationCompliancy: requiredBooleanMsg('Select yes if the prisoner was compliant').alter(
    optionalForPartialValidation
  ),

  f213CompletedBy,

  prisonerInjuries: requiredBooleanMsg('Select yes if the prisoner sustained any injuries').alter(
    optionalForPartialValidation
  ),

  healthcareInvolved: requiredBooleanMsg('Select yes if a member of healthcare was present during the incident').alter(
    optionalForPartialValidation
  ),

  healthcarePractionerName: joi.when('healthcareInvolved', {
    is: true,
    then: requiredStringMsg('Enter the name of the member of healthcare')
      .alter(optionalForPartialValidation)
      .pattern(namePattern)
      .message('Names may only contain letters, spaces, hyphens or apostrophes'),
    otherwise: joi.any().strip(),
  }),

  prisonerHospitalisation: requiredBooleanMsg('Select yes if the prisoner needed outside hospitalisation').alter(
    optionalForPartialValidation
  ),

  staffMedicalAttention: requiredBooleanMsg('Select yes if a staff member needed medical attention').alter(
    optionalForPartialValidation
  ),

  staffNeedingMedicalAttention: joi
    .when('staffMedicalAttention', {
      is: true,
      then: arrayOfObjects({
        name: requiredStringMsg('Enter the name of who needed medical attention')
          .pattern(namePattern)
          .message('Names may only contain letters, spaces, hyphens or apostrophes')
          .alter(optionalForPartialValidation),
        hospitalisation: requiredBooleanMsg('Select yes if the staff member had to go to hospital').alter(
          optionalForPartialValidation
        ),
      })
        .min(1)
        .message("Enter the staff member's name and whether they went to hospital")
        .unique(caseInsensitiveComparator('name'))
        .message("Name '{#value.name}' has already been added - remove this name")
        .required()
        .alter(minZeroForPartialValidation),
    })
    .meta({ firstFieldName: 'staffMedicalAttention' }),
})

module.exports = {
  f213CompletedBy,
  complete: buildValidationSpec(completeSchema),
  partial: buildValidationSpec(completeSchema.tailor('partial')),
}
