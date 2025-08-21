const moment = require('moment')
const {
  properCaseName,
  properCaseFullName,
  forenameToInitial,
  isNilOrEmpty,
  removeKeysWithEmptyValues,
  parseDate,
  trimAllValuesInObjectArray,
  excludeObjectsWithEmptyValues,
  hasValueChanged,
  getChangedValues,
  toJSDate,
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

describe('excludeObjectsWithEmptyValues', () => {
  test('handles undefined inputs', () => {
    const actualResult = excludeObjectsWithEmptyValues()
    const expectedResult = undefined
    expect(actualResult).toStrictEqual(expectedResult)
  })

  test('handles empty array', () => {
    const actualResult = excludeObjectsWithEmptyValues([])
    const expectedResult = []
    expect(actualResult).toStrictEqual(expectedResult)
  })

  test('handles empty single length array', () => {
    const actualResult = excludeObjectsWithEmptyValues([{ name: ' ' }])
    const expectedResult = []
    expect(actualResult).toStrictEqual(expectedResult)
  })

  test('returns correct response when value is empty padded or zero length string', () => {
    const actualResult = excludeObjectsWithEmptyValues([{ name: '' }, { name: ' ' }])
    const expectedResult = []
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

describe('toJSDate', () => {
  test('converts a standard DD/MM/YYYY date and time to JS Date', () => {
    const input = {
      date: '02/03/2020',
      time: { hour: '14', minute: '17' },
    }

    const result = toJSDate(input)
    expect(result.getFullYear()).toBe(2020)
    expect(result.getMonth()).toBe(2) // March
    expect(result.getDate()).toBe(2)
    expect(result.getHours()).toBe(14)
    expect(result.getMinutes()).toBe(17)
    expect(result.toISOString()).toBe('2020-03-02T14:17:00.000Z')
  })

  test('handles single-digit day and month correctly', () => {
    const input = {
      date: '5/7/2025',
      time: { hour: '8', minute: '5' },
    }
    const result = toJSDate(input)
    expect(result.getFullYear()).toBe(2025)
    expect(result.getMonth()).toBe(6) // July
    expect(result.getDate()).toBe(5)
    expect(result.getHours()).toBe(8)
    expect(result.getMinutes()).toBe(5)
  })

  test('returns correct Date object for end of year', () => {
    const input = {
      date: '31/12/2024',
      time: { hour: '23', minute: '59' },
    }
    const result = toJSDate(input)
    expect(result.getFullYear()).toBe(2024)
    expect(result.getMonth()).toBe(11) // December
    expect(result.getDate()).toBe(31)
    expect(result.getHours()).toBe(23)
    expect(result.getMinutes()).toBe(59)
  })

  test('gracefully handles zero-padded inputs', () => {
    const input = {
      date: '01/01/2022',
      time: { hour: '09', minute: '00' },
    }
    const result = toJSDate(input)
    expect(result.getFullYear()).toBe(2022)
    expect(result.getMonth()).toBe(0) // January
    expect(result.getDate()).toBe(1)
    expect(result.getHours()).toBe(9)
    expect(result.getMinutes()).toBe(0)
  })

  test('invalid date format (missing parts) should produce NaN date', () => {
    const input = {
      date: '2020-03-02', // wrong format
      time: { hour: '14', minute: '17' },
    }
    const result = toJSDate(input)
    expect(result.toString()).toBe('Invalid Date')
  })
})
