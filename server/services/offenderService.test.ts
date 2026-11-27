import { PassThrough } from 'stream'
import OffenderService from './offenderService'
import { PrisonClient, PrisonerSearchClient } from '../data'
import { InmateDetail } from '../data/prisonClientTypes'
import AuthService from './authService'

const token = 'token-1'
jest.mock('../data')
jest.mock('../services/authService')

const prisonClient = new PrisonClient() as jest.Mocked<PrisonClient>
const prisonerSearchClient = new PrisonerSearchClient() as jest.Mocked<PrisonerSearchClient>
const authService = new AuthService(null) as jest.Mocked<AuthService>

let service

beforeEach(() => {
  authService.getSystemClientToken.mockResolvedValue(token)
  service = new OffenderService(prisonClient, authService, prisonerSearchClient)
})

afterEach(() => {
  prisonClient.getOffenderDetails.mockReset()
  prisonClient.getOffenderImage.mockReset()
  prisonerSearchClient.getPrisonerNames.mockReset()
})

describe('getOffenderDetails', () => {
  it('should format display name', async () => {
    const details: Partial<InmateDetail> = { firstName: 'SAM', lastName: 'SMITH', dateOfBirth: new Date('1980-12-31') }
    prisonClient.getOffenderDetails.mockResolvedValue(details)
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const result = await service.getOffenderDetails('12345678', token)

    expect(result).toEqual({
      ...details,
      dateOfBirth: '1980-12-31',
      displayName: 'Sam Smith',
    })
  })

  it('should use the token', async () => {
    const details: Partial<InmateDetail> = { firstName: 'SAM', lastName: 'SMITH' }
    prisonClient.getOffenderDetails.mockResolvedValue(details)
    await service.getOffenderDetails('12345', 'user1')

    expect(prisonClient.getOffenderDetails).toHaveBeenCalledWith('12345', token)
  })
})

describe('getOffenderImage', () => {
  it('Can retrieve image', () => {
    const image = new PassThrough()
    prisonClient.getOffenderImage.mockResolvedValue(image)
    service.getOffenderImage('12345', token)

    expect(prisonClient.getOffenderImage).toHaveBeenCalledWith(token, '12345')
  })
})

describe('getOffenderNames', () => {
  it('retrieves prisoner names from Prisoner Search API', async () => {
    prisonerSearchClient.getPrisonerNames.mockResolvedValue([
      { prisonerNumber: 'AAA', firstName: 'SAM', lastName: 'SMITH' },
      { prisonerNumber: 'BBB', firstName: 'BEN', lastName: 'SMITH-JONES' },
    ])

    const names = await service.getOffenderNames(token, ['AAA', 'BBB', 'AAA'])

    expect(names).toEqual({ AAA: 'Smith, Sam', BBB: 'Smith-Jones, Ben' })
    expect(prisonerSearchClient.getPrisonerNames).toHaveBeenCalledTimes(1)
    expect(prisonerSearchClient.getPrisonerNames).toHaveBeenCalledWith(['AAA', 'BBB'], token)
  })

  it('Makes no call when there are no prison numbers', async () => {
    const names = await service.getOffenderNames(token, [])

    expect(names).toEqual({})
    expect(prisonerSearchClient.getPrisonerNames).not.toHaveBeenCalled()
  })

  it('Leaves out prison numbers that Prisoner Search does not return', async () => {
    prisonerSearchClient.getPrisonerNames.mockResolvedValue([
      { prisonerNumber: 'AAA', firstName: 'SAM', lastName: 'SMITH' },
    ])

    const names = await service.getOffenderNames(token, ['AAA', 'ZZZ'])

    expect(names).toEqual({ AAA: 'Smith, Sam' })
  })

  it('Splits more than 1,000 prison numbers into batches', async () => {
    const prisonNumbers = Array.from({ length: 2001 }, (_, i) => `A${i.toString().padStart(4, '0')}AA`)
    prisonerSearchClient.getPrisonerNames.mockImplementation(async batch =>
      batch.map(prisonerNumber => ({ prisonerNumber, firstName: 'SAM', lastName: 'SMITH' })),
    )

    const names = await service.getOffenderNames(token, prisonNumbers)

    expect(prisonerSearchClient.getPrisonerNames).toHaveBeenCalledTimes(3)
    expect(prisonerSearchClient.getPrisonerNames.mock.calls.map(([batch]) => batch.length)).toEqual([1000, 1000, 1])
    expect(Object.keys(names)).toHaveLength(2001)
  })
})
