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

    test('will reject admin role access', () => {
      const res = createRes({ isAdmin: true })

      expect(() => roleCheck.coordinatorOnly(req, res, next)).toThrow(Error('Not authorised to access this resource'))
    })
  })

  describe('reviewerOrCoordinatorOnly', () => {
    test('will reject no specific role access', () => {
      const res = createRes({})

      expect(() => roleCheck.reviewerOrCoordinatorOnly(req, res, next)).toThrow(
        Error('Not authorised to access this resource')
      )
    })

    test('will accept reviewer access', () => {
      const res = createRes({ isReviewer: true })

      roleCheck.reviewerOrCoordinatorOnly(req, res, next)

      expect(next).toBeCalled()
    })

    test('will accept coordinator access', () => {
      const res = createRes({ isCoordinator: true })

      roleCheck.reviewerOrCoordinatorOnly(req, res, next)

      expect(next).toBeCalled()
    })

    test('will reject admin role access', () => {
      const res = createRes({ isAdmin: true })

      expect(() => roleCheck.reviewerOrCoordinatorOnly(req, res, next)).toThrow(
        Error('Not authorised to access this resource')
      )
    })
  })

  describe('adminOnly', () => {
    test('will reject no specific role access', () => {
      const res = createRes({})

      expect(() => roleCheck.adminOnly(req, res, next)).toThrow(Error('Not authorised to access this resource'))
    })

    test('will reject reviewer access', () => {
      const res = createRes({ isReviewer: true })

      expect(() => roleCheck.adminOnly(req, res, next)).toThrow(Error('Not authorised to access this resource'))
    })

    test('will reject coordinator access', () => {
      const res = createRes({ isCoordinator: true })

      expect(() => roleCheck.adminOnly(req, res, next)).toThrow(Error('Not authorised to access this resource'))
    })

    test('will accept admin access', () => {
      const res = createRes({ isAdmin: true })

      roleCheck.adminOnly(req, res, next)

      expect(next).toBeCalled()
    })
  })
})
