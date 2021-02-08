import { FoundUserResult } from '../../data/authClientBuilder'
import DraftReportClient from '../../data/draftReportClient'
import type { LoggedInUser } from '../../types/uof'
import UserService from '../userService'
import DraftReportService, { AddStaffResult } from './draftReportService'
import SubmitDraftReportService from './submitDraftReportService'
import UpdateDraftReportService from './updateDraftReportService'

jest.mock('../../data/draftReportClient')
jest.mock('../userService')
jest.mock('./submitDraftReportService')
jest.mock('./updateDraftReportService')

const draftReportClient = new DraftReportClient(null, null) as jest.Mocked<DraftReportClient>
const userService = new UserService(null, null) as jest.Mocked<UserService>
const submitDraftReportService = new SubmitDraftReportService(
  null,
  null,
  null,
  null
) as jest.Mocked<SubmitDraftReportService>
const updateDraftReportService = new UpdateDraftReportService(null, null, null) as jest.Mocked<UpdateDraftReportService>

const aUser = username => ({ username } as FoundUserResult)

let service: DraftReportService

beforeEach(() => {
  service = new DraftReportService(
    draftReportClient,
    updateDraftReportService,
    submitDraftReportService,
    userService,
    async username => `${username}-system-token`
  )
  draftReportClient.get.mockResolvedValue({ id: 1, a: 'b', incidentDate: 'today' })
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('getCurrentDraft', () => {
  test('it should call client', async () => {
    const output = await service.getCurrentDraft('user1', 1)
    expect(draftReportClient.get).toBeCalledTimes(1)
    expect(output).toEqual({ id: 1, a: 'b', incidentDate: 'today' })
  })
})

describe('submit', () => {
  const loggedInUser = { username: 'user-1' } as LoggedInUser

  test('when user exists on report', async () => {
    draftReportClient.getInvolvedStaff.mockResolvedValue([{ username: 'user-1' }, { username: 'user-2' }])
    userService.getUsers.mockResolvedValue([aUser('user-1')])

    await service.submit(loggedInUser, 1)

    expect(submitDraftReportService.submit).toBeCalledWith(loggedInUser, 1, [
      { username: 'user-1', isReporter: true },
      { username: 'user-2' },
    ])
  })

  test('when user does not exist on report', async () => {
    draftReportClient.getInvolvedStaff.mockResolvedValue([{ username: 'user-2' }])
    userService.getUsers.mockResolvedValue([aUser('user-1')])

    await service.submit(loggedInUser, 1)

    expect(submitDraftReportService.submit).toBeCalledWith(loggedInUser, 1, [
      { username: 'user-1', isReporter: true },
      { username: 'user-2' },
    ])
  })
})

describe('getInvolvedStaff', () => {
  test('getInvolvedStaff when user exists on report', async () => {
    draftReportClient.getInvolvedStaff.mockResolvedValue([{ username: 'user-1' }, { username: 'user-2' }])
    userService.getUsers.mockResolvedValue([aUser('user-1')])

    await expect(service.getInvolvedStaff('token-1', 'user-1', 1)).resolves.toStrictEqual([
      { username: 'user-1', isReporter: true },
      { username: 'user-2' },
    ])

    expect(userService.getUsers).toBeCalledWith('token-1', ['user-1'])
  })

  test('getInvolvedStaff when user does not exist on report', async () => {
    draftReportClient.getInvolvedStaff.mockResolvedValue([{ username: 'user-2' }])
    userService.getUsers.mockResolvedValue([aUser('user-1')])

    await expect(service.getInvolvedStaff('token-1', 'user-1', 1)).resolves.toStrictEqual([
      { username: 'user-1', isReporter: true },
      { username: 'user-2' },
    ])

    expect(userService.getUsers).toBeCalledWith('token-1', ['user-1'])
  })

  describe('addDraftStaffByName', () => {
    const loggedInUser = { username: 'user-1' } as LoggedInUser

    test('no match', async () => {
      userService.getUsers.mockResolvedValueOnce([aUser('user-1')])
      draftReportClient.getInvolvedStaff.mockResolvedValue([])

      userService.findUsers.mockResolvedValue([])

      await expect(service.addDraftStaffByName(loggedInUser, 2, 'bob', 'smith')).resolves.toStrictEqual(
        AddStaffResult.MISSING
      )

      expect(userService.findUsers).toBeCalledWith('user-1-system-token', 'bob', 'smith')
    })

    test('multiple matches when none added', async () => {
      userService.getUsers.mockResolvedValueOnce([aUser('user-1')])
      draftReportClient.getInvolvedStaff.mockResolvedValue([])

      userService.findUsers.mockResolvedValue([aUser('user-2'), aUser('user-3')])

      await expect(service.addDraftStaffByName(loggedInUser, 2, 'bob', 'smith')).resolves.toStrictEqual(
        AddStaffResult.NO_EXACT_MATCH
      )

      expect(userService.findUsers).toBeCalledWith('user-1-system-token', 'bob', 'smith')
    })

    test('found multiple matches when all but one added', async () => {
      userService.getUsers.mockResolvedValueOnce([aUser('user-1')])
      draftReportClient.getInvolvedStaff.mockResolvedValue([aUser('user-2')])

      userService.findUsers.mockResolvedValue([aUser('user-2'), aUser('user-3')])

      await expect(service.addDraftStaffByName(loggedInUser, 2, 'bob', 'smith')).resolves.toStrictEqual(
        AddStaffResult.SUCCESS
      )

      expect(userService.findUsers).toBeCalledWith('user-1-system-token', 'bob', 'smith')
    })

    test('found multiple matches when all added', async () => {
      userService.getUsers.mockResolvedValueOnce([aUser('user-1')])
      draftReportClient.getInvolvedStaff.mockResolvedValue([aUser('user-2'), aUser('user-3')])

      userService.findUsers.mockResolvedValue([aUser('user-2'), aUser('user-3')])

      await expect(service.addDraftStaffByName(loggedInUser, 2, 'bob', 'smith')).resolves.toStrictEqual(
        AddStaffResult.ALREADY_EXISTS
      )

      expect(userService.findUsers).toBeCalledWith('user-1-system-token', 'bob', 'smith')
    })

    test('staff already exists', async () => {
      userService.findUsers.mockResolvedValueOnce([aUser('user-2')])
      userService.getUsers.mockResolvedValueOnce([aUser('user-1')])

      draftReportClient.getInvolvedStaff.mockResolvedValue([{ username: 'user-2' }])

      await expect(service.addDraftStaffByName(loggedInUser, 2, 'bob', 'smith')).resolves.toStrictEqual(
        AddStaffResult.ALREADY_EXISTS
      )
    })

    test('reporter tries to add themselves', async () => {
      userService.findUsers.mockResolvedValue([aUser('user-1')])
      userService.getUsers.mockResolvedValueOnce([aUser('user-1')])

      draftReportClient.getInvolvedStaff.mockResolvedValue([])

      await expect(service.addDraftStaffByName(loggedInUser, 2, 'bob', 'smith')).resolves.toStrictEqual(
        AddStaffResult.ALREADY_EXISTS
      )
    })

    test('successfully add staff when none other present', async () => {
      userService.findUsers.mockResolvedValueOnce([aUser('user-2')])
      userService.getUsers.mockResolvedValueOnce([aUser('user-1')])

      draftReportClient.getInvolvedStaff.mockResolvedValue([])

      await expect(service.addDraftStaffByName(loggedInUser, 2, 'bob', 'smith')).resolves.toStrictEqual(
        AddStaffResult.SUCCESS
      )

      await expect(updateDraftReportService.process).toBeCalledWith(
        loggedInUser,
        2,
        'involvedStaff',
        [{ username: 'user-2' }],
        undefined
      )
    })

    test('successfully add staff when others are present', async () => {
      userService.findUsers.mockResolvedValueOnce([aUser('user-2')])
      userService.getUsers.mockResolvedValueOnce([aUser('user-1')])
      draftReportClient.getInvolvedStaff.mockResolvedValue([{ username: 'user-3' }])

      await expect(service.addDraftStaffByName(loggedInUser, 2, 'bob', 'smith')).resolves.toStrictEqual(
        AddStaffResult.SUCCESS
      )

      await expect(updateDraftReportService.process).toBeCalledWith(
        loggedInUser,
        2,
        'involvedStaff',
        [{ username: 'user-3' }, { username: 'user-2' }],
        undefined
      )
    })
  })
})
describe('deleteInvolvedStaff', () => {
  const loggedInUser = { username: 'user-1' } as LoggedInUser

  test('delete staff member when only member', async () => {
    userService.getUsers.mockResolvedValueOnce([aUser(loggedInUser.username)])
    draftReportClient.getInvolvedStaff.mockResolvedValue([{ username: 'user-2' }])

    await service.deleteInvolvedStaff(loggedInUser, 2, 'user-2')

    await expect(updateDraftReportService.process).toBeCalledWith(loggedInUser, 2, 'involvedStaff', [], undefined)
    expect(userService.getUsers).toBeCalledWith('user-1-system-token', ['user-1'])
  })

  test('delete staff member when multiple members', async () => {
    userService.getUsers.mockResolvedValueOnce([aUser(loggedInUser.username)])
    draftReportClient.getInvolvedStaff.mockResolvedValue([{ username: 'user-2' }, { username: 'user-3' }])

    await service.deleteInvolvedStaff(loggedInUser, 2, 'user-2')

    await expect(updateDraftReportService.process).toBeCalledWith(
      loggedInUser,
      2,
      'involvedStaff',
      [{ username: 'user-3' }],
      undefined
    )
    expect(userService.getUsers).toBeCalledWith('user-1-system-token', ['user-1'])
  })

  test('attempt to delete the reporter', async () => {
    userService.getUsers.mockResolvedValueOnce([aUser(loggedInUser.username)])
    draftReportClient.getInvolvedStaff.mockResolvedValue([{ username: 'user-2' }, { username: 'user-3' }])

    await service.deleteInvolvedStaff(loggedInUser, 2, 'user-1')

    await expect(updateDraftReportService.process).toBeCalledWith(
      loggedInUser,
      2,
      'involvedStaff',
      [{ username: 'user-2' }, { username: 'user-3' }],
      undefined
    )
    expect(userService.getUsers).toBeCalledWith('user-1-system-token', ['user-1'])
  })
})

describe('markInvolvedStaffComplete', () => {
  const loggedInUser = { username: 'user-1' } as LoggedInUser

  it('Mark complete', async () => {
    draftReportClient.get.mockResolvedValue({ form: {} })

    await service.markInvolvedStaffComplete(loggedInUser, 1)

    expect(draftReportClient.get).toBeCalledWith('user-1', 1)
    expect(updateDraftReportService.process).toBeCalledWith(loggedInUser, 1, 'involvedStaff', [], undefined)
  })

  it('Do not mark complete if staff already added', async () => {
    draftReportClient.get.mockResolvedValue({ form: { involvedStaff: [] } })

    await service.markInvolvedStaffComplete(loggedInUser, 1)

    expect(draftReportClient.get).toBeCalledWith('user-1', 1)
    expect(updateDraftReportService.process).not.toBeCalled()
  })
})
