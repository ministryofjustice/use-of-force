const { EXTRACTED } = require('./fieldType')

module.exports = {
  fields: [
    {
      confirm: {
        responseType: 'requiredNumber',
      },
    },
    {
      lastTrainingMonth: {
        responseType: 'requiredMonth',
        sanitiser: val => parseInt(val, 10),
        fieldType: EXTRACTED,
      },
    },
    {
      lastTrainingYear: {
        responseType: 'requiredYear',
        sanitiser: val => parseInt(val, 10),
        fieldType: EXTRACTED,
      },
    },
    {
      jobStartYear: {
        responseType: 'requiredYear',
        sanitiser: val => parseInt(val, 10),
        fieldType: EXTRACTED,
      },
    },
    {
      statement: {
        responseType: 'requiredString',
        fieldType: EXTRACTED,
      },
    },
  ],
  validate: false,
}
