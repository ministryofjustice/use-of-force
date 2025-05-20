import { propOr, map, mergeAll, filter, equals, assocPath, toPairs } from 'ramda'
import { isNilOrEmpty } from '../../utils/utils'

const extractPropertyNamesForFieldType = (fieldTypeValue, description) => {
  const keys = propOr({}, 'keys', description)
  const descriptionsHavingFieldTypeMetas = map(d => mergeAll(d.metas).fieldType, keys)
  const descriptionsHavingNamedFieldType = filter(equals(fieldTypeValue), descriptionsHavingFieldTypeMetas)
  return Object.keys(descriptionsHavingNamedFieldType)
}

// [keys] -> (accumulator, [key, value]) -> accumulator
const buildReduceFn =
  keysToSplitOn =>
  (acc, [key, value]) => {
    const fieldSetKey = keysToSplitOn.includes(key) ? 'extractedFields' : 'payloadFields'
    return isNilOrEmpty(value) ? acc : assocPath([fieldSetKey, key], value, acc)
  }

// ((accumulator, [key, value]) -> accumulator) -> input -> splitInput
const buildWithReduceFn = reduceFn => input => {
  const pairs = toPairs(input)
  return pairs.reduce(reduceFn, { payloadFields: {}, extractedFields: {} })
}
/**
 *
 * @param description A Joi schema description.  Must be for an object (because there's no need to support anything else)
 * @param fieldType The fieldType to split on. Probably 'EXTERNAL'
 * returns a function that takes 'input' and returns the fields of that object split into two sets
 * 'payloadFields' and 'extractedFields' according to whether the schema metadata for that field has
 * a'fieldType' property matching the parameter above.
 */
const buildFieldTypeSplitter = (description, fieldType) => {
  if (description.type !== 'object') {
    throw Error('Expected an object schema')
  }

  const k = extractPropertyNamesForFieldType(fieldType, description)
  const rfn = buildReduceFn(k)
  return buildWithReduceFn(rfn)
}

export default buildFieldTypeSplitter
