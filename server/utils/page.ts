import assert from 'assert'

const PAGE_SIZE = 20

export type PageMetaData = {
  totalCount: number
  min: number
  max: number
  totalPages: number
  page: number
  previousPage?: number
  nextPage?: number
}

export type HasTotalCount<T> = T & {
  totalCount: number
}

export class PageResponse<T> {
  constructor(
    public readonly metaData: PageMetaData,
    public readonly items: T[]
  ) {}

  map<R>(f: (t: T) => R): PageResponse<R> {
    return new PageResponse(this.metaData, this.items.map(f))
  }
}

export function toPage<T>(page: number, items: T[], pageSize: number = PAGE_SIZE): PageResponse<T> {
  const metaData = metaDataForPage(page, items.length, pageSize)
  return new PageResponse(metaData, items.slice(metaData.min - 1, metaData.max))
}

export type OffsetAndLimit = [number, number]

export function offsetAndLimitForPage(page: number, pageSize: number = PAGE_SIZE): OffsetAndLimit {
  assert(page > 0, 'Page number has to be greater than 0')
  return [(page - 1) * pageSize, pageSize]
}

export function buildPageResponse<T>(
  results: HasTotalCount<T>[],
  page: number,
  pageSize: number = PAGE_SIZE
): PageResponse<T> {
  assert(!results[0] || results[0].totalCount, 'Result set does not define a total count')
  const items = results.map(({ totalCount, ...rest }) => rest as T)
  const totalCount = (results[0] && results[0].totalCount) || 0
  const metaData = metaDataForPage(page, totalCount, pageSize)
  return new PageResponse(metaData, items)
}

export function metaDataForPage(page: number, totalCount: number, pageSize: number = PAGE_SIZE): PageMetaData {
  assert(page > 0, 'Page number has to be greater than 0')
  const zeroBasedPage = page - 1
  if (totalCount === 0) {
    return {
      page,
      totalCount,
      min: 0,
      max: 0,
      totalPages: 0,
    }
  }
  const resultsBeforeNow = zeroBasedPage * pageSize
  return {
    page,
    totalCount,
    min: resultsBeforeNow + 1,
    max: Math.min(totalCount, resultsBeforeNow + pageSize),
    totalPages: Math.ceil(totalCount / pageSize),
    previousPage: page <= 1 ? null : page - 1,
    nextPage: resultsBeforeNow + pageSize >= totalCount ? null : page + 1,
  }
}
