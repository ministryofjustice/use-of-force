const serviceCreator = require('./offenderService')

const token = 'token-1'

const elite2Client = {
  getOffenderDetails: jest.fn(),
}

const elite2ClientBuilder = jest.fn()

let service

beforeEach(() => {
  elite2ClientBuilder.mockReturnValue(elite2Client)
  service = serviceCreator(elite2ClientBuilder)
})

afterEach(() => {
  elite2Client.getOffenderDetails.mockReset()
})

describe('getOffenderDetails', () => {
  it('should format display name', async () => {
    const details = { firstName: 'SAM', lastName: 'SMITH' }
    elite2Client.getOffenderDetails.mockReturnValue(details)

    const result = await service.getOffenderDetails(token, -5)

    expect(result).toEqual({ ...details, displayName: 'Sam Smith' })
  })

  it('should use the user token', async () => {
    const details = { firstName: 'SAM', lastName: 'SMITH' }
    elite2Client.getOffenderDetails.mockReturnValue(details)

    await service.getOffenderDetails(token, -5)

    expect(elite2ClientBuilder).toBeCalledWith(token)
  })
})
