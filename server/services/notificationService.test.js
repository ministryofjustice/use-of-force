const { createNotificationService } = require('./notificationService')
const {
  links: { emailUrl },
  email: {
    templates: { involvedStaff, reporter },
  },
} = require('../config')

const client = {
  sendEmail: jest.fn(),
}

let service

beforeEach(() => {
  client.sendEmail.mockResolvedValue('response 1')
  service = createNotificationService(client)
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('send reporter notifications', () => {
  test('sendReporterStatementReminder', async () => {
    const incidentDate = new Date(2019, 1, 12, 15, 45)
    const overdueDate = new Date(2019, 1, 16, 16, 45)

    await service.sendReporterStatementReminder('user@email.com', {
      reporterName: 'Jane Smith',
      incidentDate,
      overdueDate,
    })

    expect(client.sendEmail).toBeCalledWith(reporter.REMINDER, 'user@email.com', {
      personalisation: {
        DEADLINE_DATE: 'Saturday 16 February',
        DEADLINE_TIME: '16:45',
        INCIDENT_DATE: 'Tuesday 12 February',
        INCIDENT_TIME: '15:45',
        REPORTER_NAME: 'Jane Smith',
        LINK: emailUrl,
      },
      reference: null,
    })
  })

  test('sendReporterStatementOverdue', async () => {
    const incidentDate = new Date(2019, 1, 12, 15, 45)
    await service.sendReporterStatementOverdue('user@email.com', { reporterName: 'Jane Smith', incidentDate })

    expect(client.sendEmail).toBeCalledWith(reporter.OVERDUE, 'user@email.com', {
      personalisation: {
        INCIDENT_DATE: 'Tuesday 12 February',
        INCIDENT_TIME: '15:45',
        REPORTER_NAME: 'Jane Smith',
        LINK: emailUrl,
      },
      reference: null,
    })
  })
})

describe('send involved staff notifications', () => {
  test('sendInvolvedStaffStatementReminder', async () => {
    const incidentDate = new Date(2019, 1, 12, 15, 45)
    const overdueDate = new Date(2019, 1, 16, 16, 45)

    await service.sendInvolvedStaffStatementReminder('user@email.com', {
      involvedName: 'Jane Smith',
      incidentDate,
      overdueDate,
    })

    expect(client.sendEmail).toBeCalledWith(involvedStaff.REMINDER, 'user@email.com', {
      personalisation: {
        DEADLINE_DATE: 'Saturday 16 February',
        DEADLINE_TIME: '16:45',
        INCIDENT_DATE: 'Tuesday 12 February',
        INCIDENT_TIME: '15:45',
        INVOLVED_NAME: 'Jane Smith',
        LINK: emailUrl,
      },
      reference: null,
    })
  })

  test('sendInvolvedStaffStatementOverdue', async () => {
    const incidentDate = new Date(2019, 1, 12, 15, 45)
    await service.sendInvolvedStaffStatementOverdue('user@email.com', { involvedName: 'Jane Smith', incidentDate })

    expect(client.sendEmail).toBeCalledWith(involvedStaff.OVERDUE, 'user@email.com', {
      personalisation: {
        INCIDENT_DATE: 'Tuesday 12 February',
        INCIDENT_TIME: '15:45',
        INVOLVED_NAME: 'Jane Smith',
        LINK: emailUrl,
      },
      reference: null,
    })
  })

  test('sendStatementRequest', async () => {
    const incidentDate = new Date(2019, 1, 12, 15, 45)
    const overdueDate = new Date(2019, 1, 16, 16, 45)

    await service.sendStatementRequest('user@email.com', {
      reporterName: 'Jane Smith',
      involvedName: 'Thelma Jones',
      incidentDate,
      overdueDate,
    })

    expect(client.sendEmail).toBeCalledWith(involvedStaff.REQUEST, 'user@email.com', {
      personalisation: {
        DEADLINE_DATE: 'Saturday 16 February',
        DEADLINE_TIME: '16:45',
        INCIDENT_DATE: 'Tuesday 12 February',
        INCIDENT_TIME: '15:45',
        REPORTER_NAME: 'Jane Smith',
        INVOLVED_NAME: 'Thelma Jones',
        LINK: emailUrl,
      },
      reference: null,
    })
  })
})
