const { joi, validations } = require('./validations')

module.exports = joi.object({
  lastTrainingMonth: validations.requiredMonthIndexNotInFuture('lastTrainingYear'),
  lastTrainingYear: validations.requiredYearNotInFuture,
  jobStartYear: validations.requiredYearNotInFuture,
  statement: validations.requiredString,
})
