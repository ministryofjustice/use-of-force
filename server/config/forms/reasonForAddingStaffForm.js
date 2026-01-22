const { joi } = require('./validations')
const { buildValidationSpec } = require('../../services/validation')

const reasonForAddingStaffSchema = joi.object({
  reason: joi
    .string()
    .valid('forgottenInReport', 'bodycamFootageRevealedinvolved', 'anotherReasonForEdit')
    .required()
    .messages({
      'any.required': 'Provide a reason for adding this person',
      'any.only': 'Provide a reason for adding this person',
    }),
  reasonText: joi.when('reason', {
    is: 'anotherReasonForEdit',
    then: joi.string().trim().min(3).max(250).required().messages({
      'any.required': 'Specify the reason for adding this person',
      'string.empty': 'Specify the reason for adding this person',
      'string.min': 'Reason must be at least 3 characters',
      'string.max': 'Reason must be 250 characters or fewer',
    }),
    otherwise: joi.string().allow('').optional(),
  }),
  reasonAdditionalInfo: joi.string().max(500).required().messages({
    'any.required': 'Provide additional information to explain why you are adding this person',
    'string.empty': 'Provide additional information to explain why you are adding this person',
    'string.max': 'Additional information must be 500 characters or fewer',
  }),
})

module.exports = {
  complete: buildValidationSpec(reasonForAddingStaffSchema),
}
