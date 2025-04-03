import { toInteger, toDate } from'../../utils/dateSanitiser'
import { isNilOrEmpty } from '../../utils/utils'

const isBlankObject = o => (isNilOrEmpty(o) ? true : Object.values(o).every(isNilOrEmpty))
const isNotBlankObject = o => !isBlankObject(o)

export default {
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

  toInteger,

  toSmallInt: val => {
    const number = parseInt(val, 10)
    return number > 32767 || number < -32768 || Number.isNaN(number) ? null : number
  },
}
