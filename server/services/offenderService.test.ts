import OffenderService from './offenderService'

const token = 'token-1'

const prisonClient = {
  getOffenderDetails: jest.fn(),
  getLocations: jest.fn(),
  getOffenderImage: jest.fn(),
  getOffenders: jest.fn(),
}

const prisonClientBuilder = jest.fn()

let service

beforeEach(() => {
  prisonClientBuilder.mockReturnValue(prisonClient)
  service = new OffenderService(prisonClientBuilder)
})

afterEach(() => {
  prisonClient.getOffenderDetails.mockReset()
  prisonClient.getOffenderImage.mockReset()
})

describe('getOffenderDetails', () => {
  it('should format display name', async () => {
    const details = { firstName: 'SAM', lastName: 'SMITH', dateOfBirth: '1980-12-31' }
    prisonClient.getOffenderDetails.mockReturnValue(details)
    const result = await service.getOffenderDetails(token, -5)

    expect(result).toEqual({
      ...details,
      dateOfBirth: '1980-12-31',
      displayName: 'Sam Smith',
    })
  })

  it('should use the token', async () => {
    const details = { firstName: 'SAM', lastName: 'SMITH' }
    prisonClient.getOffenderDetails.mockReturnValue(details)
    prisonClient.getLocations.mockReturnValue([])
    await service.getOffenderDetails(token, -5)

    expect(prisonClientBuilder).toHaveBeenCalledWith(token)
  })
})

describe('getOffenderImage', () => {
  it('Can retrieve image', () => {
    const image = 'a stream'
    prisonClient.getOffenderImage.mockReturnValue(image)
    service.getOffenderImage(token, -5)

    expect(prisonClientBuilder).toHaveBeenCalledWith(token)
    expect(prisonClient.getOffenderImage).toHaveBeenCalledWith(-5)
  })
})

describe('getOffenders', () => {
  it('Can retrieve offenders', async () => {
    const offenders = [
      { offenderNo: 'AAA', firstName: 'SAM', lastName: 'SMITH' },
      { offenderNo: 'BBB', firstName: 'BEN', lastName: 'SMITH' },
    ]
    prisonClient.getOffenders.mockReturnValue(offenders)

    const offenderNos = ['AAA', 'BBB', 'AAA']
    const names = await service.getOffenderNames(token, offenderNos)

    expect(names).toEqual({ AAA: 'Smith, Sam', BBB: 'Smith, Ben' })
    expect(prisonClientBuilder).toHaveBeenCalledWith(token)
    expect(prisonClient.getOffenders).toHaveBeenCalledWith(['AAA', 'BBB'])
  })
})
