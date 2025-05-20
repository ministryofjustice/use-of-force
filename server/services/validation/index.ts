import { isValid, validate } from './fieldValidation'
import processInput from './formProcessing'
import sanitiser from './sanitiser'
import buildFieldTypeSplitter from './fieldTypeSplitter'
import { buildErrorDetailAdapter } from './errorDetailAdapter'
import { EXTRACTED } from '../../config/fieldType'

const buildValidationSpec = schema => {
  const description = schema.describe()

  return {
    sanitiser: sanitiser.buildSanitiser(description),
    errorDetailAdapter: buildErrorDetailAdapter(description),
    fieldTypeSplitter: buildFieldTypeSplitter(description, EXTRACTED),
    schema,
  }
}

export default {
  buildValidationSpec,
  isValid,
  validate,
  processInput,
}
