import setUserActiveCaseLoadId from './setUserActiveCaseLoadId'
import UserService from '../services/userService'
import logger from '../../log'

jest.mock('../services/userService')
jest.mock('../../log')

const userService = new UserService(null, null) as jest.Mocked<UserService>

describe('setUserActiveCaseLoadId', () => {
  let req
  let res
  const next = jest.fn()

  beforeEach(() => {
    jest.resetAllMocks()
    req = { session: {} }
    res = { locals: { user: { username: 'jouser', token: 'token-1', authSource: 'nomis' } } }
  })

  test('uses the caseload held in the session without looking it up', async () => {
    req.session.activeCaseLoadId = 'LEI'

    await setUserActiveCaseLoadId(userService)(req, res, next)

    expect(res.locals.user.activeCaseLoadId).toEqual('LEI')
    expect(userService.getActiveCaseLoadId).not.toHaveBeenCalled()
    expect(next).toHaveBeenCalled()
  })

  test('looks up the caseload when the session has none, and keeps it in the session', async () => {
    userService.getActiveCaseLoadId.mockResolvedValue('MDI')

    await setUserActiveCaseLoadId(userService)(req, res, next)

    expect(userService.getActiveCaseLoadId).toHaveBeenCalledWith('token-1')
    expect(req.session.activeCaseLoadId).toEqual('MDI')
    expect(res.locals.user.activeCaseLoadId).toEqual('MDI')
    expect(next).toHaveBeenCalled()
  })

  test('does not look up the caseload for users who are not NOMIS users', async () => {
    res.locals.user.authSource = 'auth'

    await setUserActiveCaseLoadId(userService)(req, res, next)

    expect(userService.getActiveCaseLoadId).not.toHaveBeenCalled()
    expect(res.locals.user.activeCaseLoadId).toBeUndefined()
    expect(next).toHaveBeenCalled()
  })

  test('logs and carries on if the lookup fails', async () => {
    const error = new Error('boom')
    userService.getActiveCaseLoadId.mockRejectedValue(error)

    await setUserActiveCaseLoadId(userService)(req, res, next)

    expect(logger.error).toHaveBeenCalledWith(error, 'Failed to retrieve active caseload for: jouser')
    expect(res.locals.user.activeCaseLoadId).toBeUndefined()
    expect(next).toHaveBeenCalled()
  })

  test('does nothing when there is no user', async () => {
    res.locals = {}

    await setUserActiveCaseLoadId(userService)(req, res, next)

    expect(userService.getActiveCaseLoadId).not.toHaveBeenCalled()
    expect(next).toHaveBeenCalled()
  })
})
