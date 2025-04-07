import sanitisers from './sanitisers'

const { removeEmptyObjects } = sanitisers
describe('removeEmptyObjects', () => {
  it('accepts an empty array', () => expect(removeEmptyObjects([])).toEqual([]))
  it('leaves a "non-empty" object', () => expect(removeEmptyObjects([{ a: 'a' }])).toEqual([{ a: 'a' }]))
  it('removes an empty object', () => expect(removeEmptyObjects([{}])).toEqual([]))
  it('removes an object with an undefined property value', () =>
    expect(removeEmptyObjects([{ a: undefined }])).toEqual([]))
  it('removes an object with a null property value', () => expect(removeEmptyObjects([{ a: null }])).toEqual([]))
  it('removes an object with a zero-length string property value', () =>
    expect(removeEmptyObjects([{ a: '' }])).toEqual([]))
  it('correctly filters multiple values', () =>
    expect(
      removeEmptyObjects([
        null,
        undefined,
        {},
        { a: null },
        { a: undefined },
        { a: '' },
        { a: false },
        { a: 0 },
        { a: 'a' },
        { a: [] },
        { a: {} },
        { a: '', b: '', c: null, d: undefined },
      ])
    ).toEqual([{ a: false }, { a: 0 }, { a: 'a' }]))
})
