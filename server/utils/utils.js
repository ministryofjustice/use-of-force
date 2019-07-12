const R = require('ramda')
const moment = require('moment')

const isNilOrEmpty = item => {
  return R.isEmpty(item) || R.isNil(item)
}

const getFieldDetail = (fieldPath, fieldConfig) => {
  return R.pipe(
    R.values,
    R.head,
    R.path(fieldPath)
  )(fieldConfig)
}

const getFieldName = fieldConfig => {
  return R.pipe(
    R.keys,
    R.head
  )(fieldConfig)
}

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

const formatDate = val => (isBlank(val) ? '' : moment(val, 'DDYYYY-MM-DDMMMYY').format('DD/MM/YYYY'))

module.exports = {
  formatDate,
  isNilOrEmpty,
  getFieldDetail,
  getFieldName,
  properCaseName,
  getIn: R.path,
  equals: R.equals,
  firstItem: R.head,
  mergeWithRight: R.mergeDeepRight,
  pickBy: R.pickBy,
}
