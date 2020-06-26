import PrisonerSearchService from './prisonerSearchService'
import PrisonerSearchClient from '../data/prisonerSearchClient'

const search = jest.fn()

jest.mock('../data/prisonerSearchClient', () => {
  return jest.fn().mockImplementation(() => {
    return { search }
  })
})

let elite2Client
let elite2ClientBuilder
let systemToken

let service: PrisonerSearchService

beforeEach(() => {
  elite2Client = { getPrisons: jest.fn() }
  elite2ClientBuilder = jest.fn().mockReturnValue(elite2Client)
  systemToken = async (user: string): Promise<string> => `${user}-token-1`
  service = new PrisonerSearchService(PrisonerSearchClient, elite2ClientBuilder, systemToken)
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('prisonerSearchService', () => {
  describe('search', () => {
    it('search passes down arg', async () => {
      elite2Client.getPrisons.mockResolvedValue([{ agencyId: 'MDI', description: 'HMP Moorland' }])

      search.mockResolvedValue([
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
      expect(PrisonerSearchClient).toBeCalledWith('user1-token-1')
    })
  })

  describe('getPrisons', () => {
    it('get Prisons passes down arg', async () => {
      const expected = [{ agencyId: 'MDI', description: 'HMP Moorlands' }]
      elite2Client.getPrisons.mockResolvedValue(expected)
      const results = await service.getPrisons('user1')
      expect(results).toStrictEqual(expected)
      expect(elite2ClientBuilder).toBeCalledWith('user1-token-1')
    })
  })
})
