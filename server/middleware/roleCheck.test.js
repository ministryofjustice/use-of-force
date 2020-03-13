const roleCheck = require('./roleCheck')

describe('roleCheck', () => {
  let req
  const next = jest.fn()

  const createRes = flag => ({
    locals: {
      user: {
        ...flag,
      },
    },
  })

  describe('coordinatorOnly', () => {
    test('will reject no specific role access', () => {
      const res = createRes({})

      expect(() => roleCheck.coordinatorOnly(req, res, next)).toThrow(Error('Not authorised to access this resource'))
    })

    test('will reject reviewer access', () => {
      const res = createRes({ isReviewer: true })

      expect(() => roleCheck.coordinatorOnly(req, res, next)).toThrow(Error('Not authorised to access this resource'))
    })

    test('will accept coordinator access', () => {
      const res = createRes({ isCoordinator: true })

      roleCheck.coordinatorOnly(req, res, next)

      expect(next).toBeCalled()
    })
  })

  describe('reviewerOrCoordinatorOnly', () => {
    test('will reject no specific role access', () => {
      const res = createRes({})

      expect(() => roleCheck.reviewerOrCoordinatorOnly(req, res, next)).toThrow(
        Error('Not authorised to access this resource')
      )
    })

    test('will reject reviewer access', () => {
      const res = createRes({ isReviewer: true })

      roleCheck.reviewerOrCoordinatorOnly(req, res, next)

      expect(next).toBeCalled()
    })

    test('will accept coordinator access', () => {
      const res = createRes({ isCoordinator: true })

      roleCheck.reviewerOrCoordinatorOnly(req, res, next)

      expect(next).toBeCalled()
    })
  })
})
