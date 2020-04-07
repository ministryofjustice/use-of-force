const R = require('ramda')

const isNilOrEmpty = R.either(R.isEmpty, R.isNil)

const getFieldDetail = (fieldPath, fieldConfig) => R.pipe(R.values, R.head, R.path(fieldPath))(fieldConfig)

const getFieldName = R.pipe(R.keys, R.head)

const properCase = word =>
  typeof word === 'string' && word.length >= 1 ? word[0].toUpperCase() + word.toLowerCase().slice(1) : word

const isBlank = str => !str || /^\s*$/.test(str)

/**
 * Converts a name (first name, last name, middle name, etc.) to proper case equivalent, handling double-barreled names
 * correctly (i.e. each part in a double-barreled is converted to proper case).
 * @param name name to be converted.
 * @returns name converted to proper case.
 */
const properCaseName = name =>
  isBlank(name)
    ? ''
    : name
        .split('-')
        .map(properCase)
        .join('-')

const properCaseFullName = name =>
  isBlank(name)
    ? ''
    : name
        .split(/(\s+)/)
        .filter(s => s.trim().length)
        .map(properCaseName)
        .join(' ')

module.exports = {
  isNilOrEmpty,
  getFieldDetail,
  getFieldName,
  properCaseName,
  properCaseFullName,
  getIn: R.path,
  equals: R.equals,
  firstItem: R.head,
  mergeWithRight: R.mergeDeepRight,
  isBlank,
}
