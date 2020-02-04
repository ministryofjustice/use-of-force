const jwt = require('jsonwebtoken')

const authorisationMiddleware = require('./authorisationMiddleware')

const createToken = authorities => {
  const payload = {
    user_name: 'ITAG_USER',
    scope: ['read', 'write'],
    auth_source: 'nomis',
    ...authorities,
    jti: '83b50a10-cca6-41db-985f-e87efb303ddb',
    client_id: 'use-of-force-client',
  }

  const token = jwt.sign(payload, 'secret', { expiresIn: '1h' })
  return token
}

describe('authorisationMiddleware', () => {
  let req
  const next = jest.fn()

  const createResWithToken = authorities => ({
    locals: {
      user: {
        token: createToken(authorities),
      },
    },
  })

  describe('isReviewer', () => {
    test('Should populate isReviewer for reviewer', () => {
      const res = createResWithToken({ authorities: ['ROLE_USE_OF_FORCE_REVIEWER'] })

      authorisationMiddleware(req, res, next)

      expect(res.locals.user.isReviewer).toEqual(true)
    })

    test('Should populate isReviewer for coordinator', () => {
      const res = createResWithToken({ authorities: ['ROLE_USE_OF_FORCE_COORDINATOR'] })

      authorisationMiddleware(req, res, next)

      expect(res.locals.user.isReviewer).toEqual(true)
    })

    test('Should populate isReviewer for standard user', () => {
      const res = createResWithToken({ authorities: [] })

      authorisationMiddleware(req, res, next)

      expect(res.locals.user.isReviewer).toEqual(false)
    })

    test('Should populate isReviewer when no authorities at all', () => {
      const res = createResWithToken()

      authorisationMiddleware(req, res, next)

      expect(res.locals.user.isReviewer).toEqual(false)
    })
  })

  describe('isCoordinator', () => {
    test('Should populate isCoordinator for reviewer', () => {
      const res = createResWithToken({ authorities: ['ROLE_USE_OF_FORCE_REVIEWER'] })

      authorisationMiddleware(req, res, next)

      expect(res.locals.user.isCoordinator).toEqual(false)
    })

    test('Should populate isCoordinator for coordinator', () => {
      const res = createResWithToken({ authorities: ['ROLE_USE_OF_FORCE_COORDINATOR'] })

      authorisationMiddleware(req, res, next)

      expect(res.locals.user.isCoordinator).toEqual(true)
    })

    test('Should populate isCoordinator for standard user', () => {
      const res = createResWithToken({ authorities: [] })

      authorisationMiddleware(req, res, next)

      expect(res.locals.user.isCoordinator).toEqual(false)
    })

    test('Should populate isCoordinator when no authorities at all', () => {
      const res = createResWithToken()

      authorisationMiddleware(req, res, next)

      expect(res.locals.user.isCoordinator).toEqual(false)
    })
  })
})
