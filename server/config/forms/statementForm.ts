import validationsDefault from './validations'
import { EXTRACTED } from '../fieldType'
import validation from '../../services/validation'
import sanitisers from './sanitisers'

const { toSmallInt } = sanitisers
const { requiredStringMsg } = validationsDefault.validations
const { joi, validations } = validationsDefault
const completeSchema = joi.object({
  lastTrainingMonth: validations
    .requiredMonthIndexNotInFuture('lastTrainingYear', 'Select the month you last attended refresher training')
    .meta({ sanitiser: toSmallInt, fieldType: EXTRACTED }),
  lastTrainingYear: validations
    .requiredYearNotInFutureMsg(
      'Enter the year you last attended refresher training',
      'Enter the year you last attended refresher training which is not in the future',
    )
    .meta({ sanitiser: toSmallInt, fieldType: EXTRACTED }),
  jobStartYear: validations
    .requiredYearNotInFutureMsg(
      'Enter the year you joined the prison service',
      'Enter the year you joined the prison service which is not in the future',
    )
    .meta({ sanitiser: toSmallInt, fieldType: EXTRACTED }),
  statement: requiredStringMsg('Enter your statement').meta({ fieldType: EXTRACTED }),
})

export default {
  complete: validation.buildValidationSpec(completeSchema),
}
