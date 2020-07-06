const joi = require('@hapi/joi').extend(require('@hapi/joi-date'))
const R = require('ramda')
const { toBoolean, trimmedString, toInteger, removeEmptyObjects } = require('./sanitisers')

const caseInsensitiveComparator = key => R.eqBy(R.pipe(R.propOr('', key), R.trim, R.toUpper))

const namePattern = /^[a-zA-Z][a-zA-Z\s\-'.]{0,48}[a-zA-Z]$/
const usernamePattern = /^[a-zA-Z0-9_]{2,50}$/

const asMeta = sanitiser => ({
  sanitiser,
})

const requiredString = joi.string().trim(true).required().meta(asMeta(trimmedString))

const optionalString = joi.string().trim(true).meta(asMeta(trimmedString))

const requiredStringMsg = message =>
  requiredString.messages({
    'any.required': message,
    'string.base': message,
    'string.empty': message,
    'string.min': message,
  })

const requiredBoolean = joi.boolean().required().meta(asMeta(toBoolean))

const requiredBooleanMsg = message =>
  requiredBoolean.messages({
    'boolean.base': message,
    'any.required': message,
  })

const requiredOneOf = (...values) => joi.valid(...values).required()
const requiredOneOfMsg = (...values) => message =>
  requiredOneOf(...values).messages({
    'any.required': message,
    'any.only': message,
  })

const requiredNumber = joi.number().required()
const requiredNumberMsg = message =>
  requiredNumber.messages({
    'any.required': message,
    'number.base': message,
  })

const requiredInteger = requiredNumber.integer().meta(asMeta(toInteger))

const requiredIntegerMsg = message =>
  requiredInteger.messages({ 'any.required': message, 'number.base': message, 'number.integer': message })

const requiredIntegerRangeMsg = (min, max) => message =>
  requiredIntegerMsg(message).$.min(min).max(max).message(message)

const requiredPatternMsg = pattern => message => requiredStringMsg(message).pattern(pattern).message(message)

const arrayOfObjects = objectKeys => joi.array().items(joi.object(objectKeys)).meta(asMeta(removeEmptyObjects))

const requiredYearNotInFuture = joi.number().min(1900).max(joi.ref('$year')).required()

const requiredYearNotInFutureMsg = (notAnIntegerMsg, yearOutOfRangeMsg) =>
  requiredIntegerMsg(notAnIntegerMsg).ruleset.min(1900).max(joi.ref('$year')).message(yearOutOfRangeMsg)

const requiredMonthIndex = joi.number().min(0).max(11).required()

const requiredMonthIndexNotInFuture = (yearRef, outOfRangeMessage) =>
  requiredIntegerMsg(outOfRangeMessage).when(joi.ref(yearRef), {
    switch: [
      {
        is: joi.number().less(joi.ref('$year')),
        then: requiredIntegerMsg(outOfRangeMessage).$.min(0).max(11).message(outOfRangeMessage),
      },
      {
        is: joi.number().valid(joi.ref('$year')),
        then: requiredIntegerMsg(outOfRangeMessage).$.min(0).max(joi.ref('$month')).message(outOfRangeMessage),
        otherwise: joi.any().optional(),
      },
    ],
  })

const optionalForPartialValidation = {
  partial: s => s.allow(null).optional(),
}

const minZeroForPartialValidation = {
  partial: s => s.allow(null).optional().min(0),
}

module.exports = {
  joi,
  usernamePattern,
  namePattern,
  caseInsensitiveComparator,
  asMeta,
  validations: {
    any: joi.any(),

    optionalForPartialValidation,
    minZeroForPartialValidation,

    requiredMonthIndex,
    requiredMonthIndexNotInFuture,

    arrayOfObjects,

    requiredYearNotInFuture,
    requiredYearNotInFutureMsg,

    optionalString,
    requiredString,
    requiredStringMsg,

    requiredPatternMsg,

    requiredNumber,
    requiredNumberMsg,

    requiredInteger,
    requiredIntegerMsg,
    requiredIntegerRangeMsg,

    requiredBoolean,
    requiredBooleanMsg,

    requiredOneOf,
    requiredOneOfMsg,
  },
}
