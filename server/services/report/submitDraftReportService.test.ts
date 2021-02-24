import moment from 'moment'
import DraftReportClient from '../../data/draftReportClient'
import SubmitDraftReportService from './submitDraftReportService'
import { LoggedInUser } from '../../types/uof'
import StatementsClient from '../../data/statementsClient'
import { DraftInvolvedStaff } from './draftInvolvedStaffService'

jest.mock('../../data/draftReportClient')
jest.mock('../../data/statementsClient')
jest.mock('../offenderService')
jest.mock('../involvedStaffService')

const draftReportClient = new DraftReportClient(null, null) as jest.Mocked<DraftReportClient>

const statementsClient = new StatementsClient(null) as jest.Mocked<StatementsClient>

const client = jest.fn()
const inTransaction = fn => fn(client)

const notificationService = {
  sendStatementRequest: jest.fn(),
}

const elite2Client = {
  getOffenderDetails: jest.fn(),
}

const currentUser = { username: 'user1', displayName: 'Bob Smith' } as LoggedInUser

let service: SubmitDraftReportService
let elite2ClientBuilder

beforeEach(() => {
  elite2ClientBuilder = jest.fn()
  elite2ClientBuilder.mockReturnValue(elite2Client)
  service = new SubmitDraftReportService(draftReportClient, statementsClient, notificationService, inTransaction)
  draftReportClient.get.mockResolvedValue({ id: 1, a: 'b', incidentDate: new Date() })
  elite2Client.getOffenderDetails.mockResolvedValue({ offenderNo: 'AA123ABC', agencyId: 'MDI' })
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('submit', () => {
  test('it should save statements and submit the report', async () => {
    statementsClient.createStatements.mockResolvedValue({})

    const now = moment('2019-09-06 21:26:18')
    const staff = [{ username: 'user-1', staffId: 1 } as DraftInvolvedStaff]
    const result = await service.submit(currentUser, 2, staff, () => now)

    expect(result).toEqual(1)
    expect(statementsClient.createStatements).toBeCalledTimes(1)
    expect(statementsClient.createStatements).toBeCalledWith(
      1,
      moment(now).add(1, 'day').toDate(),
      moment(now).add(3, 'days').toDate(),
      staff,
      client
    )

    expect(draftReportClient.submit).toBeCalledTimes(1)
    expect(draftReportClient.submit).toBeCalledWith(currentUser.username, 2, now.toDate(), client)
  })

  test('it should send statements requests out', async () => {
    const now = moment('2019-09-06 21:26:18')
    const incidentDate = moment(now).subtract(1, 'days')
    const deadline = moment(now).add(3, 'days')

    draftReportClient.get.mockResolvedValue({ id: 1, agencyId: 'MDI', incidentDate: incidentDate.toDate() })
    const user1 = { username: 'USER_1', name: 'June', email: 'user1@example.com', staffId: 10 }
    const user2 = {
      username: currentUser.username,
      name: 'Tracy',
      email: 'user2@example.com',
      staffId: 20,
      isReporter: true,
    }
    const user3 = { username: 'USER_3', name: 'Alice', email: 'user3@example.com', statementId: 3, staffId: 30 }

    statementsClient.createStatements.mockResolvedValue({ USER_1: 1, [currentUser.username]: 2, USER_3: 3 })

    await service.submit(currentUser, 1, [user1, user2, user3], () => now)

    expect(notificationService.sendStatementRequest).toBeCalledTimes(2)
    expect(notificationService.sendStatementRequest.mock.calls).toEqual([
      [
        'user1@example.com',
        {
          incidentDate: incidentDate.toDate(),
          involvedName: 'June',
          reporterName: 'Bob Smith',
          overdueDate: deadline.toDate(),
          submittedDate: now.toDate(),
        },
        {
          reportId: 1,
          statementId: 1,
        },
      ],
      [
        'user3@example.com',
        {
          incidentDate: incidentDate.toDate(),
          involvedName: 'Alice',
          reporterName: 'Bob Smith',
          overdueDate: deadline.toDate(),
          submittedDate: now.toDate(),
        },
        {
          reportId: 1,
          statementId: 3,
        },
      ],
    ])
  })
})
