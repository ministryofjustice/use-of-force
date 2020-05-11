const { joi, validations } = require('./validations')
const { buildValidationSpec } = require('../../services/validation')

const { requiredStringMsg } = validations

const transientSchema = joi.object({
  agencyId: requiredStringMsg('What prison did the use of force take place in?'),
})

module.exports = {
  complete: buildValidationSpec(transientSchema),
}
