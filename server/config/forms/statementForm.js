const { joi, validations } = require('./validations')

const { requiredStringMsg } = validations
const { EXTRACTED } = require('../fieldType')

const toSmallInt = val => {
  const number = parseInt(val, 10)
  return number > 32767 || number < -32768 || Number.isNaN(number) ? null : number
}

module.exports = {
  fields: [
    {
      lastTrainingMonth: {
        fieldType: EXTRACTED,
      },
    },
    {
      lastTrainingYear: {
        fieldType: EXTRACTED,
      },
    },
    {
      jobStartYear: {
        fieldType: EXTRACTED,
      },
    },
    {
      statement: {
        fieldType: EXTRACTED,
      },
    },
  ],
  schemas: {
    complete: joi.object({
      lastTrainingMonth: validations
        .requiredMonthIndexNotInFuture('lastTrainingYear', 'Select the month you last attended refresher training')
        .meta({ sanitiser: toSmallInt }),
      lastTrainingYear: validations
        .requiredYearNotInFutureMsg(
          'Enter the year you last attended refresher training',
          'Enter the year you last attended refresher training which is not in the future'
        )
        .meta({ sanitiser: toSmallInt }),
      jobStartYear: validations
        .requiredYearNotInFutureMsg(
          'Enter the year you joined the prison service',
          'Enter the year you joined the prison service which is not in the future'
        )
        .meta({ sanitiser: toSmallInt }),
      statement: requiredStringMsg('Enter your statement'),
    }),
  },
}
