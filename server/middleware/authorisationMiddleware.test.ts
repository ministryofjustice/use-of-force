import { Response } from 'express'
import jwt from 'jsonwebtoken'

import authorisationMiddleware, { ADMIN, COORDINATOR, REVIEWER } from './authorisationMiddleware'

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

  const createResWithToken = (authorities?: { authorities: string[] }): Response =>
    (({
      locals: {
        user: {
          token: createToken(authorities),
        },
      },
    } as unknown) as Response)

  describe('isReviewer', () => {
    test('Should populate isReviewer for reviewer', () => {
      const res = createResWithToken({ authorities: [REVIEWER] })

      authorisationMiddleware(req, res, next)

      expect(res.locals.user.isReviewer).toEqual(true)
    })

    test('Should populate isReviewer for coordinator', () => {
      const res = createResWithToken({ authorities: [COORDINATOR] })

      authorisationMiddleware(req, res, next)

      expect(res.locals.user.isReviewer).toEqual(true)
    })

    test('Should populate isReviewer for admin', () => {
      const res = createResWithToken({ authorities: [ADMIN] })

      authorisationMiddleware(req, res, next)

      expect(res.locals.user.isReviewer).toEqual(false)
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
      const res = createResWithToken({ authorities: [REVIEWER] })

      authorisationMiddleware(req, res, next)

      expect(res.locals.user.isCoordinator).toEqual(false)
    })

    test('Should populate isCoordinator for coordinator', () => {
      const res = createResWithToken({ authorities: [COORDINATOR] })

      authorisationMiddleware(req, res, next)

      expect(res.locals.user.isCoordinator).toEqual(true)
    })

    test('Should populate isCoordinator for admin', () => {
      const res = createResWithToken({ authorities: [ADMIN] })

      authorisationMiddleware(req, res, next)

      expect(res.locals.user.isCoordinator).toEqual(false)
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

  describe('isAdmin', () => {
    test('Should populate isAdmin for reviewer', () => {
      const res = createResWithToken({ authorities: [REVIEWER] })

      authorisationMiddleware(req, res, next)

      expect(res.locals.user.isAdmin).toEqual(false)
    })

    test('Should populate isAdmin for coordinator', () => {
      const res = createResWithToken({ authorities: [COORDINATOR] })

      authorisationMiddleware(req, res, next)

      expect(res.locals.user.isAdmin).toEqual(false)
    })

    test('Should populate isAdmin for admin', () => {
      const res = createResWithToken({ authorities: [ADMIN] })

      authorisationMiddleware(req, res, next)

      expect(res.locals.user.isAdmin).toEqual(true)
    })

    test('Should populate isAdmin for standard user', () => {
      const res = createResWithToken({ authorities: [] })

      authorisationMiddleware(req, res, next)

      expect(res.locals.user.isAdmin).toEqual(false)
    })

    test('Should populate isAdmin when no authorities at all', () => {
      const res = createResWithToken()

      authorisationMiddleware(req, res, next)

      expect(res.locals.user.isAdmin).toEqual(false)
    })
  })
})
