import R from 'ramda'
import moment, { Moment } from 'moment'

export const isNilOrEmpty = R.either(R.isEmpty, R.isNil)
export const { equals } = R
export const firstItem = R.head

export const getFieldDetail = (fieldPath: string, fieldConfig: string): string =>
  R.pipe(R.values, R.head, R.path(fieldPath))(fieldConfig)

export const getFieldName = R.pipe(R.keys, R.head)

export const properCase = (word: string): string =>
  typeof word === 'string' && word.length >= 1 ? word[0].toUpperCase() + word.toLowerCase().slice(1) : word

export const isBlank = (str: string): boolean => !str || /^\s*$/.test(str)

export const removeKeysWithEmptyValues = (vals: Record<string, unknown>): Record<string, unknown> =>
  Object.entries(vals).reduce((result, [k, v]) => {
    return isNilOrEmpty(v) ? result : { ...result, [k]: v }
  }, {})

export const parseDate = (val: string | unknown, format: string): Moment | null => {
  if (!val) {
    return null
  }
  const date = moment(val, format, true)
  return date.isValid() ? date : null
}

/**
 * Converts a name (first name, last name, middle name, etc.) to proper case equivalent, handling double-barreled names
 * correctly (i.e. each part in a double-barreled is converted to proper case).
 * @param name name to be converted.
 * @returns name converted to proper case.
 */
export const properCaseName = (name: string): string => (isBlank(name) ? '' : name.split('-').map(properCase).join('-'))

export const properCaseFullName = (name: string): string =>
  isBlank(name)
    ? ''
    : name
        .split(/(\s+)/)
        .filter(s => s.trim().length)
        .map(properCaseName)
        .join(' ')

export function forenameToInitial(name: string): string {
  if (!name) return null
  return `${name.charAt(0)}. ${name.split(' ').pop()}`
}

export const initialiseName = (fullName?: string): string | null => {
  // this check is for the authError page
  if (!fullName) return null

  const array = fullName.split(' ')
  return `${array[0][0]}. ${array.reverse()[0]}`
}
