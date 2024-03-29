import { offsetAndLimitForPage, metaDataForPage, buildPageResponse, toPage } from './page'

describe('limitAndOffsetForPage', () => {
  it('check values', () => {
    expect(() => offsetAndLimitForPage(-1, 3)).toThrow(Error('Page number has to be greater than 0'))
    expect(() => offsetAndLimitForPage(0, 3)).toThrow(Error('Page number has to be greater than 0'))
    expect(offsetAndLimitForPage(1, 3)).toEqual([0, 3])
    expect(offsetAndLimitForPage(2, 3)).toEqual([3, 3])
    expect(offsetAndLimitForPage(3, 3)).toEqual([6, 3])
  })
})

describe('metaDataForPage', () => {
  it('check metadata', () => {
    expect(() => metaDataForPage(0, 9, 3)).toThrow(Error('Page number has to be greater than 0'))

    expect(metaDataForPage(1, 9, 3)).toEqual({
      min: 1,
      max: 3,
      page: 1,
      totalCount: 9,
      totalPages: 3,
      previousPage: null,
      nextPage: 2,
    })

    expect(metaDataForPage(2, 9, 3)).toEqual({
      min: 4,
      max: 6,
      page: 2,
      totalCount: 9,
      totalPages: 3,
      previousPage: 1,
      nextPage: 3,
    })

    expect(metaDataForPage(3, 9, 3)).toEqual({
      min: 7,
      max: 9,
      page: 3,
      totalCount: 9,
      totalPages: 3,
      previousPage: 2,
      nextPage: null,
    })

    expect(metaDataForPage(3, 25, 5)).toEqual({
      min: 11,
      max: 15,
      page: 3,
      totalCount: 25,
      totalPages: 5,
      previousPage: 2,
      nextPage: 4,
    })
  })

  it('smaller results than total number of pages', () => {
    expect(metaDataForPage(3, 25, 10)).toEqual({
      min: 21,
      max: 25,
      page: 3,
      totalCount: 25,
      totalPages: 3,
      previousPage: 2,
      nextPage: null,
    })
  })

  it('all pages full', () => {
    expect(metaDataForPage(5, 50, 10)).toEqual({
      min: 41,
      max: 50,
      page: 5,
      totalCount: 50,
      totalPages: 5,
      previousPage: 4,
      nextPage: null,
    })
  })
})

describe('buildPageResponse', () => {
  it('empty response', () => {
    const results = []
    expect(buildPageResponse(results, 1, 3)).toEqual({
      items: [],
      metaData: {
        max: 0,
        min: 0,
        page: 1,
        totalCount: 0,
        totalPages: 0,
      },
    })
  })

  it('does not have total count', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const results = [{ name: 'statement' }] as any
    expect(() => buildPageResponse(results, 1, 3)).toThrowError('Result set does not define a total count')
  })

  it('check response', () => {
    const totalCount = 5
    const results = Array.from(Array(totalCount).keys()).map(n => ({ name: `statement-${n}`, totalCount }))
    expect(buildPageResponse(results, 1, 5)).toEqual({
      items: [
        {
          name: 'statement-0',
        },
        {
          name: 'statement-1',
        },
        {
          name: 'statement-2',
        },
        {
          name: 'statement-3',
        },
        {
          name: 'statement-4',
        },
      ],
      metaData: {
        max: 5,
        min: 1,
        page: 1,
        totalCount: 5,
        totalPages: 1,
        nextPage: null,
        previousPage: null,
      },
    })
  })
})

describe('toPage', () => {
  it('empty response', () => {
    expect(toPage(1, [])).toEqual({
      items: [],
      metaData: {
        max: 0,
        min: 0,
        page: 1,
        totalCount: 0,
        totalPages: 0,
      },
    })
  })

  it('less than 1 page', () => {
    expect(toPage(1, [1, 2], 3)).toEqual({
      items: [1, 2],
      metaData: {
        min: 1,
        max: 2,
        page: 1,
        totalCount: 2,
        totalPages: 1,
        nextPage: null,
        previousPage: null,
      },
    })
  })

  it('full page', () => {
    expect(toPage(1, [1, 2, 3], 3)).toEqual({
      items: [1, 2, 3],
      metaData: {
        min: 1,
        max: 3,
        page: 1,
        totalCount: 3,
        totalPages: 1,
        nextPage: null,
        previousPage: null,
      },
    })
  })

  it('more than full page', () => {
    expect(toPage(1, [1, 2, 3, 4], 3)).toEqual({
      items: [1, 2, 3],
      metaData: {
        min: 1,
        max: 3,
        page: 1,
        totalCount: 4,
        totalPages: 2,
        nextPage: 2,
        previousPage: null,
      },
    })
  })

  it('second page', () => {
    expect(toPage(2, [1, 2, 3, 4, 5], 3)).toEqual({
      items: [4, 5],
      metaData: {
        min: 4,
        max: 5,
        page: 2,
        totalCount: 5,
        totalPages: 2,
        nextPage: null,
        previousPage: 1,
      },
    })
  })

  it('middle page', () => {
    expect(toPage(2, [1, 2, 3, 4, 5, 6, 7, 8], 3)).toEqual({
      items: [4, 5, 6],
      metaData: {
        min: 4,
        max: 6,
        page: 2,
        totalCount: 8,
        totalPages: 3,
        nextPage: 3,
        previousPage: 1,
      },
    })
  })

  it('last page', () => {
    expect(toPage(3, [1, 2, 3, 4, 5, 6, 7, 8], 3)).toEqual({
      items: [7, 8],
      metaData: {
        min: 7,
        max: 8,
        page: 3,
        totalCount: 8,
        totalPages: 3,
        nextPage: null,
        previousPage: 2,
      },
    })
  })

  it('last page full', () => {
    expect(toPage(3, [1, 2, 3, 4, 5, 6, 7, 8, 9], 3)).toEqual({
      items: [7, 8, 9],
      metaData: {
        min: 7,
        max: 9,
        page: 3,
        totalCount: 9,
        totalPages: 3,
        nextPage: null,
        previousPage: 2,
      },
    })
  })
})
