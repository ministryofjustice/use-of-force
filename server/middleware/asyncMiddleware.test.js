const asyncMiddleware = require('./asyncMiddleware')

describe('asyncMiddleware', () => {
  it('calls the handler and not next on success', async () => {
    const req = {}
    const res = {}
    const next = jest.fn()
    const fn = jest.fn().mockResolvedValue('ok')
    await asyncMiddleware(fn)(req, res, next)
    expect(fn).toHaveBeenCalledWith(req, res, next)
    expect(next).not.toHaveBeenCalledWith(expect.any(Error))
  })

  it('calls next with error if handler throws', async () => {
    const req = {}
    const res = {}
    const next = jest.fn()
    const error = new Error('fail')
    const fn = jest.fn().mockRejectedValue(error)
    await asyncMiddleware(fn)(req, res, next)
    expect(next).toHaveBeenCalledWith(error)
  })

  it('calls next if fn is not a function', () => {
    const req = {}
    const res = {}
    const next = jest.fn()
    asyncMiddleware(null)(req, res, next)
    expect(next).toHaveBeenCalled()
  })
})
