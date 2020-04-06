import serviceCreator from './offenderService'

const token = 'token-1'

const elite2Client = {
  getOffenderDetails: jest.fn(),
  getLocations: jest.fn(),
  getOffenderImage: jest.fn(),
  getOffenders: jest.fn(),
}

const elite2ClientBuilder = jest.fn()

let service

beforeEach(() => {
  elite2ClientBuilder.mockReturnValue(elite2Client)
  service = serviceCreator(elite2ClientBuilder)
})

afterEach(() => {
  elite2Client.getOffenderDetails.mockReset()
  elite2Client.getOffenderImage.mockReset()
})

describe('getOffenderDetails', () => {
  it('should format display name', async () => {
    const details = { firstName: 'SAM', lastName: 'SMITH', dateOfBirth: '1980-12-31' }
    elite2Client.getOffenderDetails.mockReturnValue(details)
    const result = await service.getOffenderDetails(token, -5)

    expect(result).toEqual({
      ...details,
      dateOfBirth: '1980-12-31',
      displayName: 'Sam Smith',
    })
  })

  it('should use the token', async () => {
    const details = { firstName: 'SAM', lastName: 'SMITH' }
    elite2Client.getOffenderDetails.mockReturnValue(details)
    elite2Client.getLocations.mockReturnValue([])
    await service.getOffenderDetails(token, -5)

    expect(elite2ClientBuilder).toBeCalledWith(token)
  })
})

describe('getOffenderImage', () => {
  it('Can retrieve image', () => {
    const image = 'a stream'
    elite2Client.getOffenderImage.mockReturnValue(image)
    service.getOffenderImage(token, -5)

    expect(elite2ClientBuilder).toBeCalledWith(token)
    expect(elite2Client.getOffenderImage).toBeCalledWith(-5)
  })
})

describe('getOffenders', () => {
  it('Can retrieve offenders', async () => {
    const offenders = [
      { offenderNo: 'AAA', firstName: 'SAM', lastName: 'SMITH' },
      { offenderNo: 'BBB', firstName: 'BEN', lastName: 'SMITH' },
    ]
    elite2Client.getOffenders.mockReturnValue(offenders)

    const offenderNos = ['AAA', 'BBB', 'AAA']
    const names = await service.getOffenderNames(token, offenderNos)

    expect(names).toEqual({ AAA: 'Smith, Sam', BBB: 'Smith, Ben' })
    expect(elite2ClientBuilder).toBeCalledWith(token)
    expect(elite2Client.getOffenders).toBeCalledWith(['AAA', 'BBB'])
  })

  describe('getIncidentLocations', () => {
    it('should retrieve locations', async () => {
      elite2Client.getLocations.mockReturnValue([])

      const result = await service.getIncidentLocations(token, 'WRI')

      expect(result).toEqual([])
      expect(elite2Client.getLocations).toBeCalledWith('WRI')
    })

    it('should use token', async () => {
      await service.getIncidentLocations(token, 'WRI')

      expect(elite2ClientBuilder).toBeCalledWith(token)
    })
  })
})
