import validations from './validations'

const completeSchema = validations.joi.array()

// Only used to determine report status and completeness
// There is no way to input partial data so if array is present then we consider complete.
export default {
  complete: { schema: completeSchema },
}
