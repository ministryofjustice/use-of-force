const R = require('ramda')
const { isNilOrEmpty } = require('../utils/utils')

const ignore = value => R.isNil(value) || (R.is(Array, value) && R.isEmpty(value))

const extractKeys = fieldTypeValue =>
  R.pipe(
    R.propOr({}, 'keys'), // keys property
    R.map(
      R.pipe(
        R.prop('metas'),
        R.mergeAll,
        R.prop('fieldType')
      )
    ),
    R.filter(R.equals(fieldTypeValue)),
    R.keys
  )

// [keys] -> (accumulator, [key, value]) -> accumulator
const buildIteratorFn = keysToSplitOn => (acc, [key, value]) => {
  const fieldSetKey = R.includes(key, keysToSplitOn) ? 'extractedFields' : 'payloadFields'
  return isNilOrEmpty(value) ? acc : R.assocPath([fieldSetKey, key], value, acc)
}

// ((accumulator, [key, value]) -> accumulator) -> input -> splitInput
const buildWithIteratorFn = iteratorFn =>
  R.pipe(
    R.toPairs,
    R.reduce(iteratorFn, { payloadFields: {}, extractedFields: {} })
  )
/**
 *
 * @param A Joi schema description.  Must be for an object (because there's no need to support anything else)
 * @param fieldType The fieldType to split on. Probably 'EXTERNAL'
 * returns a function that takes 'input' and returns the fields of that object split into two sets
 * 'payloadFields' and 'extractedFields' according to whether the schema metadata for that field has
 * a'fieldType' property matching the parameter above.
 */
const buildFieldTypeSplitter = (description, fieldType) => {
  if (description.type !== 'object') {
    throw Error('Expected an object schema')
  }

  return R.pipe(
    extractKeys(fieldType),
    buildIteratorFn,
    buildWithIteratorFn
  )(description)
}

module.exports = {
  buildFieldTypeSplitter,
}
