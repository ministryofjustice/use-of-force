const moment = require('moment')
const {
  properCaseName,
  properCaseFullName,
  forenameToInitial,
  isNilOrEmpty,
  removeKeysWithEmptyValues,
  parseDate,
} = require('./utils')

describe('properCaseName', () => {
  it('null string', () => {
    expect(properCaseName(null)).toEqual('')
  })
  it('empty string', () => {
    expect(properCaseName('')).toEqual('')
  })
  it('Lower Case', () => {
    expect(properCaseName('bob')).toEqual('Bob')
  })
  it('Mixed Case', () => {
    expect(properCaseName('GDgeHHdGr')).toEqual('Gdgehhdgr')
  })
  it('Multiple words', () => {
    expect(properCaseName('BOB SMITH')).toEqual('Bob smith')
  })
  it('Hyphenated', () => {
    expect(properCaseName('MONTGOMERY-FOSTER-SMYTH-WALLACE-BOB')).toEqual('Montgomery-Foster-Smyth-Wallace-Bob')
  })
})

describe('properCaseFullName', () => {
  it('null string', () => {
    expect(properCaseFullName(null)).toEqual('')
  })
  it('empty string', () => {
    expect(properCaseFullName('')).toEqual('')
  })
  it('Lower Case', () => {
    expect(properCaseFullName('bob smith')).toEqual('Bob Smith')
  })
  it('Extra whitespace', () => {
    expect(properCaseFullName('bob     smith')).toEqual('Bob Smith')
  })
  it('Mixed Case', () => {
    expect(properCaseFullName('GDgeHHdGr DsdddsdSs sDFsedfd')).toEqual('Gdgehhdgr Dsdddsdss Sdfsedfd')
  })
  it('Multiple words', () => {
    expect(properCaseFullName('BOB SMITH')).toEqual('Bob Smith')
  })
  it('Hyphenated', () => {
    expect(properCaseFullName('JAMES robert MONTGOMERY-FOSTER-SMYTH-WALLACE-BOB')).toEqual(
      'James Robert Montgomery-Foster-Smyth-Wallace-Bob'
    )
  })
})

describe('Forename to initial', () => {
  it('should return null', () => {
    expect(forenameToInitial('')).toEqual(null)
  })
  it('should change forename to initial', () => {
    expect(forenameToInitial('Robert Smith')).toEqual('R. Smith')
  })
  it('should change forename to initial hypenated last name', () => {
    expect(forenameToInitial('Robert Smith-Jones')).toEqual('R. Smith-Jones')
  })
})

describe('nilOrEmpty', () => {
  it('is empty', () => {
    expect(isNilOrEmpty(null)).toBe(true)
    expect(isNilOrEmpty(undefined)).toBe(true)
    expect(isNilOrEmpty('')).toBe(true)
    expect(isNilOrEmpty('x')).toBe(false)
  })
})

describe('removeKeysWithEmptyValues', () => {
  it('empty', () => {
    expect(removeKeysWithEmptyValues({})).toEqual({})
  })
  it('does not alter non empty values', () => {
    expect(removeKeysWithEmptyValues({ a: 1, b: true, c: 'bob' })).toEqual({ a: 1, b: true, c: 'bob' })
  })
  it('does not remove other falsy values', () => {
    expect(removeKeysWithEmptyValues({ a: 0, b: false, c: NaN })).toEqual({ a: 0, b: false, c: NaN })
  })
  it('remove nulls and undefined values', () => {
    expect(removeKeysWithEmptyValues({ a: true, b: null, c: undefined, d: '', e: [], f: {} })).toEqual({ a: true })
  })
})

describe('parseDate', () => {
  it('null', () => {
    expect(parseDate(null, 'D MMM YYYY')).toEqual(null)
  })
  it('empty', () => {
    expect(parseDate('', 'D MMM YYYY')).toEqual(null)
  })
  it('valid', () => {
    expect(parseDate('30 Jan 2020', 'D MMM YYYY').toDate()).toEqual(moment('2020-01-30').toDate())
  })
  it('invalid month', () => {
    expect(parseDate('30 Jon 2020', 'D MMM YYYY')).toEqual(null)
  })
  it('invalid day', () => {
    expect(parseDate('32 Jan 2020', 'D MMM YYYY')).toEqual(null)
  })
  it('wrong format', () => {
    expect(parseDate('2020-02-31', 'D MMM YYYY')).toEqual(null)
  })
  it('just wrong', () => {
    expect(parseDate('this is not a date', 'D MMM YYYY')).toEqual(null)
  })
})
