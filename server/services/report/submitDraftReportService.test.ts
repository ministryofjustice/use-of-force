import moment from 'moment'
import IncidentClient from '../../data/incidentClient'
import SubmitDraftReportService from './submitDraftReportService'
import { InvolvedStaffService } from '../involvedStaffService'
import { User } from '../../types/uof'

jest.mock('../../data/incidentClient')
jest.mock('../offenderService')
jest.mock('../involvedStaffService')

const incidentClient = new IncidentClient(jest.fn as any, jest.fn() as any) as jest.Mocked<IncidentClient>

const involvedStaffService = new InvolvedStaffService(
  jest.fn as any,
  jest.fn as any,
  jest.fn as any,
  jest.fn as any,
  jest.fn as any
) as jest.Mocked<InvolvedStaffService>

const client = jest.fn()
const inTransaction = fn => fn(client)

const notificationService = {
  sendStatementRequest: jest.fn(),
}

const elite2Client = {
  getOffenderDetails: jest.fn(),
}

const currentUser = { username: 'user1', displayName: 'Bob Smith' } as User

let service: SubmitDraftReportService
let elite2ClientBuilder

beforeEach(() => {
  elite2ClientBuilder = jest.fn()
  elite2ClientBuilder.mockReturnValue(elite2Client)
  service = new SubmitDraftReportService(incidentClient, involvedStaffService, notificationService, inTransaction)
  incidentClient.getCurrentDraftReport.mockResolvedValue({ id: 1, a: 'b', incidentDate: 'today' })
  elite2Client.getOffenderDetails.mockResolvedValue({ offenderNo: 'AA123ABC', agencyId: 'MDI' })
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('submit', () => {
  test('it should save statements and submit the report', async () => {
    involvedStaffService.save.mockResolvedValue([])

    const now = moment('2019-09-06 21:26:18')
    const deadline = moment(now).add(3, 'days')
    const result = await service.submit(currentUser, 1, () => now)

    expect(result).toEqual(1)
    expect(involvedStaffService.save).toBeCalledTimes(1)
    expect(involvedStaffService.save).toBeCalledWith(1, now, deadline, currentUser, client)

    expect(incidentClient.submitReport).toBeCalledTimes(1)
    expect(incidentClient.submitReport).toBeCalledWith(currentUser.username, 1, now.toDate(), client)
  })

  test('it should send statements requests out', async () => {
    involvedStaffService.save.mockResolvedValue([
      { userId: 'USER_1', name: 'June', email: 'user1@example.com', statementId: 1, staffId: 10 },
      { userId: currentUser.username, name: 'Tracy', email: 'user2@example.com', statementId: 2, staffId: 20 },
      { userId: 'USER_3', name: 'Alice', email: 'user3@example.com', statementId: 3, staffId: 30 },
    ])

    const now = moment('2019-09-06 21:26:18')
    const deadline = moment(now).add(3, 'days')
    await service.submit(currentUser, 1, () => now)

    expect(notificationService.sendStatementRequest).toBeCalledTimes(2)
    expect(notificationService.sendStatementRequest.mock.calls).toEqual([
      [
        'user1@example.com',
        {
          incidentDate: 'today',
          involvedName: 'June',
          reporterName: 'Bob Smith',
          overdueDate: deadline,
          submittedDate: now,
        },
        {
          reportId: 1,
          statementId: 1,
        },
      ],
      [
        'user3@example.com',
        {
          incidentDate: 'today',
          involvedName: 'Alice',
          reporterName: 'Bob Smith',
          overdueDate: deadline,
          submittedDate: now,
        },
        {
          reportId: 1,
          statementId: 3,
        },
      ],
    ])
  })
})
