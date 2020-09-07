import moment from 'moment'
import IncidentClient from '../data/incidentClient'
import ReportService from './reportService'
import OffenderService from './offenderService'
import { PageResponse } from '../utils/page'
import { InvolvedStaffService } from './involvedStaffService'

jest.mock('../data/incidentClient')
jest.mock('./offenderService')
jest.mock('./involvedStaffService')

const incidentClient = new IncidentClient(jest.fn as any, jest.fn() as any) as jest.Mocked<IncidentClient>

const offenderService = new OffenderService(jest.fn as any) as jest.Mocked<OffenderService>

const involvedStaffService = new InvolvedStaffService(
  jest.fn as any,
  jest.fn as any,
  jest.fn as any,
  jest.fn as any,
  jest.fn as any
) as jest.Mocked<InvolvedStaffService>

const client = 'client-1'
const inTransaction = fn => fn(client)

const notificationService = {
  sendStatementRequest: jest.fn(),
}

const elite2Client = {
  getOffenderDetails: jest.fn(),
}

const currentUser = { username: 'user1', displayName: 'Bob Smith' }

let service: ReportService
let elite2ClientBuilder

beforeEach(() => {
  elite2ClientBuilder = jest.fn()
  elite2ClientBuilder.mockReturnValue(elite2Client)
  const systemToken = jest.fn().mockResolvedValue('system-token-1')
  service = new ReportService(
    incidentClient,
    elite2ClientBuilder,
    involvedStaffService,
    notificationService,
    offenderService,
    inTransaction,
    systemToken
  )
  incidentClient.getCurrentDraftReport.mockResolvedValue({ id: 1, a: 'b', incidentDate: 'today' })
  elite2Client.getOffenderDetails.mockResolvedValue({ offenderNo: 'AA123ABC', agencyId: 'MDI' })
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('updateAgencyId', () => {
  it('incidentClient.updateAgencyId should be called', async () => {
    await service.updateAgencyId('BXI', 'CA user', 1)
    expect(incidentClient.updateAgencyId).toBeCalledWith('BXI', 'CA user', 1)
  })
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
      { userId: 'USER_1', name: 'June', email: 'user1@example.com', statementId: 1 },
      { userId: currentUser.username, name: 'Tracy', email: 'user2@example.com', statementId: 2 },
      { userId: 'USER_3', name: 'Alice', email: 'user3@example.com', statementId: 3 },
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

describe('getCurrentDraft', () => {
  test('it should call query on db', async () => {
    await service.getCurrentDraft('user1', 1)
    expect(incidentClient.getCurrentDraftReport).toBeCalledTimes(1)
  })

  test('it should return the first row', async () => {
    const output = await service.getCurrentDraft('user1', 1)
    expect(output).toEqual({ id: 1, a: 'b', incidentDate: 'today' })
  })
})

describe('getReport', () => {
  test('it should call query on db', async () => {
    incidentClient.getReport.mockResolvedValue({})
    await service.getReport('user1', 1)
    expect(incidentClient.getReport).toBeCalledTimes(1)
    expect(incidentClient.getReport).toBeCalledWith('user1', 1)
  })

  test('it should throw an error if report doesnt exist', async () => {
    await expect(service.getReport('user1', 1)).rejects.toThrow('Report does not exist: 1')
  })
})

describe('getReports', () => {
  test('it should call query on db', async () => {
    offenderService.getOffenderNames.mockResolvedValue({ AA1234A: 'James Stuart' })
    const metaData = { min: 1, max: 1, page: 1, totalCount: 1, totalPages: 1 }
    incidentClient.getReports.mockResolvedValue(
      new PageResponse(metaData, [
        {
          id: 1,
          bookingId: 2,
          incidentDate: new Date(1),
          offenderNo: 'AA1234A',
          reporterName: 'BOB',
          status: 'IN_PROGRESS',
        },
      ])
    )
    const result = await service.getReports('user1', 1)
    expect(result).toEqual(
      new PageResponse(metaData, [
        {
          bookingId: 2,
          id: 1,
          incidentdate: new Date(1),
          offenderName: 'James Stuart',
          offenderNo: 'AA1234A',
          staffMemberName: 'BOB',
          status: 'IN_PROGRESS',
        },
      ])
    )
    expect(incidentClient.getReports).toBeCalledWith('user1', 1)
  })
})

describe('update', () => {
  test('should call update and pass in the form when form id is present', async () => {
    const formObject = { decision: 'Yes', followUp1: 'County', followUp2: 'Town' }

    await service.update({
      currentUser,
      bookingId: 1,
      formId: 'form1',
      formObject,
      incidentDate: { value: '21/12/2010' },
    })

    expect(incidentClient.updateDraftReport).toBeCalledTimes(1)
    expect(incidentClient.updateDraftReport).toBeCalledWith('form1', '21/12/2010', formObject)
  })

  test('doesnt call update if neither form or incident present', async () => {
    await service.update({
      currentUser,
      bookingId: 1,
      formId: 'form1',
      formObject: null,
      incidentDate: { value: null },
    })

    expect(incidentClient.updateDraftReport).not.toBeCalled()
  })

  test('Still call update if form is present but incident date isnt', async () => {
    const formObject = { decision: 'Yes', followUp1: 'County', followUp2: 'Town' }

    await service.update({
      currentUser,
      bookingId: 1,
      formId: 'form1',
      formObject,
      incidentDate: { value: null },
    })

    expect(incidentClient.updateDraftReport).toBeCalledTimes(1)
    expect(incidentClient.updateDraftReport).toBeCalledWith('form1', null, formObject)
  })

  test('Still call update if incident date is present but form object isnt', async () => {
    await service.update({
      currentUser,
      bookingId: 1,
      formId: 'form1',
      formObject: {},
      incidentDate: { value: '09/08/2019' },
    })

    expect(incidentClient.updateDraftReport).toBeCalledTimes(1)
    expect(incidentClient.updateDraftReport).toBeCalledWith('form1', '09/08/2019', null)
  })
})

describe('create', () => {
  test('should call createDraftReport when form id not present', async () => {
    const formObject = { decision: 'Yes', followUp1: 'County', followUp2: 'Town' }

    await service.update({
      currentUser,
      bookingId: 1,
      formObject,
      formId: null,
      incidentDate: { value: '2/2/2019' },
    })

    expect(incidentClient.createDraftReport).toBeCalledTimes(1)
    expect(incidentClient.createDraftReport).toBeCalledWith({
      userId: 'user1',
      bookingId: 1,
      agencyId: 'MDI',
      offenderNo: 'AA123ABC',
      reporterName: 'Bob Smith',
      formResponse: formObject,
      incidentDate: '2/2/2019',
    })
    expect(elite2ClientBuilder).toHaveBeenCalledWith('system-token-1')
  })

  describe('deleteReport', () => {
    test('when report exists', async () => {
      incidentClient.getReportForReviewer.mockResolvedValue({})

      await service.deleteReport('currentUser', 1)

      expect(incidentClient.deleteReport).toBeCalledWith(1)
    })
    test('when report does not exists', async () => {
      incidentClient.getReportForReviewer.mockReturnValue(null)

      await expect(service.deleteReport('currentUser', 1)).rejects.toThrow(`Report: '1' does not exist`)

      expect(incidentClient.deleteReport).not.toHaveBeenCalled()
    })
  })
})
