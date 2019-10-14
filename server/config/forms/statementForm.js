const { joi, validations } = require('./validations')

const { requiredStringMsg } = validations
const { EXTRACTED } = require('../fieldType')
const { trimmedString } = require('./sanitisers')

const toSmallInt = val => {
  const number = parseInt(val, 10)
  return number > 32767 || number < -32768 || Number.isNaN(number) ? null : number
}

module.exports = {
  fields: [
    {
      lastTrainingMonth: {
        sanitiser: toSmallInt,
        validationMessage: 'Select the month you last attended refresher training',
        fieldType: EXTRACTED,
      },
    },
    {
      lastTrainingYear: {
        sanitiser: toSmallInt,
        fieldType: EXTRACTED,
        validationMessage: {
          'number.base': 'Enter the year you last attended refresher training',
          'number.min': 'Enter the year you last attended refresher training which is not in the future',
          'number.max': 'Enter the year you last attended refresher training which is not in the future',
        },
      },
    },
    {
      jobStartYear: {
        sanitiser: toSmallInt,
        fieldType: EXTRACTED,
        validationMessage: {
          'number.base': 'Enter the year you joined the prison service',
          'number.min': 'Enter the year you joined the prison service which is not in the future',
          'number.max': 'Enter the year you joined the prison service which is not in the future',
        },
      },
    },
    {
      statement: {
        sanitiser: trimmedString,
        fieldType: EXTRACTED,
      },
    },
  ],
  schemas: {
    complete: joi.object({
      lastTrainingMonth: validations.requiredMonthIndexNotInFuture('lastTrainingYear'),
      lastTrainingYear: validations.requiredYearNotInFuture,
      jobStartYear: validations.requiredYearNotInFuture,
      statement: requiredStringMsg('Enter your statement'),
    }),
  },
}
