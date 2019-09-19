const { properCaseName, properCaseFullName, isNilOrEmpty } = require('./utils')

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

describe('nilOrEmpty', () => {
  it('is empty', () => {
    expect(isNilOrEmpty(null)).toBe(true)
    expect(isNilOrEmpty(undefined)).toBe(true)
    expect(isNilOrEmpty('')).toBe(true)
    expect(isNilOrEmpty('x')).toBe(false)
  })
})
