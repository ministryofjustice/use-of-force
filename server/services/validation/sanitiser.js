const R = require('ramda')

const compose = (acc, fn) => x => fn(acc(x))

/**
 * extract all the 'sanitiser' functions from the metas array and return their composition or R.identity when there are none.
 */
const getSanitiser = description => {
  const metas = R.propOr([], 'metas', description)
  const sanitisers = metas.map(m => m.sanitiser).filter(s => !R.isNil(s))
  return sanitisers.length === 1 ? sanitisers[0] : sanitisers.reduce(compose, R.identity)
}

const simplifyDescription = description => {
  switch (description.type) {
    case 'object':
      return simplifyObjectDescription(description)
    case 'array':
      return simplifyArrayDescription(description)
    default:
      return simplifyOtherDescription(description)
  }
}

const simplifyPrimitiveDescription = description => ({ type: 'primitive', sanitiser: getSanitiser(description) })

const simplifyOtherDescription = description => {
  const then = R.path(['whens', 0, 'then'], description)
  if (then) {
    return simplifyDescription(then)
  }
  return simplifyPrimitiveDescription(description)
}

const simplifyObjectDescription = description => ({
  type: 'object',
  sanitiser: getSanitiser(description),
  keys: R.map(simplifyDescription, R.propOr({}, 'keys', description)),
})

const simplifyArrayDescription = description => ({
  type: 'array',
  sanitiser: getSanitiser(description),
  items: R.map(simplifyDescription, R.propOr([], 'items', description)),
})

const objectSanitiser =
  ({ keys, sanitiser }) =>
  object => {
    const filteredKeys = R.pick(Object.keys(object), keys)
    const sanitisers = R.map(sanitiserFor, filteredKeys)
    return sanitiser(R.mapObjIndexed((s, key) => s(object[key]), sanitisers))
  }

const nilSafeObjectSanitiser = description => R.unless(R.isNil, objectSanitiser(description))

const arraySanitiser =
  ({ sanitiser, items }) =>
  array =>
    sanitiser(array.map(sanitiserFor(items[0])))

const nilSafeArraySanitiser = description => R.unless(R.isNil, arraySanitiser(description))
/**
 * Take a description and return a function that sanitises
 * objects using sanitisers attached to the schema as meta-data.
 * To attach a sanitiser function 's' to a Joi schema chain the meta function like so:
 * .meta({ sanitiser: s})
 *
 * description -> (value -> sanitisedValue)
 */
const sanitiserFor = description => {
  switch (description.type) {
    case 'object':
      return nilSafeObjectSanitiser(description)
    case 'array':
      return nilSafeArraySanitiser(description)
    default:
      return description.sanitiser
  }
}

/**
 * Build a sanitiser for values whose structure is described by a Joi schema description. The sanitisers are functions
 * attached to the Joi schema(s) as metadata.
 * To attach a sanitiser function 's' to a Joi schema chain the meta method like so:
 * .meta({ sanitiser: s})
 * @param description A Joi schema description. Derived from a Joi schema 's' using s.describe().
 * @returns a function value -> sanitisedValue where the structure of value is described by the supplied schema description.
 */
const buildSanitiser = description => sanitiserFor(simplifyDescription(description))

module.exports = {
  getSanitiser,
  simplifyDescription,
  buildSanitiser,
}
