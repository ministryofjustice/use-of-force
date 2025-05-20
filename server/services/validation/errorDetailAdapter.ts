import * as R from 'ramda'

// array -> string
const hrefFromPath = path => {
  const [head, ...tail] = path
  return tail.reduce((acc, value) => `${acc}[${value}]`, head)
}

const hrefBuilderBuilder = firstFieldNameMap => path => {
  const firstFieldName = firstFieldNameMap[path[0]]
  if (path.length < 2 && firstFieldName) {
    return firstFieldName
  }
  return hrefFromPath(path)
}

const detailAdapterBuilder = firstFieldNameMap => {
  const buildHref = hrefBuilderBuilder(firstFieldNameMap)
  return detail => ({
    text: detail.message,
    href: `#${buildHref(detail.path)}`,
  })
}

/**
 * Given a Joi schema description where the fields in the schema have 'firstFieldName' meta-data annotations
 * extract those values to a map (object) of fieldName : firstFieldName
 * @param description A Joi schema description.
 * @return An object, where the keys are field names and the values are 'firstFieldName' metadata values
 */
export const extractFirstFieldNameMap = R.pipe(
  R.propOr({}, 'keys'),
  R.map(R.pipe(R.prop('metas'), R.mergeAll, R.prop('firstFieldName'))),
  R.reject(R.isNil),
)

/**
 * given a Joi schema description return a function that will adapt Joi validator error detail objects
 * to this application's needs.
 * The adapter takes a a Joi error.details element and returns an object
 * like { text, href }
 * where 'text' is detail.message and href is an HTTP tag locator.
 * @type {Function|*}
 */
export const buildErrorDetailAdapter = R.pipe(extractFirstFieldNameMap, detailAdapterBuilder)
