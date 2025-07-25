const moment = require('moment')
const {
  properCaseName,
  properCaseFullName,
  forenameToInitial,
  isNilOrEmpty,
  removeKeysWithEmptyValues,
  parseDate,
  trimAllValuesInObjectArray,
  hasValueChanged,
  getChangedValues,
  convertToUTC,
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

describe('hasValueChanged', () => {
  it('Should return true for new value empty string', () => {
    const result = hasValueChanged('Hello', '')
    expect(result).toBe(true)
  })

  it('Should return true for old value empty string', () => {
    const result = hasValueChanged('', 'Hello')
    expect(result).toBe(true)
  })
  it('Should return true if values different', () => {
    const result = hasValueChanged('Hello', 'Bye')
    expect(result).toBe(true)
  })
  it('Should return false if both values same', () => {
    const result = hasValueChanged('Hello', 'Hello')
    expect(result).toBe(false)
  })

  it('Should return false for different case', () => {
    const result = hasValueChanged('hello', 'HeLLo')
    expect(result).toBe(false)
  })
  it('Should return false if only difference is spacing', () => {
    const result = hasValueChanged('hello', 'Hello ')
    expect(result).toBe(false)
  })
})

describe('trimAllValuesInObjectArray', () => {
  test('handles undefined inputs', () => {
    const actualResult = trimAllValuesInObjectArray()
    const expectedResult = undefined
    expect(actualResult).toStrictEqual(expectedResult)
  })
  test('returns correct response when one value is padded', () => {
    const actualResult = trimAllValuesInObjectArray([{ name: 'x' }, { name: 'y ' }])
    const expectedResult = [{ name: 'x' }, { name: 'y' }]
    expect(actualResult).toStrictEqual(expectedResult)
  })
  test('handles inputs that dont have padding', () => {
    const actualResult = trimAllValuesInObjectArray([{ name: 'x' }, { name: 'y' }])
    const expectedResult = [{ name: 'x' }, { name: 'y' }]
    expect(actualResult).toStrictEqual(expectedResult)
  })

  test('handles inputs with empty strings', () => {
    const actualResult = trimAllValuesInObjectArray([{ name: '' }, { name: 'y' }])
    const expectedResult = [{ name: 'y' }]
    expect(actualResult).toStrictEqual(expectedResult)
  })

  test('handles inputs with gaps', () => {
    const actualResult = trimAllValuesInObjectArray([{ name: 'hello there' }, { name: 'y' }])
    const expectedResult = [{ name: 'hello there' }, { name: 'y' }]
    expect(actualResult).toStrictEqual(expectedResult)
  })

  test('handles single object array', () => {
    const actualResult = trimAllValuesInObjectArray([{ name: 'x ' }])
    const expectedResult = [{ name: 'x' }]
    expect(actualResult).toStrictEqual(expectedResult)
  })
})

describe('getChangedValues', () => {
  const dataComparison = {
    useOfForcePlanned: {
      oldValue: 'bill',
      newValue: 'harry',
      hasChanged: true,
    },
    authorisedBy: {
      oldValue: 'tom',
      newValue: 'tom',
      hasChanged: false,
    },
  }
  it('Should return objects that have changed', () => {
    const result = getChangedValues(dataComparison, value => value.hasChanged === true)
    const expectedResult = { useOfForcePlanned: { hasChanged: true, newValue: 'harry', oldValue: 'bill' } }
    expect(result).toEqual(expectedResult)
  })

  it('Should return no objects as none have changed', () => {
    dataComparison.useOfForcePlanned.hasChanged = false
    const result = getChangedValues(dataComparison, value => value.hasChanged === true)
    const expectedResult = {}
    expect(result).toEqual(expectedResult)
  })
})

describe('convertToUTC', () => {
  it('should convert date to utc', () => {
    const dateToConvert = {
      date: '23/07/2025',
      time: {
        hour: '03',
        minute: '10',
      },
    }
    expect(convertToUTC(dateToConvert)).toEqual('2025-07-23T02:10:00.000Z')
  })
})
