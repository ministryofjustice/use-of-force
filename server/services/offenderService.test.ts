import { PassThrough } from 'stream'
import OffenderService from './offenderService'
import { PrisonClient } from '../data'
import { InmateBasicDetails, InmateDetail } from '../data/prisonClientTypes'

const token = 'token-1'
jest.mock('../data')

const prisonClient = new PrisonClient() as jest.Mocked<PrisonClient>

let service

beforeEach(() => {
  service = new OffenderService(prisonClient)
})

afterEach(() => {
  prisonClient.getOffenderDetails.mockReset()
  prisonClient.getOffenderImage.mockReset()
})

describe('getOffenderDetails', () => {
  it('should format display name', async () => {
    const details: Partial<InmateDetail> = { firstName: 'SAM', lastName: 'SMITH', dateOfBirth: new Date('1980-12-31') }
    prisonClient.getOffenderDetails.mockResolvedValue(details)
    const result = await service.getOffenderDetails(token, -5)

    expect(result).toEqual({
      ...details,
      dateOfBirth: '1980-12-31',
      displayName: 'Sam Smith',
    })
  })

  it('should use the token', async () => {
    const details: Partial<InmateDetail> = { firstName: 'SAM', lastName: 'SMITH' }
    prisonClient.getOffenderDetails.mockResolvedValue(details)
    await service.getOffenderDetails(token, -5)

    expect(prisonClient.getOffenderDetails).toBeCalledWith(-5, token)
  })
})

describe('getOffenderImage', () => {
  it('Can retrieve image', () => {
    const image = new PassThrough()
    prisonClient.getOffenderImage.mockResolvedValue(image)
    service.getOffenderImage(token, -5)

    expect(prisonClient.getOffenderImage).toBeCalledWith(-5, token)
  })
})

describe('getOffenders', () => {
  it('Can retrieve offenders', async () => {
    const off1 = { offenderNo: 'AAA', firstName: 'SAM', lastName: 'SMITH' }
    const off2 = { offenderNo: 'BBB', firstName: 'BEN', lastName: 'SMITH' }
    const offenders: Partial<InmateBasicDetails>[] = [off1, off2]

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    prisonClient.getOffenders.mockResolvedValue(offenders)

    const offenderNos = ['AAA', 'BBB', 'AAA']
    const names = await service.getOffenderNames(token, offenderNos)

    expect(names).toEqual({ AAA: 'Smith, Sam', BBB: 'Smith, Ben' })
    expect(prisonClient.getOffenders).toBeCalledWith(['AAA', 'BBB'], token)
  })
})
