const toDate = require('../../utils/dateSanitiser')
const { isNilOrEmpty } = require('../../utils/utils')

const isBlankObject = o => (isNilOrEmpty(o) ? true : Object.values(o).every(isNilOrEmpty))
const isNotBlankObject = o => !isBlankObject(o)

module.exports = {
  toDate,

  // array -> array
  removeEmptyObjects: array => array.filter(isNotBlankObject),

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

  toSmallInt: val => {
    const number = parseInt(val, 10)
    return number > 32767 || number < -32768 || Number.isNaN(number) ? null : number
  },
}
