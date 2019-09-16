const { EXTRACTED } = require('./fieldType')

const toSmallInt = val => {
  const number = parseInt(val, 10)
  return number > 32767 || number < -32768 || Number.isNaN(number) ? null : number
}

module.exports = {
  fields: [
    {
      lastTrainingMonth: {
        responseType: 'requiredMonthIndexNotInFuture_lastTrainingYear',
        sanitiser: toSmallInt,
        validationMessage: 'Select the month you last attended refresher training',
        fieldType: EXTRACTED,
      },
    },
    {
      lastTrainingYear: {
        responseType: 'requiredYearNotInFuture',
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
        responseType: 'requiredYearNotInFuture',
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
        responseType: 'requiredString',
        validationMessage: 'Enter your statement',
        fieldType: EXTRACTED,
        sanitiser: val => (val ? val.trim() : null),
      },
    },
  ],
  validate: true,
}
