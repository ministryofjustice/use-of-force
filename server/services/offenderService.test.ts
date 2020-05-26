import offenderServiceCreator from './offenderService'
import locationServiceCreator from './locationService'

const token = 'token-1'

const elite2Client = {
  getOffenderDetails: jest.fn(),
  getLocations: jest.fn(),
  getOffenderImage: jest.fn(),
  getOffenders: jest.fn(),
}

const elite2ClientBuilder = jest.fn()
const incidentClient = jest.fn()

let offenderService
let locationService

beforeEach(() => {
  elite2ClientBuilder.mockReturnValue(elite2Client)
  offenderService = offenderServiceCreator(elite2ClientBuilder)
  locationService = locationServiceCreator(elite2ClientBuilder, incidentClient)
})

afterEach(() => {
  elite2Client.getOffenderDetails.mockReset()
  elite2Client.getOffenderImage.mockReset()
})

describe('getOffenderDetails', () => {
  it('should format display name', async () => {
    const details = { firstName: 'SAM', lastName: 'SMITH', dateOfBirth: '1980-12-31' }
    elite2Client.getOffenderDetails.mockReturnValue(details)
    const result = await offenderService.getOffenderDetails(token, -5)

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
    await offenderService.getOffenderDetails(token, -5)

    expect(elite2ClientBuilder).toBeCalledWith(token)
  })
})

describe('getOffenderImage', () => {
  it('Can retrieve image', () => {
    const image = 'a stream'
    elite2Client.getOffenderImage.mockReturnValue(image)
    offenderService.getOffenderImage(token, -5)

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
    const names = await offenderService.getOffenderNames(token, offenderNos)

    expect(names).toEqual({ AAA: 'Smith, Sam', BBB: 'Smith, Ben' })
    expect(elite2ClientBuilder).toBeCalledWith(token)
    expect(elite2Client.getOffenders).toBeCalledWith(['AAA', 'BBB'])
  })

  describe('getIncidentLocations', () => {
    it('should retrieve locations', async () => {
      elite2Client.getLocations.mockReturnValue([])

      const result = await locationService.getIncidentLocations(token, 'WRI')

      expect(result).toEqual([])
      expect(elite2Client.getLocations).toBeCalledWith('WRI')
    })

    it('should sort retrieved locations with top 2 primary locations at the begining', async () => {
      elite2Client.getLocations.mockReturnValue([
        { id: 2, userDescription: 'place 2' },
        { id: 6, userDescription: 'Other cell' },
        { id: 3, userDescription: 'place 3' },
        { id: 5, userDescription: "Prisoner's cell" },
        { id: 1, userDescription: 'place 1' },
        { id: 4, userDescription: 'place 4' },
      ])

      const result = await locationService.getIncidentLocations(token, 'WRI')

      expect(result).toEqual([
        { id: 5, userDescription: "Prisoner's cell" },
        { id: 6, userDescription: 'Other cell' },
        { id: 1, userDescription: 'place 1' },
        { id: 2, userDescription: 'place 2' },
        { id: 3, userDescription: 'place 3' },
        { id: 4, userDescription: 'place 4' },
      ])
    })

    it('should sort retrieved locations with only 1 primary location at the begining', async () => {
      elite2Client.getLocations.mockReturnValue([
        { id: 2, userDescription: 'place 2' },
        { id: 3, userDescription: 'place 3' },
        { id: 5, userDescription: "Prisoner's cell" },
        { id: 1, userDescription: 'place 1' },
        { id: 4, userDescription: 'place 4' },
      ])

      const result = await locationService.getIncidentLocations(token, 'WRI')

      expect(result).toEqual([
        { id: 5, userDescription: "Prisoner's cell" },
        { id: 1, userDescription: 'place 1' },
        { id: 2, userDescription: 'place 2' },
        { id: 3, userDescription: 'place 3' },
        { id: 4, userDescription: 'place 4' },
      ])
    })

    it('should sort retrieved locations with zero primary locations at the begining', async () => {
      elite2Client.getLocations.mockReturnValue([
        { id: 2, userDescription: 'place 2' },
        { id: 3, userDescription: 'place 3' },
        { id: 1, userDescription: 'place 1' },
        { id: 4, userDescription: 'place 4' },
      ])

      const result = await locationService.getIncidentLocations(token, 'WRI')

      expect(result).toEqual([
        { id: 1, userDescription: 'place 1' },
        { id: 2, userDescription: 'place 2' },
        { id: 3, userDescription: 'place 3' },
        { id: 4, userDescription: 'place 4' },
      ])
    })

    it('should sort retrieved locations with zero other locations', async () => {
      elite2Client.getLocations.mockReturnValue([
        { id: 6, userDescription: 'Other cell' },
        { id: 5, userDescription: "Prisoner's cell" },
      ])

      const result = await locationService.getIncidentLocations(token, 'WRI')

      expect(result).toEqual([
        { id: 5, userDescription: "Prisoner's cell" },
        { id: 6, userDescription: 'Other cell' },
      ])
    })

    it('should use token', async () => {
      await locationService.getIncidentLocations(token, 'WRI')

      expect(elite2ClientBuilder).toBeCalledWith(token)
    })
  })
})
