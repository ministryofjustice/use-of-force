import { DraftReportClient } from '../../data'
import type { LoggedInUser, FoundUserResult } from '../../types/uof'
import UserService from '../userService'
import { DraftInvolvedStaffService } from './draftInvolvedStaffService'
import DraftReportService, { AddStaffResult } from './draftReportService'
import SubmitDraftReportService from './submitDraftReportService'
import UpdateDraftReportService from './updateDraftReportService'
import { isReportComplete } from './reportStatusChecker'

jest.mock('./reportStatusChecker')
jest.mock('../../data')
jest.mock('../userService')
jest.mock('./draftInvolvedStaffService')
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
const updateDraftReportService = new UpdateDraftReportService(
  null,
  null,
  null,
  null,
  null,
  null
) as jest.Mocked<UpdateDraftReportService>
const draftInvolvedStaffService = new DraftInvolvedStaffService(
  null,
  null,
  null,
  null
) as jest.Mocked<DraftInvolvedStaffService>

const aUser = username => ({ username } as FoundUserResult)
const isReportCompleteMock = isReportComplete as jest.Mock

let service: DraftReportService

beforeEach(() => {
  service = new DraftReportService(
    draftReportClient,
    draftInvolvedStaffService,
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

describe('getUoFReasonState', () => {
  test('it should call client', async () => {
    draftReportClient.get.mockResolvedValue({})
    await service.getUoFReasonState('user1', 1)
    expect(draftReportClient.get).toHaveBeenCalledWith('user1', 1)
  })

  test('it should return when present', async () => {
    isReportCompleteMock.mockReturnValue(false)
    const reasonsForUseOfForce = {
      reasons: [
        'ASSAULT_ON_ANOTHER_PRISONER',
        'ASSAULT_ON_A_MEMBER_OF_STAFF',
        'TO_PREVENT_HARM_ASSAULT_OR_HARM_TO_OTHERS',
        'TO_ADMINISTER_CARE_OR_DUE_TO_THE_MENTAL_CAPACITY_ACT_2005',
        'HOSTAGE_NTRG',
      ],
      primaryReason: ['HOSTAGE_NTRG'],
    }

    draftReportClient.get.mockResolvedValue({ form: { reasonsForUseOfForce } })
    const result = await service.getUoFReasonState('user1', 1)
    expect(result).toStrictEqual({ isComplete: false, ...reasonsForUseOfForce })
  })

  test('it should handle when absent', async () => {
    isReportCompleteMock.mockReturnValue(false)
    draftReportClient.get.mockResolvedValue({ form: {} })
    const result = await service.getUoFReasonState('user1', 1)
    expect(result).toStrictEqual({ isComplete: false, primaryReason: undefined, reasons: [] })
  })

  test('when form is complete', async () => {
    isReportCompleteMock.mockReturnValue(true)
    draftReportClient.get.mockResolvedValue({ form: {} })
    const result = await service.getUoFReasonState('user1', 1)
    expect(result).toStrictEqual({ isComplete: true, primaryReason: undefined, reasons: [] })
  })
})

describe('submit', () => {
  const loggedInUser = { username: 'user-1' } as LoggedInUser

  test('success', async () => {
    draftInvolvedStaffService.getInvolvedStaff.mockResolvedValue([{ username: 'user-1' }, { username: 'user-2' }])

    await service.submit(loggedInUser, 1)

    expect(submitDraftReportService.submit).toBeCalledWith(loggedInUser, 1, [
      { username: 'user-1' },
      { username: 'user-2' },
    ])
  })
})

describe('getInvolvedStaff', () => {
  test('success', async () => {
    draftInvolvedStaffService.getInvolvedStaff.mockResolvedValue([{ username: 'user-2' }])

    await expect(service.getInvolvedStaff('token-1', 'user-1', 1)).resolves.toStrictEqual([{ username: 'user-2' }])

    expect(draftInvolvedStaffService.getInvolvedStaff).toBeCalledWith('token-1', 'user-1', 1)
  })

  describe('addDraftStaffByName', () => {
    const loggedInUser = { username: 'user-1' } as LoggedInUser

    test('no match', async () => {
      draftInvolvedStaffService.getInvolvedStaff.mockResolvedValue([])

      userService.findUsers.mockResolvedValue([])

      await expect(service.addDraftStaffByName(loggedInUser, 2, 'bob', 'smith')).resolves.toStrictEqual(
        AddStaffResult.MISSING
      )

      expect(userService.findUsers).toBeCalledWith('user-1-system-token', 'bob', 'smith')
    })

    test('multiple matches when none added', async () => {
      draftInvolvedStaffService.getInvolvedStaff.mockResolvedValue([])

      userService.findUsers.mockResolvedValue([aUser('user-2'), aUser('user-3')])

      await expect(service.addDraftStaffByName(loggedInUser, 2, 'bob', 'smith')).resolves.toStrictEqual(
        AddStaffResult.NO_EXACT_MATCH
      )

      expect(userService.findUsers).toBeCalledWith('user-1-system-token', 'bob', 'smith')
    })

    test('found multiple matches when all but one added', async () => {
      userService.getUsers.mockResolvedValueOnce([aUser('user-1')])
      draftInvolvedStaffService.getInvolvedStaff.mockResolvedValue([aUser('user-2')])

      userService.findUsers.mockResolvedValue([aUser('user-2'), aUser('user-3')])

      await expect(service.addDraftStaffByName(loggedInUser, 2, 'bob', 'smith')).resolves.toStrictEqual(
        AddStaffResult.SUCCESS
      )

      expect(userService.findUsers).toBeCalledWith('user-1-system-token', 'bob', 'smith')
    })

    test('found multiple matches when all added', async () => {
      draftInvolvedStaffService.getInvolvedStaff.mockResolvedValue([aUser('user-2'), aUser('user-3')])

      userService.findUsers.mockResolvedValue([aUser('user-2'), aUser('user-3')])

      await expect(service.addDraftStaffByName(loggedInUser, 2, 'bob', 'smith')).resolves.toStrictEqual(
        AddStaffResult.ALREADY_EXISTS
      )

      expect(userService.findUsers).toBeCalledWith('user-1-system-token', 'bob', 'smith')
    })

    test('staff already exists', async () => {
      userService.findUsers.mockResolvedValueOnce([aUser('user-2')])

      draftInvolvedStaffService.getInvolvedStaff.mockResolvedValue([{ username: 'user-2' }])

      await expect(service.addDraftStaffByName(loggedInUser, 2, 'bob', 'smith')).resolves.toStrictEqual(
        AddStaffResult.ALREADY_EXISTS
      )
    })

    test('reporter tries to add themselves', async () => {
      userService.findUsers.mockResolvedValue([aUser('user-1')])

      draftInvolvedStaffService.getInvolvedStaff.mockResolvedValue([aUser('user-1')])

      await expect(service.addDraftStaffByName(loggedInUser, 2, 'bob', 'smith')).resolves.toStrictEqual(
        AddStaffResult.ALREADY_EXISTS
      )
    })

    test('successfully add staff when none other present', async () => {
      userService.findUsers.mockResolvedValueOnce([aUser('user-2')])
      userService.getUsers.mockResolvedValueOnce([aUser('user-1')])

      draftInvolvedStaffService.getInvolvedStaff.mockResolvedValue([])

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
      draftInvolvedStaffService.getInvolvedStaff.mockResolvedValue([{ username: 'user-3' }])

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
    draftInvolvedStaffService.getInvolvedStaff.mockResolvedValue([{ username: 'user-2' }])

    await service.deleteInvolvedStaff(loggedInUser, 2, 'user-2')

    await expect(updateDraftReportService.process).toBeCalledWith(loggedInUser, 2, 'involvedStaff', [], undefined)
    expect(draftInvolvedStaffService.getInvolvedStaff).toBeCalledWith('user-1-system-token', 'user-1', 2)
  })

  test('delete staff member when multiple members', async () => {
    draftInvolvedStaffService.getInvolvedStaff.mockResolvedValue([{ username: 'user-2' }, { username: 'user-3' }])

    await service.deleteInvolvedStaff(loggedInUser, 2, 'user-2')

    await expect(updateDraftReportService.process).toBeCalledWith(
      loggedInUser,
      2,
      'involvedStaff',
      [{ username: 'user-3' }],
      undefined
    )
    expect(draftInvolvedStaffService.getInvolvedStaff).toBeCalledWith('user-1-system-token', 'user-1', 2)
  })

  test('attempt to delete the reporter', async () => {
    draftInvolvedStaffService.getInvolvedStaff.mockResolvedValue([{ username: 'user-2' }, { username: 'user-3' }])

    await service.deleteInvolvedStaff(loggedInUser, 2, 'user-1')

    await expect(updateDraftReportService.process).toBeCalledWith(
      loggedInUser,
      2,
      'involvedStaff',
      [{ username: 'user-2' }, { username: 'user-3' }],
      undefined
    )
    expect(draftInvolvedStaffService.getInvolvedStaff).toBeCalledWith('user-1-system-token', 'user-1', 2)
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
