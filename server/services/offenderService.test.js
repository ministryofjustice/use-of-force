const serviceCreator = require('./offenderService')

const token = 'token-1'

const userElite2Client = {
  getLocations: jest.fn(),
  getOffenderImage: jest.fn(),
  getOffenders: jest.fn(),
}

const systemElite2Client = {
  getOffenderDetails: jest.fn(),
  getLocations: jest.fn(),
  getOffenderImage: jest.fn(),
  getOffenders: jest.fn(),
}

const userElite2ClientBuilder = jest.fn()
const systemElite2ClientBuilder = jest.fn()

let service

beforeEach(() => {
  userElite2ClientBuilder.mockReturnValue(userElite2Client)
  systemElite2ClientBuilder.mockReturnValue(systemElite2Client)
  service = serviceCreator(userElite2ClientBuilder, systemElite2ClientBuilder)
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('offenderService', () => {
  describe('getOffenderDetails', () => {
    it('should format display name', async () => {
      const details = { firstName: 'SAM', lastName: 'SMITH', dateOfBirth: '1980-12-31' }
      systemElite2Client.getOffenderDetails.mockReturnValue(details)
      systemElite2Client.getLocations.mockReturnValue([
        { locationType: 'BOX', userDescription: 'Box 1' },
        { locationType: 'WING', userDescription: 'Wing A' },
        { locationType: 'WING', userDescription: '' },
        { locationType: 'CELL', userDescription: 'Cell A' },
      ])

      const result = await service.getOffenderDetails(token, -5)

      expect(result).toEqual({
        ...details,
        dateOfBirth: '1980-12-31',
        displayName: 'Sam Smith',
        locations: [],
      })
    })

    it('should use the user token', async () => {
      const details = { firstName: 'SAM', lastName: 'SMITH' }
      systemElite2Client.getOffenderDetails.mockReturnValue(details)
      systemElite2Client.getLocations.mockReturnValue([])
      await service.getOffenderDetails('username-1', -5)

      expect(systemElite2ClientBuilder).toBeCalledWith('username-1')
    })
  })

  describe('getOffenderImage', () => {
    it('Can retrieve image for reviewer', async () => {
      const image = 'a stream'
      systemElite2Client.getOffenderImage.mockReturnValue(image)

      await service.getOffenderImage({ username: 'username-1', isReviewer: true }, -5)

      expect(systemElite2ClientBuilder).toBeCalledWith('username-1')
      expect(systemElite2Client.getOffenderImage).toBeCalledWith(-5)
    })

    it('Can retrieve image for standard user', async () => {
      const image = 'a stream'
      userElite2Client.getOffenderImage.mockReturnValue(image)

      await service.getOffenderImage({ token: 'token-1', isReviewer: false }, -5)

      expect(userElite2ClientBuilder).toBeCalledWith(token)
      expect(userElite2Client.getOffenderImage).toBeCalledWith(-5)
    })
  })

  describe('getOffenderNames', () => {
    it('Can retrieve offenders', async () => {
      const offenders = [
        { offenderNo: 'AAA', firstName: 'SAM', lastName: 'SMITH' },
        { offenderNo: 'BBB', firstName: 'BEN', lastName: 'SMITH' },
      ]
      systemElite2Client.getOffenders.mockReturnValue(offenders)

      const offenderNos = ['AAA', 'BBB', 'AAA']
      const names = await service.getOffenderNames('user-1', offenderNos)

      expect(names).toEqual({ AAA: 'Smith, Sam', BBB: 'Smith, Ben' })
      expect(systemElite2ClientBuilder).toBeCalledWith('user-1')
      expect(systemElite2Client.getOffenders).toBeCalledWith(['AAA', 'BBB'])
    })
  })
})
