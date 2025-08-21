import R from 'ramda'
import moment, { Moment } from 'moment'
import { format, isValid, parse } from 'date-fns'

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

export const parseDate = (val: string | unknown, dateFormat: string): Moment | null => {
  if (!val) {
    return null
  }
  const date = moment(val, dateFormat, true)
  return date.isValid() ? date : null
}

/**
 * Converts a name (first name, last name, middle name, etc.) to proper case equivalent, handling double-barreled names
 * correctly (i.e. each part in a double-barreled is converted to proper case).
 * @param name name to be converted.
 * @returns name converted to proper case.
 */
export const properCaseName = (name: string): string => (isBlank(name) ? '' : name.split('-').map(properCase).join('-'))
export const personDateOfBirth = (dateOfBirth: string): string => dayMonthYearForwardSlashSeparator(dateOfBirth)
export const dayMonthYearForwardSlashSeparator = (dateString: string): string => {
  if (!dateString) return ''
  const date = parse(dateString, 'yyyy-MM-dd', new Date())
  return date && isValid(date) ? format(date, 'dd/MM/yyyy') : dateString
}
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
export const personProfileName = (person: { firstName: string; lastName: string }): string =>
  lastNameCommaFirstName(person)

export const lastNameCommaFirstName = (person: { firstName: string; lastName: string }): string => {
  return `${nameCase(person.lastName)}, ${nameCase(person.firstName)}`.replace(/(^, )|(, $)/, '')
}

export const sentenceCase = (word: string): string => {
  const uniformWhitespaceWord = uniformWhitespace(word)
  return uniformWhitespaceWord.trim().length >= 1
    ? uniformWhitespaceWord[0].toUpperCase() + uniformWhitespaceWord.toLowerCase().slice(1)
    : ''
}

export const nameCase = (name: string): string => {
  const uniformWhitespaceName = uniformWhitespace(name)
  return uniformWhitespaceName
    .split(' ')
    .map(s => (s.includes('-') ? s.split('-').map(sentenceCase).join('-') : sentenceCase(s)))
    .join(' ')
}

const uniformWhitespace = (word: string): string => (word ? word.trim().replace(/\s+/g, ' ') : '')

export const initialiseName = (fullName?: string): string | null => {
  // this check is for the authError page
  if (!fullName) return null

  const array = fullName.split(' ')
  return `${array[0][0]}. ${array.reverse()[0]}`
}

export const hasValueChanged = (oldValue, newValue) => {
  if (!oldValue && newValue === '') return false

  const newVal = newValue?.toUpperCase().trim() || undefined
  const oldVal = oldValue?.toUpperCase().trim() || undefined
  return newVal !== oldVal
}

export const trimAllValuesInObjectArray = arr => {
  return arr?.filter(obj => obj.name !== '').map(obj => ({ name: obj.name?.trim() }))
}

export const excludeObjectsWithEmptyValues = arr => {
  return arr?.map(obj => ({ name: obj.name?.trim() })).filter(obj => obj.name !== '')
}

export const getChangedValues = (obj, predicate) => {
  return Object.fromEntries(Object.entries(obj).filter(([key, value]) => predicate(value, key)))
}

export const toJSDate = ({ date, time: { hour, minute } }) => {
  const [day, month, year] = date.split('/').map(Number)
  return new Date(year, month - 1, day, Number(hour), Number(minute))
}
