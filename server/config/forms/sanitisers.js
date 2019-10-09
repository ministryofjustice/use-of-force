const toDate = require('../../utils/dateSanitiser')
const { isBlank } = require('../../utils/utils')

const hasAtLeastOneOf = attrs => input => attrs.find(attr => !isBlank(input[attr]))

const withoutKeysNotIn = attrs => value =>
  attrs.reduce((previous, attr) => (value[attr] ? { ...previous, [attr]: value[attr].trim() } : previous), {})

module.exports = {
  withoutKeysNotIn,
  hasAtLeastOneOf,
  toDate,

  removeEmptyValues: attrs => (inputs = []) => inputs.filter(hasAtLeastOneOf(attrs)).map(withoutKeysNotIn(attrs)),

  toBoolean: val => {
    switch (val) {
      case 'true':
        return true
      case 'false':
        return false
      default:
        return null
    }
  },

  trimmedString: val => (val ? val.trim() : null),

  toInteger: val => {
    const number = parseInt(val, 10)
    return Number.isNaN(number) ? null : number
  },
}
