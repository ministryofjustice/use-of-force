const joi = require('@hapi/joi').extend(require('@hapi/joi-date'))
const moment = require('moment')
const R = require('ramda')

const setErrorMessage = message =>
  R.map(e => {
    e.message = message
    return e
  })

const caseInsensitiveComparator = key =>
  R.eqBy(
    R.pipe(
      R.prop(key),
      R.trim,
      R.toUpper
    )
  )

const namePattern = /^[a-zA-Z][a-zA-Z\s\-'.]{0,48}[a-zA-Z]$/
const usernamePattern = /^[a-zA-Z0-9_]{2,50}$/

module.exports = {
  joi,
  usernamePattern,
  namePattern,
  caseInsensitiveComparator,
  setErrorMessage,
  validations: {
    any: joi.any(),

    requiredMonthIndex: joi
      .number()
      .min(0)
      .max(11)
      .required(),

    requiredMonthIndexNotInFuture: yearRef =>
      joi
        .number()
        .min(0)
        .when(joi.ref(yearRef), {
          switch: [
            {
              is: joi
                .number()
                .less(moment().year())
                .required(),
              then: joi
                .number()
                .integer()
                .max(11)
                .required(),
            },
            {
              is: joi
                .number()
                .valid(moment().year())
                .required(),
              then: joi
                .number()
                .integer()
                .max(moment().month())
                .required(),
              otherwise: joi.any().optional(),
            },
          ],
        })
        .required(),

    arrayOfObjects: objectKeys => joi.array().items(joi.object(objectKeys)),

    requiredYearNotInFuture: joi
      .number()
      .min(1900)
      .max(moment().year())
      .required(),

    requiredString: joi
      .string()
      .trim()
      .required(),

    requiredNumber: joi.number().required(),

    requiredBoolean: joi
      .boolean()
      .required()
      .strict(),

    requiredOneOf: (...values) => joi.valid(...values).required(),
  },
}
