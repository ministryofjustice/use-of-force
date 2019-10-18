const R = require('ramda')

/**
 * extract all the 'sanitiser' functions from the metas array and return their composition or R.identity when there are none.
 */
const getSanitiser = R.pipe(
  R.propOr([], 'metas'),
  R.pluck('sanitiser'),
  R.reject(R.isNil),
  R.ifElse(
    // if there is exactly 1 sanitiser function
    R.pipe(
      R.length,
      R.equals(1)
    ),
    // return the function
    R.head,
    // otherwise compose the list of functions into one
    R.reduce(R.pipe, R.identity)
  )
)

// Have to add 'description' as a parameter to one of the following functions to get the recursive calls to compile.
const simplifyDescription = description =>
  R.cond([
    [R.propEq('type', 'object'), simplifyObjectDescription],
    [R.propEq('type', 'array'), simplifyArrayDescription],
    [R.T, simplifyOtherDescription],
  ])(description)

const simplifyPrimitiveDescription = description => ({ type: 'primitive', sanitiser: getSanitiser(description) })

const simplifyOtherDescription = R.ifElse(
  R.hasPath(['whens', 0, 'then']),
  R.pipe(
    R.path(['whens', 0, 'then']),
    simplifyDescription
  ),
  simplifyPrimitiveDescription
)

const simplifyObjectDescription = description => ({
  type: 'object',
  sanitiser: getSanitiser(description),
  keys: R.pipe(
    R.propOr({}, 'keys'),
    R.map(simplifyDescription)
  )(description),
})

const simplifyArrayDescription = description => ({
  type: 'array',
  sanitiser: getSanitiser(description),
  items: R.pipe(
    R.propOr([], 'items'),
    R.map(simplifyDescription)
  )(description),
})

const objectSanitiser = description => object =>
  R.pipe(
    R.prop('keys'),
    R.pick(R.keys(object)),
    R.map(sanitiserFor),
    R.mapObjIndexed((sanitiser, key) => sanitiser(object[key])),
    description.sanitiser
  )(description)

const nilSafeObjectSanitiser = description => R.unless(R.isNil, objectSanitiser(description))

const arraySanitiser = description => array =>
  R.pipe(
    R.prop('items'),
    R.head,
    sanitiserFor,
    sanitiser => R.map(sanitiser)(array),
    description.sanitiser
  )(description)

const nilSafeArraySanitiser = description => R.unless(R.isNil, arraySanitiser(description))
/**
 * Take a description and return a function that sanitises
 * objects using sanitisers attached to the schema as meta-data.
 * To attach a sanitiser function 's' to a Joi schema chain the meta function like so:
 * .meta({ sanitiser: s})
 *
 * description -> (value -> sanitisedValue)
 */
const sanitiserFor = R.cond([
  [R.propEq('type', 'object'), nilSafeObjectSanitiser],
  [R.propEq('type', 'array'), nilSafeArraySanitiser],
  [R.T, R.prop('sanitiser')],
])

/**
 * Build a sanitiser for a Joi schema object using sanitiser functions attached to the schema as meta-data.
 * To attach a sanitiser function 's' to a Joi schema chain the meta function like so:
 * .meta({ sanitiser: s})
 * @param schema
 * @returns a function value -> sanitisedValue where the structure of value is described by the supplied schema.
 */
const buildSanitiser = description =>
  R.pipe(
    simplifyDescription,
    sanitiserFor
  )(description)

module.exports = {
  simplifyDescription,
  buildSanitiser,
}
