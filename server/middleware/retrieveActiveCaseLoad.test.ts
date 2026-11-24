import retrieveActiveCaseLoad from './retrieveActiveCaseLoad'
import UserService from '../services/userService'
import logger from '../../log'

jest.mock('../services/userService')
jest.mock('../../log')

const userService = new UserService(null, null) as jest.Mocked<UserService>

describe('retrieveActiveCaseLoad', () => {
  let req
  let res
  const next = jest.fn()

  beforeEach(() => {
    jest.resetAllMocks()
    req = { session: {} }
    res = { locals: { user: { username: 'jouser', token: 'token-1', authSource: 'nomis' } } }
  })

  test('Should use the caseload held in the session without calling Manage Users', async () => {
    req.session.activeCaseLoadId = 'LEI'

    await retrieveActiveCaseLoad(userService)(req, res, next)

    expect(res.locals.user.activeCaseLoadId).toEqual('LEI')
    expect(userService.getActiveCaseLoadId).not.toHaveBeenCalled()
    expect(next).toHaveBeenCalled()
  })

  test('Should ask Manage Users when the session has no caseload, and keep the answer', async () => {
    userService.getActiveCaseLoadId.mockResolvedValue('MDI')

    await retrieveActiveCaseLoad(userService)(req, res, next)

    expect(userService.getActiveCaseLoadId).toHaveBeenCalledWith('token-1')
    expect(req.session.activeCaseLoadId).toEqual('MDI')
    expect(res.locals.user.activeCaseLoadId).toEqual('MDI')
    expect(next).toHaveBeenCalled()
  })

  test('Should not ask Manage Users for users who are not NOMIS users', async () => {
    res.locals.user.authSource = 'auth'

    await retrieveActiveCaseLoad(userService)(req, res, next)

    expect(userService.getActiveCaseLoadId).not.toHaveBeenCalled()
    expect(res.locals.user.activeCaseLoadId).toBeUndefined()
    expect(next).toHaveBeenCalled()
  })

  test('Should log and carry on if Manage Users fails', async () => {
    const error = new Error('boom')
    userService.getActiveCaseLoadId.mockRejectedValue(error)

    await retrieveActiveCaseLoad(userService)(req, res, next)

    expect(logger.error).toHaveBeenCalledWith(error, 'Failed to retrieve active caseload for: jouser')
    expect(res.locals.user.activeCaseLoadId).toBeUndefined()
    expect(next).toHaveBeenCalled()
  })

  test('Should do nothing when there is no user', async () => {
    res.locals = {}

    await retrieveActiveCaseLoad(userService)(req, res, next)

    expect(userService.getActiveCaseLoadId).not.toHaveBeenCalled()
    expect(next).toHaveBeenCalled()
  })
})
