import { Request, Response } from 'express'
import jwt from 'jsonwebtoken'
import populateCurrentUser from './populateCurrentUser'
import logger from '../../log'

jest.mock('../../log')

describe('populateCurrentUser', () => {
  let res
  let req
  const next = jest.fn()

  beforeEach(() => {
    jest.resetAllMocks()
    res = { locals: {} } as Response
    req = { baseUrl: '/', path: '', hostname: 'localhost' } as Request
  })

  test('Should add hostname and currentUrlPath to res.locals', () => {
    populateCurrentUser()(req, res, next)

    expect(res.locals.hostname).toStrictEqual('localhost')
    expect(res.locals.currentUrlPath).toStrictEqual('/')
    expect(next).toHaveBeenCalled()
  })

  test('Should add the user details from the token', () => {
    const token = jwt.sign(
      {
        name: 'JO SMITH-JONES',
        user_id: '3',
        user_uuid: '11111111-1111-1111-1111-111111111111',
        auth_source: 'nomis',
      },
      'secret',
    )
    res = { locals: { user: { username: 'jouser', token } } }

    populateCurrentUser()(req, res, next)

    expect(res.locals.user).toEqual({
      displayName: 'Jo Smith-Jones',
      userId: '3',
      userUuid: '11111111-1111-1111-1111-111111111111',
      authSource: 'nomis',
      username: 'jouser',
      token,
    })
    expect(next).toHaveBeenCalled()
  })

  test('Should not overwrite values already on the user', () => {
    const token = jwt.sign({ name: 'Jo Smith', user_id: '3' }, 'secret')
    res = { locals: { user: { username: 'jouser', token, userId: 'existing' } } }

    populateCurrentUser()(req, res, next)

    expect(res.locals.user.userId).toEqual('existing')
    expect(res.locals.user.displayName).toEqual('Jo Smith')
  })

  test('Should cope with a token that cannot be decoded', () => {
    res = { locals: { user: { username: 'jouser', token: 'not-a-jwt' } } }

    populateCurrentUser()(req, res, next)

    expect(res.locals.user).toEqual({
      displayName: '',
      userId: undefined,
      userUuid: undefined,
      authSource: undefined,
      username: 'jouser',
      token: 'not-a-jwt',
    })
    expect(next).toHaveBeenCalled()
  })

  test('Should log info if user not present', () => {
    populateCurrentUser()(req, res, next)

    expect(logger.info).toHaveBeenCalledWith('No user available')
    expect(next).toHaveBeenCalled()
  })
})
