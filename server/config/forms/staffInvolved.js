const { joi } = require('./validations')

const completeSchema = joi.array()

// Only used to determine report status and completeness
// There is no way to input partial data so if array is present then we consider complete.
module.exports = {
  complete: { schema: completeSchema },
}
