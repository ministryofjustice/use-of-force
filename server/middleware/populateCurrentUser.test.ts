import { Request, Response } from 'express'
import populateCurrentUser from './populateCurrentUser'
import UserService from '../services/userService'
import { CaseLoad, UserDetail } from '../data/prisonClientTypes'
import logger from '../../log'

jest.mock('../services/userService')
jest.mock('../../log')

const userService = new UserService(null, null) as jest.Mocked<UserService>

describe('populateCurrentUser', () => {
  let res
  let req
  const next = jest.fn()

  beforeEach(() => {
    jest.resetAllMocks()
    res = { locals: {} } as Response
    req = { baseUrl: '/', path: '', hostname: 'localhost' } as Request
  })

  test('Should add hostname and currentUrlPath to res.locals', async () => {
    await populateCurrentUser(userService)(req, res, next)

    expect(res.locals.hostname).toStrictEqual('localhost')
    expect(res.locals.currentUrlPath).toStrictEqual('/')
  })

  test('Should stash prison user data into res.locals', async () => {
    res = { locals: { user: { token: 'token-1' } } }
    const user = {
      staffId: 3,
      username: 'jouser',
      firstName: 'Jo',
      lastName: 'Smith',
      activeCaseLoadId: '2',
    } as UserDetail

    userService.getSelf.mockResolvedValue({
      ...user,
      displayName: 'Jo Smith',
      displayNameInitial: 'J. Smith',
      activeCaseLoad: { caseLoadId: '2', description: 'Leeds' } as CaseLoad,
    })
    await populateCurrentUser(userService)(req, res, next)

    expect(userService.getSelf).toHaveBeenCalledWith(res.locals.user.token)
    expect(res.locals.user).toEqual({
      staffId: 3,
      username: 'jouser',
      firstName: 'Jo',
      lastName: 'Smith',
      activeCaseLoadId: '2',
      displayName: 'Jo Smith',
      displayNameInitial: 'J. Smith',
      activeCaseLoad: { caseLoadId: '2', description: 'Leeds' },
      token: 'token-1',
    })
  })

  test('Should log info if prison user not present', async () => {
    res = {
      locals: {
        user: {
          staffId: 3,
          username: 'jouser',
          firstName: 'Jo',
          lastName: 'Smith',
        },
      },
    }

    userService.getSelf.mockResolvedValue(null)
    await populateCurrentUser(userService)(req, res, next)

    expect(logger.info).toHaveBeenCalledWith('No user available')
  })

  test('Should log any errors present', async () => {
    res = {
      locals: {
        user: {
          staffId: 3,
          username: 'jouser',
          firstName: 'Jo',
          lastName: 'Smith',
        },
      },
    }
    const error = new Error('error message')

    userService.getSelf.mockRejectedValue(error)
    await populateCurrentUser(userService)(req, res, next)

    expect(logger.error).toHaveBeenCalledWith(error, `Failed to retrieve user for: ${res.locals.user}`)
  })
})
