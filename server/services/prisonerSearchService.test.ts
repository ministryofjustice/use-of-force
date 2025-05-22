import PrisonerSearchService from './prisonerSearchService'
import { PrisonClient, PrisonerSearchClient } from '../data'
import { Prison } from '../data/prisonClientTypes'
import AuthService from './authService'

jest.mock('../data')
jest.mock('../services/authService')

const prisonClient = new PrisonClient() as jest.Mocked<PrisonClient>
const prisonerSearchClient = new PrisonerSearchClient() as jest.Mocked<PrisonerSearchClient>
const authService = new AuthService(null) as jest.Mocked<AuthService>

let service: PrisonerSearchService

beforeEach(() => {
  authService.getSystemClientToken.mockResolvedValue('user1-token-1')
  service = new PrisonerSearchService(prisonerSearchClient, prisonClient, authService)
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('prisonerSearchService', () => {
  describe('search', () => {
    it('search passes down arg', async () => {
      prisonClient.getPrisons.mockResolvedValue([{ agencyId: 'MDI', description: 'HMP Moorland' } as Prison])

      prisonerSearchClient.search.mockResolvedValue([
        {
          bookingId: 1,
          firstName: 'JOHN',
          lastName: 'SMITH',
          prisonId: 'MDI',
          prisonerNumber: 'AAA122AB',
        },
      ])
      const results = await service.search('user1', { prisonNumber: 'ABC123AA' })
      expect(results).toStrictEqual([
        {
          bookingId: 1,
          name: 'Smith, John',
          prison: 'HMP Moorland',
          prisonNumber: 'AAA122AB',
        },
      ])
      expect(prisonerSearchClient.search).toHaveBeenCalledWith({ prisonNumber: 'ABC123AA' }, 'user1-token-1')
    })
  })

  describe('getPrisons', () => {
    it('get Prisons passes down arg', async () => {
      const expected = [{ agencyId: 'MDI', description: 'HMP Moorlands' } as Prison]
      prisonClient.getPrisons.mockResolvedValue(expected)
      const results = await service.getPrisons('user1')
      expect(results).toStrictEqual(expected)
      expect(prisonClient.getPrisons).toHaveBeenCalledWith('user1-token-1')
    })

    it('sorts lists of Prisons alphabetically', async () => {
      const unsortedPrisonList = [
        { agencyId: 'RSI', description: 'HMP Risley' },
        { agencyId: 'MDI', description: 'HMP Moorlands' },
        { agencyId: 'LEI', description: 'HMP Leeds' },
      ] as Prison[]
      prisonClient.getPrisons.mockResolvedValue(unsortedPrisonList)
      const results = await service.getPrisons('user1')
      expect(results).toStrictEqual([
        { agencyId: 'LEI', description: 'HMP Leeds' },
        { agencyId: 'MDI', description: 'HMP Moorlands' },
        { agencyId: 'RSI', description: 'HMP Risley' },
      ])
    })
  })
})
