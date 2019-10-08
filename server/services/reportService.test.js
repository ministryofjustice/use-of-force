const moment = require('moment')
const serviceCreator = require('./reportService')
const { ReportStatus } = require('../config/types')

const incidentClient = {
  getCurrentDraftReport: jest.fn(),
  getReport: jest.fn(),
  getReports: jest.fn(),
  getReportForReviewer: jest.fn(),
  getReportsForReviewer: jest.fn(),
  updateDraftReport: jest.fn(),
  createDraftReport: jest.fn(),
  submitReport: jest.fn(),
  commitAndStartNewTransaction: jest.fn(),
  getIncompleteReportsForReviewer: jest.fn(),
  getCompletedReportsForReviewer: jest.fn(),
}

const notificationService = {
  sendStatementRequest: jest.fn(),
}

const involvedStaffService = {
  save: jest.fn(),
}

const elite2Client = {
  getOffenderDetails: jest.fn(),
}

const currentUser = { username: 'user1', displayName: 'Bob Smith' }

let service

beforeEach(() => {
  const elite2ClientBuilder = jest.fn()
  elite2ClientBuilder.mockReturnValue(elite2Client)

  service = serviceCreator({ incidentClient, elite2ClientBuilder, involvedStaffService, notificationService })
  incidentClient.getCurrentDraftReport.mockReturnValue({ id: 'form-1', a: 'b', incidentDate: 'today' })
  elite2Client.getOffenderDetails.mockReturnValue({ offenderNo: 'AA123ABC', agencyId: 'MDI' })
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('submit', () => {
  test('it should save statements and submit the report', async () => {
    involvedStaffService.save.mockReturnValue([])

    const now = moment('2019-09-06 21:26:18')
    const deadline = moment(now).add(3, 'days')
    const result = await service.submit(currentUser, 'booking-1', now)

    expect(result).toEqual('form-1')
    expect(involvedStaffService.save).toBeCalledTimes(1)
    expect(involvedStaffService.save).toBeCalledWith('form-1', now, deadline, currentUser)

    expect(incidentClient.submitReport).toBeCalledTimes(1)
    expect(incidentClient.submitReport).toBeCalledWith(currentUser.username, 'booking-1', now.toDate())
    expect(incidentClient.commitAndStartNewTransaction).toBeCalledTimes(1)
  })

  test('it should send statements requests out', async () => {
    involvedStaffService.save.mockReturnValue([
      { userId: 'USER_1', name: 'June', email: 'user1@example.com', statementId: 1 },
      { userId: currentUser.username, name: 'Tracy', email: 'user2@example.com', statementId: 2 },
      { userId: 'USER_3', name: 'Alice', email: 'user3@example.com', statementId: 3 },
    ])

    const now = moment('2019-09-06 21:26:18')
    const deadline = moment(now).add(3, 'days')
    await service.submit(currentUser, 'booking-1', now, deadline)

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
          reportId: 'form-1',
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
          reportId: 'form-1',
          statementId: 3,
        },
      ],
    ])
  })
})

describe('getCurrentDraft', () => {
  test('it should call query on db', async () => {
    await service.getCurrentDraft('user1')
    expect(incidentClient.getCurrentDraftReport).toBeCalledTimes(1)
  })

  test('it should return the first row', async () => {
    const output = await service.getCurrentDraft('user1')
    expect(output).toEqual({ id: 'form-1', a: 'b', incidentDate: 'today' })
  })
})

describe('getReport', () => {
  test('it should call query on db', async () => {
    await service.getReport('user1', 'report1')
    expect(incidentClient.getReport).toBeCalledTimes(1)
    expect(incidentClient.getReport).toBeCalledWith('user1', 'report1')
  })
})

describe('getReports', () => {
  test('it should call query on db', async () => {
    incidentClient.getReports.mockReturnValue({ rows: [{ id: 1 }] })
    const result = await service.getReports('user1', [ReportStatus.SUBMITTED])
    expect(result).toEqual([{ id: 1 }])
    expect(incidentClient.getReports).toBeCalledWith('user1', [ReportStatus.SUBMITTED])
  })
})

describe('update', () => {
  test('should call update and pass in the form when form id is present', async () => {
    const formObject = { decision: 'Yes', followUp1: 'County', followUp2: 'Town' }
    const involvedStaff = [{ name: 'Bob', username: 'BOB', email: 'bob@gov.uk' }]

    await service.update({
      currentUser,
      bookingId: 1,
      formId: 'form1',
      formObject,
      incidentDate: { value: '21/12/2010' },
      involvedStaff,
    })

    expect(incidentClient.updateDraftReport).toBeCalledTimes(1)
    expect(incidentClient.updateDraftReport).toBeCalledWith('form1', '21/12/2010', formObject)
  })

  test('doesnt call update if neither form or incident present', async () => {
    const involvedStaff = [{ name: 'Bob', username: 'BOB', email: 'bob@gov.uk' }]

    await service.update({
      currentUser,
      bookingId: 1,
      formId: 'form1',
      formObject: null,
      incidentDate: { value: null },
      involvedStaff,
    })

    expect(incidentClient.updateDraftReport).not.toBeCalled()
  })

  test('Still call update if form is present but incident date isnt', async () => {
    const formObject = { decision: 'Yes', followUp1: 'County', followUp2: 'Town' }
    const involvedStaff = [{ name: 'Bob', username: 'BOB', email: 'bob@gov.uk' }]

    await service.update({
      currentUser,
      bookingId: 1,
      formId: 'form1',
      formObject,
      incidentDate: { value: null },
      involvedStaff,
    })

    expect(incidentClient.updateDraftReport).toBeCalledTimes(1)
    expect(incidentClient.updateDraftReport).toBeCalledWith('form1', null, formObject)
  })

  test('Still call update if incident date is present but form object isnt', async () => {
    const involvedStaff = [{ name: 'Bob', username: 'BOB', email: 'bob@gov.uk' }]

    await service.update({
      currentUser,
      bookingId: 1,
      formId: 'form1',
      formObject: {},
      incidentDate: { value: '09/08/2019' },
      involvedStaff,
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
  })
})
