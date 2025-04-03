const joi = require('@hapi/joi')
import validation from '../../services/validation'

const schema = joi.object({
  reasons: joi.array().items(joi.string()).min(1).required(),
  primaryReason: joi.string().when('reasons', { is: joi.array().min(2).required(), then: joi.required() }),
})

export default {
  complete: validation.buildValidationSpec(schema),
}
