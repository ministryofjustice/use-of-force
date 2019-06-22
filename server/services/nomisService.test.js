const serviceCreator = require('./nomisService')

const token = 'token-1'

const nomisClient = {
  getOffenderDetails: jest.fn(),
}

const nomisClientBuilder = jest.fn()

let service

beforeEach(() => {
  nomisClientBuilder.mockReturnValue(nomisClient)
  service = serviceCreator(nomisClientBuilder)
})

afterEach(() => {
  nomisClient.getOffenderDetails.mockReset()
})

describe('getOffenderDetails', () => {
  it('should format display name', async () => {
    const details = { firstName: 'SAM', lastName: 'SMITH' }
    nomisClient.getOffenderDetails.mockReturnValue(details)

    const result = await service.getOffenderDetails(token, -5)

    expect(result).toEqual({ ...details, displayName: 'Sam Smith' })
  })

  it('should use the user token', async () => {
    const details = { firstName: 'SAM', lastName: 'SMITH' }
    nomisClient.getOffenderDetails.mockReturnValue(details)

    await service.getOffenderDetails(token, -5)

    expect(nomisClientBuilder).toBeCalledWith(token)
  })
})
