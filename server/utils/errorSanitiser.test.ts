import sanitiseError from './errorSanitiser'

describe('sanitise error', () => {
  it('it should omit the request headers from the error object ', () => {
    const error = {
      status: 404,
      response: {
        req: {
          method: 'GET',
          url: 'https://test-api/endpoint?active=true',
          headers: {
            property: 'not for logging',
          },
        },
        headers: {
          date: 'Tue, 19 May 2020 15:16:20 GMT',
        },
        status: 404,
        statusText: 'Not found',
        body: { content: 'hello' },
      },
      message: 'Not Found',
      stack: 'stack description',
    }

    expect(sanitiseError(error)).toEqual({
      headers: { date: 'Tue, 19 May 2020 15:16:20 GMT' },
      message: 'Not Found',
      stack: 'stack description',
      status: 404,
      statusText: 'Not found',
      data: { content: 'hello' },
    })
  })

  it('it should return the error message ', () => {
    const error = {
      message: 'error description',
    }
    expect(sanitiseError(error)).toEqual({
      message: 'error description',
    })
  })

  it('it should return an empty object for an unknown error structure', () => {
    const error = {
      property: 'unknown',
    }
    expect(sanitiseError(error)).toEqual({})
  })
})
