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
      R.propOr('', key),
      R.trim,
      R.toUpper
    )
  )

const namePattern = /^[a-zA-Z][a-zA-Z\s\-'.]{0,48}[a-zA-Z]$/
const usernamePattern = /^[a-zA-Z0-9_]{2,50}$/

const requiredString = joi
  .string()
  .trim(true)
  .required()

const requiredStringMsg = message =>
  requiredString.messages({
    'any.required': message,
    'string.base': message,
    'string.empty': message,
    'string.min': message,
  })

const requiredBoolean = joi.boolean().required()

const requiredOneOf = (...values) => joi.valid(...values).required()

const requiredNumber = joi.number().required()

const requiredInteger = requiredNumber.integer()

const requiredIntegerMsg = message =>
  requiredInteger.messages({ 'any.required': message, 'number.base': message, 'number.integer': message })

const requiredIntegerRangeMsg = (min, max) => message =>
  requiredIntegerMsg(message)
    .$.min(min)
    .max(max)
    .message(message)

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
              is: joi.number().less(moment().year()),
              then: joi
                .number()
                .integer()
                .max(11)
                .required(),
            },
            {
              is: joi.number().valid(moment().year()),
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

    requiredString,

    requiredStringMsg,

    requiredPatternMsg: pattern => message =>
      requiredStringMsg(message)
        .pattern(pattern)
        .message(message),

    requiredNumber,

    requiredNumberMsg: message =>
      requiredNumber.messages({
        'any.required': message,
        'number.base': message,
      }),

    requiredInteger,
    requiredIntegerMsg,
    requiredIntegerRangeMsg,

    requiredBoolean,

    requiredBooleanMsg: message =>
      requiredBoolean.messages({
        'boolean.base': message,
        'any.required': message,
      }),

    requiredOneOf,

    requiredOneOfMsg: (...values) => message =>
      requiredOneOf(...values).messages({
        'any.required': message,
        'any.only': message,
      }),
  },
}
